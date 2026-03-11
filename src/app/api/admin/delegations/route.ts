/**
 * GET  /api/admin/delegations  — list all delegations (any manager)
 * POST /api/admin/delegations  — create a delegation (main admin only)
 * DELETE /api/admin/delegations?id=<id>  — revoke a delegation (main admin only)
 *
 * Security: Only emails in MANAGER_EMAILS env var can create/revoke delegations.
 * This is checked by email, not by session role, so a delegated admin cannot
 * self-escalate or create other delegated admins.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getAllDelegationsFromFirestore,
  createDelegationInFirestore,
  revokeDelegationInFirestore,
} from '@/lib/firestore';
import type { AdminDelegation } from '@/types';

const MAIN_ADMIN_EMAILS: string[] = (process.env.MANAGER_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isMainAdmin(email?: string | null): boolean {
  return !!email && MAIN_ADMIN_EMAILS.includes(email.toLowerCase());
}

function hasManagerAccess(role?: string | null): boolean {
  return role === 'manager' || role === 'delegated_admin';
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!hasManagerAccess(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const delegations = await getAllDelegationsFromFirestore();
  return NextResponse.json({ delegations });
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only permanent main admins can grant delegations
  if (!isMainAdmin(session.user.email)) {
    return NextResponse.json(
      { error: 'Only the main admin can grant admin access to others.' },
      { status: 403 }
    );
  }

  const body = await req.json() as {
    userEmail?: string;
    userName?: string;
    userAvatar?: string;
    expiresAt?: string;
  };

  const { userEmail, userName, expiresAt } = body;
  if (!userEmail || !userName || !expiresAt) {
    return NextResponse.json(
      { error: 'userEmail, userName, and expiresAt are required.' },
      { status: 400 }
    );
  }

  // Prevent granting elevated access to already-permanent admins
  if (isMainAdmin(userEmail)) {
    return NextResponse.json(
      { error: 'That user is already a permanent main admin.' },
      { status: 400 }
    );
  }

  // Expiry must be in the future
  if (new Date(expiresAt) <= new Date()) {
    return NextResponse.json(
      { error: 'Expiry date must be in the future.' },
      { status: 400 }
    );
  }

  const delegation: Omit<AdminDelegation, 'id'> = {
    userEmail: userEmail.toLowerCase(),
    userName,
    userAvatar: body.userAvatar ?? '',
    grantedBy: session.user.email.toLowerCase(),
    grantedByName: session.user.name ?? session.user.email,
    expiresAt,
    createdAt: new Date().toISOString(),
    isRevoked: false,
  };

  try {
    const id = await createDelegationInFirestore(delegation);
    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create delegation.' }, { status: 500 });
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only permanent main admins can revoke delegations
  if (!isMainAdmin(session.user.email)) {
    return NextResponse.json(
      { error: 'Only the main admin can revoke admin access.' },
      { status: 403 }
    );
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Delegation id is required.' }, { status: 400 });
  }

  try {
    await revokeDelegationInFirestore(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to revoke delegation.' }, { status: 500 });
  }
}
