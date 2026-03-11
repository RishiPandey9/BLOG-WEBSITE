/**
 * GET /api/admin/users
 * Returns all users with post counts and premium status, for the admin panel.
 * Accessible to managers and delegated admins only.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAllUsersForAdmin, getPostsFromFirestore } from '@/lib/firestore';

const MAIN_ADMIN_EMAILS: string[] = (process.env.MANAGER_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function hasManagerAccess(role?: string | null): boolean {
  return role === 'manager' || role === 'delegated_admin';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!hasManagerAccess(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [users, posts] = await Promise.all([
    getAllUsersForAdmin(),
    getPostsFromFirestore(),
  ]);

  // Build post-count map
  const postCountByEmail = new Map<string, number>();
  for (const post of posts) {
    const email = post.author.email.toLowerCase();
    postCountByEmail.set(email, (postCountByEmail.get(email) ?? 0) + 1);
  }

  // Merge post counts; surface post authors not yet in users collection
  const emailMap = new Map(users.map((u) => [
    u.email,
    {
      ...u,
      postCount: postCountByEmail.get(u.email) ?? 0,
      isAdmin: MAIN_ADMIN_EMAILS.includes(u.email),
    },
  ]));

  for (const post of posts) {
    const email = post.author.email.toLowerCase();
    if (!emailMap.has(email)) {
      emailMap.set(email, {
        email,
        name: post.author.name,
        image: post.author.avatar,
        postCount: postCountByEmail.get(email) ?? 0,
        isPremium: false,
        isAdmin: MAIN_ADMIN_EMAILS.includes(email),
        createdAt: post.publishedAt,
      });
    }
  }

  const result = Array.from(emailMap.values()).sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  );

  return NextResponse.json({ users: result });
}
