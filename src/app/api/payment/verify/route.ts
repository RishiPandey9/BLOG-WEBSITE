/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature server-side, activates subscription,
 * records payment history, and sends confirmation email.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyPaymentSignature, PLAN_AMOUNT_PAISE, PLAN_CURRENCY, PLAN_DURATION_DAYS } from '@/lib/razorpay';
import { createOrUpdateSubscription, addPaymentRecord } from '@/lib/firestore';
import { sendPremiumConfirmationEmail } from '@/lib/resend';

interface VerifyBody {
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as VerifyBody;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
  }

  // ── 1. Server-side signature verification (prevents spoofing) ──────────────
  const isValid = verifyPaymentSignature({
    orderId:   razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    console.error('Payment signature verification failed', {
      orderId: razorpay_order_id,
      user: session.user.email,
    });
    return NextResponse.json({ error: 'Payment verification failed — invalid signature' }, { status: 400 });
  }

  const userEmail = session.user.email;
  const now       = new Date();
  const endDate   = new Date(now.getTime() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    // ── 2. Activate / extend subscription in Firestore ───────────────────────
    await createOrUpdateSubscription(userEmail, {
      subscriptionType:     'PREMIUM',
      subscriptionStatus:   'ACTIVE',
      razorpayOrderId:      razorpay_order_id,
      razorpayPaymentId:    razorpay_payment_id,
      razorpaySignature:    razorpay_signature,
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate:   endDate,
      amountPaid:  PLAN_AMOUNT_PAISE,
      currency:    PLAN_CURRENCY,
      updatedAt:   now.toISOString(),
    });

    // ── 3. Record payment history ────────────────────────────────────────────
    await addPaymentRecord({
      userEmail,
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amountPaid:  PLAN_AMOUNT_PAISE,
      currency:    PLAN_CURRENCY,
      status:      'SUCCESS',
      createdAt:   now.toISOString(),
    });

    // ── 4. Send confirmation email ───────────────────────────────────────────
    await sendPremiumConfirmationEmail(userEmail, session.user.name ?? 'Member', endDate);

    return NextResponse.json({ success: true, subscriptionEndDate: endDate });
  } catch (err) {
    console.error('verify payment error:', err);
    return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 });
  }
}
