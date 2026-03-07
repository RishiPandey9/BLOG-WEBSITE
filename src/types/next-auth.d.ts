import { type UserRole, type SubscriptionStatus } from '@/types';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      isPremium?: boolean;
      subscriptionStatus?: SubscriptionStatus | 'NONE';
      subscriptionEndDate?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
    isPremium?: boolean;
    subscriptionStatus?: SubscriptionStatus | 'NONE';
    subscriptionEndDate?: string;
    subCheckedAt?: number; // unix ms — for periodic Firestore re-check
  }
}
