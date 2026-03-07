/**
 * GET  /api/subscription  — get current user's subscription + payment history
 * POST /api/subscription  — admin: get all subscriber stats
 * DELETE /api/subscription — cancel the current user's subscription
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getSubscriptionFromFirestore,
  cancelSubscriptionInFirestore,
  getPaymentHistoryForUser,
  getPremiumSubscriberCount,
  getRevenueStats,
} from '@/lib/firestore';
import { isManager } from '@/lib/rbac';
import { UserRole } from '@/types';

// ── GET: current user's subscription & payment history ────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [subscription, paymentHistory] = await Promise.all([
    getSubscriptionFromFirestore(session.user.email),
    getPaymentHistoryForUser(session.user.email),
  ]);

  return NextResponse.json({ subscription, paymentHistory });
}

// ── POST: admin stats ─────────────────────────────────────────────────────────
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.role as UserRole | undefined;
  if (!role || !isManager(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [subscriberCount, revenue] = await Promise.all([
    getPremiumSubscriberCount(),
    getRevenueStats(),
  ]);

  return NextResponse.json({ subscriberCount, revenue });
}

// ── DELETE: cancel subscription ───────────────────────────────────────────────
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await cancelSubscriptionInFirestore(session.user.email);
    return NextResponse.json({ success: true, message: 'Subscription cancelled. Access continues until your billing period ends.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
