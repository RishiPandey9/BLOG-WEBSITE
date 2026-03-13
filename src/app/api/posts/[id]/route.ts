import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updatePostInFirestore, deletePostFromFirestore } from '@/lib/firestore';
import { updateRuntimePost, upsertRuntimePost, deleteRuntimePost } from '@/lib/posts-store';
import { posts as staticPosts } from '@/lib/data';
import { isManager } from '@/lib/rbac';
import { BlogPost, UserRole } from '@/types';
import { getAdminDb } from '@/lib/firebase-admin';

const allowFallback = process.env.NODE_ENV !== 'production';

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

  // Status and premium changes require manager
  if (body.status !== undefined || body.isPremium !== undefined) {
    const userRole = session.user.role as UserRole;
    if (!isManager(userRole)) {
      return NextResponse.json({ error: 'Only managers can change post status or premium flag' }, { status: 403 });
    }
  }

  try {
    if (!getAdminDb() && !allowFallback) {
      return NextResponse.json({ error: 'Persistent datastore is unavailable for updates' }, { status: 503 });
    }
    const updateData: Partial<BlogPost> = { ...body };
    // Set publishedAt when a post is first published
    if (body.status === 'published' && !body.publishedAt) {
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
    let updated = updateRuntimePost(id, body);
    if (!updated) {
      const staticPost = staticPosts.find((p) => p.id === id);
      if (staticPost) {
        const updateData: Partial<BlogPost> = { ...body };
        if (body.status === 'published' && !body.publishedAt) {
          updateData.publishedAt = new Date().toISOString();
        }
        upsertRuntimePost({ ...staticPost, ...updateData, updatedAt: new Date().toISOString() });
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
  const userRole = session?.user?.role as UserRole | undefined;
  if (!userRole || !isManager(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

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
