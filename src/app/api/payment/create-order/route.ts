/**
 * POST /api/payment/create-order
 * Creates a Razorpay order for premium subscription (₹499 / 30 days).
 * Requires authenticated session.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createPremiumOrder } from '@/lib/razorpay';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'You must be signed in to subscribe' }, { status: 401 });
  }

  // Prevent managers (already premium) from paying
  if (session.user.role === 'manager') {
    return NextResponse.json({ error: 'Managers already have full access' }, { status: 400 });
  }

  try {
    const order = await createPremiumOrder(session.user.email);
    return NextResponse.json({
      orderId:     order.orderId,
      amount:      order.amount,
      currency:    order.currency,
      keyId:       order.keyId,
      name:        session.user.name ?? 'DevBlog User',
      email:       session.user.email,
      description: 'DevBlog Premium — 30-day access',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    console.error('create-order error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
