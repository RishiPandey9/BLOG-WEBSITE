import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getBookmarksFromFirestore, toggleBookmarkInFirestore } from '@/lib/firestore';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ bookmarks: [] });
  }
  const bookmarks = await getBookmarksFromFirestore(session.user.email);
  return NextResponse.json({ bookmarks });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await request.json() as { postId: string };
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }

  try {
    const result = await toggleBookmarkInFirestore(postId, session.user.email);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle bookmark';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
