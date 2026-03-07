'use client';

import Link from 'next/link';
import { Lock, CheckCircle2, Star } from 'lucide-react';
import { RazorpayCheckoutButton } from '@/components/RazorpayCheckoutButton';

interface PremiumPaywallProps {
  isSignedIn: boolean;
}

const perks = [
  'Full access to every premium article',
  'Early access to new content',
  'No ads, ever',
  'Support independent writers',
];

export function PremiumPaywall({ isSignedIn }: PremiumPaywallProps) {
  return (
    <div className="mt-6">

      {/* Card */}
      <div className="relative z-10 rounded-2xl border border-amber-200 dark:border-amber-700/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-8 text-center shadow-xl shadow-amber-100/40 dark:shadow-amber-900/20">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-300/50 dark:shadow-amber-900/40">
          <Lock className="h-7 w-7 text-white" />
        </div>

        {/* Heading */}
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <Star className="h-3 w-3" />
          Premium Content
        </div>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          This article is for Premium members
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          You&apos;ve read the free preview. Upgrade to unlock the full article and every other premium post on DevBlog.
        </p>

        {/* Perks */}
        <ul className="mt-6 mb-8 space-y-2 text-left inline-block">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-amber-500" />
              {perk}
            </li>
          ))}
        </ul>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {isSignedIn ? (
            <RazorpayCheckoutButton label="Upgrade to Premium — ₹499/mo" />
          ) : (
            <>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-amber-300/40 hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <Star className="h-4 w-4" />
                See Pricing
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Cancel anytime · Instant access · Secure payment
        </p>
      </div>
    </div>
  );
}
