import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updatePostInFirestore, deletePostFromFirestore, getPostByIdFromFirestore } from '@/lib/firestore';
import { updateRuntimePost, upsertRuntimePost, deleteRuntimePost } from '@/lib/posts-store';
import { posts as staticPosts } from '@/lib/data';
import { isManager } from '@/lib/rbac';
import { BlogPost, UserRole } from '@/types';
import { getAdminDb } from '@/lib/firebase-admin';

const allowFallback = process.env.NODE_ENV !== 'production';
const OWNER_EDITABLE_FIELDS: Array<keyof BlogPost> = [
  'title',
  'content',
  'excerpt',
  'category',
  'tags',
  'coverImage',
  'slug',
];

function decodeEscapedHtmlIfNeeded(content: string): string {
  if (!content) return content;
  const hasEscapedTags = /&(amp;)?lt;\/?[a-z]/i.test(content) || /&#x?0*3c;/i.test(content);
  if (!hasEscapedTags) return content;

  const decodeOnce = (value: string): string =>
    value
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x2F;/gi, '/')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));

  let decoded = content;
  for (let i = 0; i < 4; i += 1) {
    const next = decodeOnce(decoded);
    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
}

// ─── PATCH /api/posts/[id] ─────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as Partial<BlogPost>;
  const existingPost = await getPostByIdFromFirestore(id);

  if (!existingPost) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const userRole = session.user.role as UserRole;
  const managerUser = isManager(userRole);
  const userEmail = (session.user.email ?? '').toLowerCase();
  const authorEmail = (existingPost.author?.email ?? '').toLowerCase();
  const ownsPost = !!userEmail && userEmail === authorEmail;

  if (!managerUser && !ownsPost) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Status and premium changes require manager
  if (body.status !== undefined || body.isPremium !== undefined) {
    if (!managerUser) {
      return NextResponse.json({ error: 'Only managers can change post status or premium flag' }, { status: 403 });
    }
  }

  const updateData: Partial<BlogPost> = managerUser
    ? { ...body }
    : OWNER_EDITABLE_FIELDS.reduce((acc, key) => {
        if (body[key] !== undefined) {
          // Use type assertion to properly assign the value
          acc[key] = body[key] as any;
        }
        return acc;
      }, {} as Partial<BlogPost>);

  delete updateData.id;

  if (updateData.content) {
    updateData.content = decodeEscapedHtmlIfNeeded(updateData.content);
    const words = updateData.content.split(/\s+/).length;
    updateData.readingTime = Math.max(1, Math.round(words / 200));
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    if (!getAdminDb() && !allowFallback) {
      return NextResponse.json({ error: 'Persistent datastore is unavailable for updates' }, { status: 503 });
    }
    // Set publishedAt when a post is first published
    if (updateData.status === 'published' && !updateData.publishedAt) {
      updateData.publishedAt = new Date().toISOString();
    }
    await updatePostInFirestore(id, updateData);
    // Keep runtime store in sync so in-server-memory reads are also up to date
    if (allowFallback) {
      updateRuntimePost(id, updateData);
    }
    return NextResponse.json({ success: true });
  } catch {
    if (!allowFallback) {
      return NextResponse.json({ error: 'Persistent datastore is unavailable for updates' }, { status: 503 });
    }
    // Firestore unavailable — fall back to in-memory runtime store.
    // updateRuntimePost only works for posts already in the runtime store.
    // For static posts (seeded from lib/data.ts), we copy them in first.
    let updated = updateRuntimePost(id, updateData);
    if (!updated) {
      const staticPost = staticPosts.find((p) => p.id === id);
      if (staticPost) {
        const fallbackUpdateData: Partial<BlogPost> = { ...updateData };
        if (fallbackUpdateData.status === 'published' && !fallbackUpdateData.publishedAt) {
          fallbackUpdateData.publishedAt = new Date().toISOString();
        }
        upsertRuntimePost({ ...staticPost, ...fallbackUpdateData, updatedAt: new Date().toISOString() });
        updated = true;
      }
    }
    if (!updated) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }
}

// ─── DELETE /api/posts/[id] ────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existingPost = await getPostByIdFromFirestore(id);

  if (!existingPost) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const userRole = session.user.role as UserRole;
  const managerUser = isManager(userRole);
  const userEmail = (session.user.email ?? '').toLowerCase();
  const authorEmail = (existingPost.author?.email ?? '').toLowerCase();
  const ownsPost = !!userEmail && userEmail === authorEmail;

  if (!managerUser && !ownsPost) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await deletePostFromFirestore(id);
  } catch {
    if (!allowFallback) {
      return NextResponse.json({ error: 'Persistent datastore is unavailable for delete' }, { status: 503 });
    }
    deleteRuntimePost(id);
  }

  return NextResponse.json({ success: true });
}
