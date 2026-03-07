import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  updateCommentStatusInFirestore,
  toggleCommentLikeInFirestore,
  deleteCommentFromFirestore,
} from '@/lib/firestore';
import { moderateComment, toggleCommentLike, deleteComment } from '@/lib/comments';
import { getAdminDb } from '@/lib/firebase-admin';
import { isManager } from '@/lib/rbac';
import { UserRole, CommentStatus } from '@/types';

function firestoreAvailable(): boolean {
  return getAdminDb() !== null;
}

/**
 * PATCH /api/comments/[id] â€” moderate or like a comment
 * Body: { action: 'moderate', status: 'approved'|'rejected' }
 *   or: { action: 'like' }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Must be signed in' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === 'moderate') {
    const userRole = session.user.role as UserRole;
    if (!isManager(userRole)) {
      return NextResponse.json({ error: 'Only managers can moderate comments' }, { status: 403 });
    }
    const status = body.status as CommentStatus;
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    try {
      if (firestoreAvailable()) {
        try {
          await updateCommentStatusInFirestore(params.id, status);
        } catch {
          // Doc may not exist in Firestore (e.g. in-memory static comment) — fall back
          moderateComment(params.id, status, session.user.email ?? '');
        }
      } else {
        moderateComment(params.id, status, session.user.email ?? '');
      }

      // Send email notification when comment is approved
      if (status === 'approved') {
        try {
          const { sendCommentApprovedEmail } = await import('@/lib/resend');
          await sendCommentApprovedEmail(
            session.user.email ?? '',
            session.user.name ?? 'User',
            'your post',
            ''
          );
        } catch { /* email is optional */ }
      }

      return NextResponse.json({ success: true, status });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to moderate';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === 'like') {
    try {
      if (firestoreAvailable()) {
        try {
          const result = await toggleCommentLikeInFirestore(params.id, session.user.email || '');
          return NextResponse.json(result);
        } catch {
          // Doc may not exist in Firestore — fall back to in-memory
          const updated = toggleCommentLike(params.id, session.user.email || '');
          return NextResponse.json({ liked: (updated?.likedBy ?? []).includes(session.user.email ?? ''), likes: updated?.likes ?? 0 });
        }
      } else {
        const updated = toggleCommentLike(params.id, session.user.email || '');
        return NextResponse.json({ liked: (updated?.likedBy ?? []).includes(session.user.email ?? ''), likes: updated?.likes ?? 0 });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to like';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

/**
 * DELETE /api/comments/[id] â€” delete a comment (manager only)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Must be signed in' }, { status: 401 });
  }

  const userRole = session.user.role as UserRole;
  if (!isManager(userRole)) {
    return NextResponse.json({ error: 'Only managers can delete comments' }, { status: 403 });
  }

  try {
    if (firestoreAvailable()) {
      try {
        await deleteCommentFromFirestore(params.id);
      } catch {
        // Doc may not exist in Firestore — fall back to in-memory
        deleteComment(params.id);
      }
    } else {
      deleteComment(params.id);
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
