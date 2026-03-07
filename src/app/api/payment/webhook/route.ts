/**
 * POST /api/payment/webhook
 * Handles Razorpay webhook events.
 *
 * Supported events:
 *   - payment.captured  → activate subscription
 *   - payment.failed    → record failed payment
 *
 * Configure in Razorpay Dashboard:
 *   Webhook URL: https://<your-domain>/api/payment/webhook
 *   Secret:      set RAZORPAY_WEBHOOK_SECRET in .env.local
 *   Events:      payment.captured, payment.failed
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, PLAN_AMOUNT_PAISE, PLAN_CURRENCY, PLAN_DURATION_DAYS } from '@/lib/razorpay';
import { createOrUpdateSubscription, addPaymentRecord } from '@/lib/firestore';
import { sendPremiumConfirmationEmail } from '@/lib/resend';

interface WebhookPayload {
  event: string;
  payload: {
    payment?: {
      entity: {
        id:       string;
        order_id: string;
        amount:   number;
        currency: string;
        notes?: { userEmail?: string };
        error_description?: string;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  // ── Verify webhook signature ───────────────────────────────────────────────
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('Invalid Razorpay webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let data: WebhookPayload;
  try {
    data = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const paymentEntity = data.payload?.payment?.entity;
  if (!paymentEntity) {
    return NextResponse.json({ ok: true }); // unknown event, acknowledge
  }

  const userEmail = paymentEntity.notes?.userEmail;

  // ── payment.captured ──────────────────────────────────────────────────────
  if (data.event === 'payment.captured' && userEmail) {
    const now     = new Date();
    const endDate = new Date(now.getTime() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    try {
      await createOrUpdateSubscription(userEmail, {
        subscriptionType:     'PREMIUM',
        subscriptionStatus:   'ACTIVE',
        razorpayOrderId:      paymentEntity.order_id,
        razorpayPaymentId:    paymentEntity.id,
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate:   endDate,
        amountPaid: paymentEntity.amount ?? PLAN_AMOUNT_PAISE,
        currency:   paymentEntity.currency ?? PLAN_CURRENCY,
        updatedAt:  now.toISOString(),
      });

      await addPaymentRecord({
        userEmail,
        razorpayOrderId:   paymentEntity.order_id,
        razorpayPaymentId: paymentEntity.id,
        amountPaid: paymentEntity.amount ?? PLAN_AMOUNT_PAISE,
        currency:   paymentEntity.currency ?? PLAN_CURRENCY,
        status:    'SUCCESS',
        createdAt:  now.toISOString(),
      });

      await sendPremiumConfirmationEmail(userEmail, userEmail.split('@')[0], endDate);
    } catch (err) {
      console.error('Webhook: failed to activate subscription', err);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  // ── payment.failed ─────────────────────────────────────────────────────────
  if (data.event === 'payment.failed' && userEmail) {
    try {
      await addPaymentRecord({
        userEmail,
        razorpayOrderId:   paymentEntity.order_id,
        razorpayPaymentId: paymentEntity.id,
        amountPaid: 0,
        currency:   paymentEntity.currency ?? PLAN_CURRENCY,
        status:    'FAILED',
        createdAt:  new Date().toISOString(),
      });
    } catch (err) {
      console.error('Webhook: failed to record failed payment', err);
    }
  }

  return NextResponse.json({ received: true });
}
