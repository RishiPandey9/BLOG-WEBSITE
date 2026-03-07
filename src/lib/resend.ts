/**
 * Resend email service
 * https://resend.com
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'notifications@devblog.com';
const SITE_NAME = 'DevBlog';
const SITE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

function isConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_resend_api_key');
}

function getResendClient(): Resend | null {
  if (!isConfigured()) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// ─────────────────────────────────────────────
// Welcome email on sign-up
// ─────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to ${SITE_NAME}! 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px">
        <h1 style="color:#0ea5e9">Welcome to ${SITE_NAME}, ${name}!</h1>
        <p>You&apos;re now part of our community of writers and readers.</p>
        <p>Here&apos;s what you can do:</p>
        <ul>
          <li>📝 Write and submit articles</li>
          <li>💬 Comment on posts</li>
          <li>❤️ Like and bookmark your favourite content</li>
        </ul>
        <a href="${SITE_URL}/create" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          Write your first post →
        </a>
        <p style="margin-top:32px;color:#9ca3af;font-size:12px">
          You received this because you created an account at ${SITE_URL}
        </p>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
// Comment approved notification
// ─────────────────────────────────────────────
export async function sendCommentApprovedEmail(
  to: string,
  commentAuthor: string,
  postTitle: string,
  postSlug: string
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your comment on "${postTitle}" was approved ✅`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px">
        <h2 style="color:#10b981">Your comment was approved!</h2>
        <p>Hi ${commentAuthor},</p>
        <p>Your comment on <strong>${postTitle}</strong> has been approved and is now visible to everyone.</p>
        <a href="${SITE_URL}/blog/${postSlug}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          View post →
        </a>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
// Post published notification (to author)
// ─────────────────────────────────────────────
export async function sendPostPublishedEmail(
  to: string,
  authorName: string,
  postTitle: string,
  postSlug: string
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your post "${postTitle}" is live! 🚀`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px">
        <h2 style="color:#8b5cf6">Your post is live!</h2>
        <p>Hi ${authorName},</p>
        <p>Great news — <strong>${postTitle}</strong> has been reviewed and published on ${SITE_NAME}.</p>
        <a href="${SITE_URL}/blog/${postSlug}" style="background:#8b5cf6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          View your post →
        </a>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
// New comment notification (to post author)
// ─────────────────────────────────────────────
export async function sendNewCommentEmail(
  to: string,
  postAuthor: string,
  commentAuthor: string,
  postTitle: string,
  postSlug: string,
  commentPreview: string
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `New comment on your post "${postTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px">
        <h2 style="color:#f59e0b">New comment on your post</h2>
        <p>Hi ${postAuthor},</p>
        <p><strong>${commentAuthor}</strong> commented on your post <strong>${postTitle}</strong>:</p>
        <blockquote style="border-left:4px solid #e5e7eb;padding:12px 16px;color:#6b7280;margin:16px 0">
          "${commentPreview.slice(0, 200)}${commentPreview.length > 200 ? '...' : ''}"
        </blockquote>
        <a href="${SITE_URL}/blog/${postSlug}#comments" style="background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">
          View comment →
        </a>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────
// Premium subscription confirmation
// ─────────────────────────────────────────────
export async function sendPremiumConfirmationEmail(
  to: string,
  name: string,
  endDate: string
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;
  const formatted = new Date(endDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to ${SITE_NAME} Premium! 🌟`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px">
        <div style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:32px;border-radius:16px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:28px">You're now Premium! 🌟</h1>
          <p style="color:#fef3c7;margin-top:8px">Full access to every premium article on ${SITE_NAME}</p>
        </div>
        <p>Hi ${name},</p>
        <p>Your payment was successful! You now have <strong>unlimited access to all premium articles</strong> until <strong>${formatted}</strong>.</p>
        <h3 style="color:#92400e">What you've unlocked:</h3>
        <ul>
          <li>✅ Full access to every premium article</li>
          <li>✅ Early access to new content</li>
          <li>✅ Ad-free reading experience</li>
          <li>✅ Direct support to our writers</li>
        </ul>
        <a href="${SITE_URL}/blog" style="background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;display:inline-block;margin-top:16px;font-weight:bold">
          Start Reading Premium →
        </a>
        <p style="margin-top:32px;color:#9ca3af;font-size:12px">
          Your subscription renews on ${formatted}. You can manage your subscription from your <a href="${SITE_URL}/dashboard" style="color:#f59e0b">Dashboard</a>.
        </p>
      </div>
    `,
  });
}

