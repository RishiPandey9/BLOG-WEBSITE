import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getCommentsByPostIdFromFirestore,
  addCommentToFirestore,
  getPendingCommentsFromFirestore,
  getAllCommentsFromFirestore,
} from '@/lib/firestore';
import {
  getCommentsByPostId,
  addComment,
  getPendingComments,
  getAllComments,
  getCommentStats,
} from '@/lib/comments';
import { isManager } from '@/lib/rbac';
import { analyzeSentiment } from '@/lib/sentiment';
import { getAdminDb } from '@/lib/firebase-admin';
import { UserRole } from '@/types';

const allowFallback = process.env.NODE_ENV !== 'production';

function firestoreAvailable(): boolean {
  return getAdminDb() !== null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  const all = searchParams.get('all');
  const pending = searchParams.get('pending');
  const stats = searchParams.get('stats');

  const session = await getServerSession(authOptions);

  if (stats === 'true') {
    if (!session?.user?.role || !isManager(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (!firestoreAvailable()) {
      if (!allowFallback) {
        return NextResponse.json({ error: 'Persistent datastore is unavailable' }, { status: 503 });
      }
      return NextResponse.json(getCommentStats());
    }
    const allComments = await getAllCommentsFromFirestore();
    const total = allComments.length;
    const approved = allComments.filter((c) => c.status === 'approved').length;
    const pendingCount = allComments.filter((c) => c.status === 'pending').length;
    const rejected = allComments.filter((c) => c.status === 'rejected').length;
    const flagged = allComments.filter((c) => c.sentiment?.flagged).length;
    return NextResponse.json({ total, approved, pending: pendingCount, rejected, flagged });
  }

  if (all === 'true') {
    if (!session?.user?.role || !isManager(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (!firestoreAvailable()) {
      if (!allowFallback) {
        return NextResponse.json({ error: 'Persistent datastore is unavailable' }, { status: 503 });
      }
      return NextResponse.json(getAllComments());
    }
    return NextResponse.json(await getAllCommentsFromFirestore());
  }

  if (pending === 'true') {
    if (!session?.user?.role || !isManager(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (!firestoreAvailable()) {
      if (!allowFallback) {
        return NextResponse.json({ error: 'Persistent datastore is unavailable' }, { status: 503 });
      }
      return NextResponse.json(getPendingComments(postId || undefined));
    }
    return NextResponse.json(await getPendingCommentsFromFirestore(postId || undefined));
  }

  if (postId) {
    const userRole = session?.user?.role as UserRole | undefined;
    const userEmail = session?.user?.email || '';

    let comments;
    if (firestoreAvailable()) {
      comments = await getCommentsByPostIdFromFirestore(postId);
      // If Firestore is empty, fall back to in-memory mock data only in development mode
      if (allowFallback && comments.length === 0) {
        const inMemory = getCommentsByPostId(postId);
        if (inMemory.length > 0) comments = inMemory;
      }
    } else {
      if (!allowFallback) {
        return NextResponse.json({ error: 'Persistent datastore is unavailable' }, { status: 503 });
      }
      comments = getCommentsByPostId(postId);
    }

    const filtered = comments.filter((c) => {
      if (c.status === 'approved') return true;
      if (userRole && isManager(userRole)) return true;
      if (c.author.email === userEmail) return true;
      return false;
    });
    return NextResponse.json(filtered);
  }

  return NextResponse.json({ error: 'postId is required' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Must be signed in to comment' }, { status: 401 });
  }

  const body = await req.json();
  const { postId, content } = body;

  if (!postId || !content || content.trim().length === 0) {
    return NextResponse.json({ error: 'postId and content are required' }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 });
  }

  const userRole = session.user.role as UserRole;
  const autoApprove = isManager(userRole);
  const sentiment = analyzeSentiment(content.trim());
  const finalStatus = (autoApprove ? 'approved' : sentiment.flagged ? 'rejected' : 'pending') as import('@/types').CommentStatus;

  const baseData = {
    postId,
    author: {
      name: session.user.name || 'Anonymous',
      email: session.user.email || '',
      avatar: session.user.image || '',
    },
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
    likedBy: [] as string[],
    status: finalStatus,
  };

  try {
    if (!firestoreAvailable()) throw new Error('Firestore not ready');
    // Firestore path: addCommentToFirestore handles sentiment internally
    const comment = await addCommentToFirestore(baseData);
    return NextResponse.json(comment, { status: 201 });
  } catch {
    if (!allowFallback) {
      return NextResponse.json({ error: 'Persistent datastore is unavailable for writes' }, { status: 503 });
    }
    // In-memory fallback: must include sentiment
    const comment = addComment({ ...baseData, sentiment });
    return NextResponse.json(comment, { status: 201 });
  }
}
