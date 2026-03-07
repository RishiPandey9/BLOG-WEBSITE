/**
 * Razorpay server-side utilities
 * - Create one-time payment orders (30-day subscription validity)
 * - Verify payment signatures (prevent spoofing)
 * - Verify webhook signatures
 *
 * Architecture note: One-time payment model is used over Razorpay Subscriptions
 * because it requires no pre-configured plan on the dashboard and gives full
 * control over renewal reminders & expiry logic inside our own Firestore.
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

// ─── Config ────────────────────────────────────────────────────────────────────
export const PLAN_AMOUNT_PAISE = 49900; // ₹499 in paise
export const PLAN_CURRENCY     = 'INR';
export const PLAN_LABEL        = '₹499 / month';
export const PLAN_DURATION_DAYS = 30;

function isConfigured(): boolean {
  const id  = process.env.RAZORPAY_KEY_ID;
  const sec = process.env.RAZORPAY_KEY_SECRET;
  return !!(id && sec && !id.includes('your_key'));
}

function getInstance(): Razorpay {
  if (!isConfigured()) throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local');
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

// ─── Create Order ──────────────────────────────────────────────────────────────
export interface RazorpayOrderResult {
  orderId:  string;
  amount:   number;
  currency: string;
  keyId:    string;
}

export async function createPremiumOrder(userEmail: string): Promise<RazorpayOrderResult> {
  const rp = getInstance();

  // Receipt max 40 chars (Razorpay limit)
  const safeEmail = userEmail.replace(/[^a-z0-9]/gi, '_').slice(0, 20);
  const receipt   = `sub_${Date.now().toString().slice(-8)}_${safeEmail}`;

  const order = await rp.orders.create({
    amount:   PLAN_AMOUNT_PAISE,
    currency: PLAN_CURRENCY,
    receipt,
    notes:    { userEmail },
  });

  return {
    orderId:  order.id,
    amount:   order.amount as number,
    currency: order.currency,
    keyId:    process.env.RAZORPAY_KEY_ID!,
  };
}

// ─── Verify Payment Signature ─────────────────────────────────────────────────
/**
 * Must be verified server-side. Never trust the frontend signature check.
 * Algo: HMAC-SHA256(key_secret, "<orderId>|<paymentId>")
 */
export function verifyPaymentSignature(params: {
  orderId:   string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const body     = `${params.orderId}|${params.paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(params.signature, 'hex'));
  } catch {
    return false;
  }
}

// ─── Verify Webhook Signature ─────────────────────────────────────────────────
/**
 * Razorpay sends X-Razorpay-Signature header.
 * Algo: HMAC-SHA256(webhook_secret, rawBody)
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('RAZORPAY_WEBHOOK_SECRET not set — skipping webhook verification');
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}
