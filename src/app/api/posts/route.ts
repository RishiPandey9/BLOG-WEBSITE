import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getPostsFromFirestore,
  createPostInFirestore,
  deletePostFromFirestore,
} from '@/lib/firestore';
import { getRuntimePosts, addRuntimePost, deleteRuntimePost } from '@/lib/posts-store';
import { posts as staticPosts } from '@/lib/data';
import { isManager } from '@/lib/rbac';
import { BlogPost, UserRole } from '@/types';
import { getAdminDb } from '@/lib/firebase-admin';

// ─── GET /api/posts ────────────────────────────────────────────────────────────
// ?mine=true  → only the current user's posts
// ?all=true   → all posts (manager only, includes pending/draft)
// default     → all published posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get('mine') === 'true';
  const all = searchParams.get('all') === 'true';

  const session = await getServerSession(authOptions);

  try {
    // Combine Firestore posts + in-memory runtime posts (for fallback/new posts)
    const firestorePosts = await getPostsFromFirestore();
    const runtimePosts = getRuntimePosts();

    // Merge strategy:
    // - When Firestore is available: Firestore is authoritative (has up-to-date isPremium, status).
    //   Runtime posts are only added for IDs NOT in Firestore (e.g. newly created during this session
    //   before Firestore persisted them, or when Firestore was temporarily down).
    // - When Firestore is unavailable: getPostsFromFirestore() already returns staticPosts,
    //   runtime posts are prepended (they override static posts for same IDs via runtimeIds set).
    const firestoreAvailable = getAdminDb() !== null;
    let combined: BlogPost[];
    if (firestoreAvailable) {
      // Firestore first; runtime only for posts that Firestore doesn't have
      const firestoreIds = new Set(firestorePosts.map((p) => p.id));
      combined = [
        ...firestorePosts,
        ...runtimePosts.filter((p) => !firestoreIds.has(p.id)),
      ];
    } else {
      // No Firestore: runtime takes priority over static data (runtime has up-to-date isPremium etc.)
      const runtimeIds = new Set(runtimePosts.map((p) => p.id));
      combined = [
        ...runtimePosts,
        ...firestorePosts.filter((p) => !runtimeIds.has(p.id)),
      ];
    }

    if (mine) {
      if (!session?.user?.email) {
        return NextResponse.json({ posts: [] });
      }
      const userPosts = combined.filter((p) => p.author.email === session.user!.email);
      return NextResponse.json({ posts: userPosts });
    }

    if (all) {
      const userRole = session?.user?.role as UserRole | undefined;
      if (!userRole || !isManager(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ posts: combined });
    }

    // Public: only published posts
    const published = combined.filter((p) => p.status === 'published');
    return NextResponse.json({ posts: published });
  } catch (err) {
    console.error('GET /api/posts error:', err);
    return NextResponse.json({ posts: staticPosts });
  }
}

// ─── POST /api/posts ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    title: string;
    content: string;
    excerpt: string;
    category: string;
    tags: string[];
    coverImage: string;
    status: BlogPost['status'];
    slug: string;
  };

  const { title, content, excerpt, category, tags, coverImage, status, slug } = body;

  if (!title || !content || !category) {
    return NextResponse.json({ error: 'title, content, and category are required' }, { status: 400 });
  }

  const userRole = session.user.role as UserRole;
  const managerUser = isManager(userRole);

  // Determine final status
  const finalStatus = managerUser
    ? (status ?? 'published')
    : 'pending_review';

  const now = new Date().toISOString();
  const words = content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(words / 200));

  const postData: Omit<BlogPost, 'id'> = {
    slug: slug || title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    title,
    content,
    excerpt: excerpt || title,
    coverImage: coverImage || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=60',
    category,
    tags: tags ?? [],
    author: {
      name: session.user.name || 'Anonymous',
      username: (session.user.name || 'user').toLowerCase().replace(/\s+/g, ''),
      email: session.user.email || '',
      avatar: session.user.image || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff',
      bio: '',
    },
    publishedAt: now,
    updatedAt: now,
    readingTime,
    likes: 0,
    views: 0,
    commentCount: 0,
    featured: false,
    status: finalStatus,
  };

  try {
    // Try Firestore first
    const id = await createPostInFirestore(postData);
    return NextResponse.json({ id, ...postData }, { status: 201 });
  } catch {
    // Fallback to in-memory store
    const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const post: BlogPost = { id, ...postData };
    addRuntimePost(post);
    return NextResponse.json(post, { status: 201 });
  }
}

// ─── DELETE /api/posts?id=xxx ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;
  if (!userRole || !isManager(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  try {
    await deletePostFromFirestore(id);
  } catch {
    deleteRuntimePost(id);
  }

  return NextResponse.json({ success: true });
}
