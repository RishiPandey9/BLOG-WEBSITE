/**
 * POST /api/auth/signup
 * Creates a new user via Firebase Auth REST API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || apiKey === 'your_firebase_api_key') {
    return NextResponse.json(
      { error: 'Firebase is not configured yet. Add your API key to .env.local' },
      { status: 503 }
    );
  }

  // 1. Create the user in Firebase Auth
  const signupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  if (!signupRes.ok) {
    const err = await signupRes.json();
    const msg = err?.error?.message ?? 'Signup failed';
    // Make Firebase error messages user-friendly
    if (msg.includes('EMAIL_EXISTS')) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    if (msg.includes('WEAK_PASSWORD')) {
      return NextResponse.json({ error: 'Password is too weak. Use at least 6 characters.' }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const signupData = await signupRes.json();

  // 2. Update the display name via Firebase Auth REST API
  await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: signupData.idToken,
        displayName: name,
        returnSecureToken: false,
      }),
    }
  );

  // 3. Optionally save user profile to Firestore
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const adminDb = getAdminDb();
    if (adminDb) {
      await adminDb.collection('users').doc(signupData.localId).set({
        uid: signupData.localId,
        name,
        email,
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        createdAt: new Date().toISOString(),
        role: 'viewer',
      });
    }
  } catch { /* if Firestore not configured, skip */ }

  // 4. Send welcome email if Resend is configured
  try {
    const { sendWelcomeEmail } = await import('@/lib/resend');
    await sendWelcomeEmail(email, name);
  } catch { /* if Resend not configured, skip */ }

  return NextResponse.json({ success: true, uid: signupData.localId });
}
