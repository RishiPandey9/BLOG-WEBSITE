import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { UserRole } from '@/types';
import { getSubscriptionFromFirestore, getActiveDelegationByEmail } from './firestore';

/**
 * Manager emails — loaded from MANAGER_EMAILS env var (comma-separated).
 * All other authenticated users default to 'viewer'.
 * Example in .env.local:  MANAGER_EMAILS=alice@gmail.com,bob@example.com
 */
const MANAGER_EMAILS: string[] = (process.env.MANAGER_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function resolveRole(email?: string | null): Promise<UserRole> {
  if (email && MANAGER_EMAILS.includes(email.toLowerCase())) {
    return 'manager';
  }
  // Check for a time-limited delegated admin grant
  if (email) {
    try {
      const delegation = await getActiveDelegationByEmail(email);
      if (delegation) return 'delegated_admin';
    } catch { /* silent — fall through to viewer */ }
  }
  return 'viewer';
}

/** Re-fetches subscription from Firestore and returns isPremium + status + endDate */
async function resolveSubscription(email?: string | null) {
  if (!email) return { isPremium: false, subscriptionStatus: 'NONE' as const, subscriptionEndDate: undefined };

  // Managers always have premium access
  if (MANAGER_EMAILS.includes(email.toLowerCase())) {
    return { isPremium: true, subscriptionStatus: 'ACTIVE' as const, subscriptionEndDate: undefined };
  }

  try {
    const sub = await getSubscriptionFromFirestore(email);
    if (!sub) return { isPremium: false, subscriptionStatus: 'NONE' as const, subscriptionEndDate: undefined };

    const isActive =
      sub.subscriptionStatus === 'ACTIVE' &&
      new Date(sub.subscriptionEndDate) > new Date();

    return {
      isPremium: isActive,
      subscriptionStatus: isActive ? ('ACTIVE' as const) : ('EXPIRED' as const),
      subscriptionEndDate: sub.subscriptionEndDate,
    };
  } catch {
    return { isPremium: false, subscriptionStatus: 'NONE' as const, subscriptionEndDate: undefined };
  }
}

/**
 * Sign in with email + password via Firebase Auth REST API
 */
async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ uid: string; email: string; displayName: string; photoUrl: string } | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || apiKey === 'your_firebase_api_key') return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return {
    uid: data.localId,
    email: data.email,
    displayName: data.displayName ?? email.split('@')[0],
    photoUrl: data.photoUrl ?? '',
  };
}

// Build FirestoreAdapter config only when credentials are present
function buildFirestoreAdapter() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (
    !projectId ||
    projectId === 'your_project_id' ||
    !clientEmail ||
    !privateKey ||
    privateKey.includes('YOUR_KEY_HERE')
  ) {
    return undefined; // Use default JWT strategy until Firebase is configured
  }

  try {
    /* eslint-disable */
    const { FirestoreAdapter } = require('@next-auth/firebase-adapter');
    const { cert } = require('firebase-admin/app');
    /* eslint-enable */
    return FirestoreAdapter({ credential: cert({ projectId, clientEmail, privateKey }) });
  } catch {
    return undefined;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: buildFirestoreAdapter(),
  session: {
    // Use JWT when no adapter is configured; switch to 'database' once Firebase is set
    strategy: buildFirestoreAdapter() ? 'database' : 'jwt',
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await signInWithEmailPassword(credentials.email, credentials.password);
        if (!user) return null;
        return {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          image: user.photoUrl || null,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user }) {
      // Upsert every user into Firestore so they appear in the admin Users panel.
      // This covers OAuth (GitHub / Google) sign-ins which bypass the signup route.
      if (user?.email) {
        try {
          const { getAdminDb } = await import('@/lib/firebase-admin');
          const adminDb = getAdminDb();
          if (adminDb) {
            const id = user.id ?? user.email;
            const docRef = adminDb.collection('users').doc(id);
            const snap = await docRef.get();
            if (!snap.exists) {
              await docRef.set({
                uid: id,
                name: user.name ?? user.email.split('@')[0],
                email: user.email.toLowerCase(),
                image: user.image ?? '',
                username: user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
                createdAt: new Date().toISOString(),
                role: 'viewer',
              });
            } else {
              // Keep name/avatar in sync with the provider
              await docRef.set(
                {
                  name: user.name ?? snap.data()?.name,
                  image: user.image ?? snap.data()?.image ?? '',
                },
                { merge: true }
              );
            }
          }
        } catch { /* Firestore not configured or write failed — allow sign-in anyway */ }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub ?? (token.id as string);
        (session.user as { role?: UserRole }).role = (token.role as UserRole) ?? 'viewer';
        (session.user as { isPremium?: boolean }).isPremium = (token.isPremium as boolean) ?? false;
        (session.user as { subscriptionStatus?: string }).subscriptionStatus = (token.subscriptionStatus as string) ?? 'NONE';
        (session.user as { subscriptionEndDate?: string }).subscriptionEndDate = token.subscriptionEndDate as string | undefined;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      const SUB_REFRESH_MS = 5 * 60 * 1000; // re-check Firestore every 5 minutes

      // Initial sign-in — always resolve from Firestore
      if (user) {
        token.id   = user.id;
        token.role = await resolveRole(user.email);
        const sub  = await resolveSubscription(user.email);
        token.isPremium           = sub.isPremium;
        token.subscriptionStatus  = sub.subscriptionStatus;
        token.subscriptionEndDate = sub.subscriptionEndDate;
        token.subCheckedAt        = Date.now();
      }

      // Forced update (called after payment success via session.update())
      const needsRefresh =
        trigger === 'update' ||
        // Always re-check delegation status so revocations / expiry take effect within 5 min
        token.role === 'delegated_admin' ||
        !token.subCheckedAt ||
        Date.now() - (token.subCheckedAt as number) > SUB_REFRESH_MS;

      if (!user && needsRefresh && token.email) {
        // Re-resolve role so delegations + revocations are reflected promptly
        token.role = await resolveRole(token.email as string);
        const sub = await resolveSubscription(token.email as string);
        token.isPremium           = sub.isPremium;
        token.subscriptionStatus  = sub.subscriptionStatus;
        token.subscriptionEndDate = sub.subscriptionEndDate;
        token.subCheckedAt        = Date.now();
      }

      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
