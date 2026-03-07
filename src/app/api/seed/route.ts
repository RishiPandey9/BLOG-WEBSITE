/**
 * GET /api/seed — one-time Firestore seeder
 * Seeds the static mock posts and categories into Firestore.
 * Can only be triggered by a signed-in Manager.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isManager } from '@/lib/rbac';
import { seedFirestore } from '@/lib/firestore';
import type { UserRole } from '@/types';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isManager(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Manager role required' }, { status: 403 });
  }

  const result = await seedFirestore();
  return NextResponse.json(result);
}

export async function GET() {
  // Allow GET in dev for easy triggering via browser
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 });
  }
  const result = await seedFirestore();
  return NextResponse.json(result);
}
