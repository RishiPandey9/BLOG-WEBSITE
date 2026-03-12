import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { email } = await req.json() as { email?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const db = getAdminDb();

    if (db) {
      const col = db.collection('newsletter_subscribers');
      const existing = await col.where('email', '==', email).limit(1).get();

      if (!existing.empty) {
        return NextResponse.json({ message: 'Already subscribed' }, { status: 200 });
      }

      await col.add({
        email,
        subscribedAt: new Date().toISOString(),
        isActive: true,
      });
    }

    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { email } = await req.json() as { email?: string };
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const db = getAdminDb();
    if (db) {
      const snap = await db.collection('newsletter_subscribers').where('email', '==', email).limit(1).get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({ isActive: false });
      }
    }

    return NextResponse.json({ message: 'Unsubscribed' });
  } catch {
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
