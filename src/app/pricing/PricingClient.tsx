'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { RazorpayCheckoutButton } from '@/components/RazorpayCheckoutButton';

export function PremiumCTA() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const isPremium = session?.user?.isPremium === true || session?.user?.role === 'manager';

  if (loading) {
    return (
      <div className="h-12 w-48 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse mx-auto" />
    );
  }

  if (isPremium) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-amber-300/40 cursor-default select-none">
          ★ You&apos;re already Premium!
        </span>
        <Link href="/blog" className="text-xs text-gray-600 hover:text-amber-500 transition-colors">
          Browse premium articles →
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-amber-300/40 hover:from-amber-600 hover:to-orange-600 transition-all"
        >
          Sign in to Get Premium
        </Link>
        <p className="text-xs text-gray-600">You&apos;ll be asked to sign in before payment</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <RazorpayCheckoutButton label="Get Premium Access — ₹499/month" />
      <p className="text-xs text-gray-600">Cancel anytime · Instant access · Secure payment via Razorpay</p>
    </div>
  );
}
