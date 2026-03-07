import { CheckCircle2, Zap, Star, Lock, Users, Rss } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PremiumCTA } from './PricingClient';

export const metadata: Metadata = {
  title: 'Premium — DevBlog',
  description: 'Unlock every premium article on DevBlog with a single subscription.',
};

const FREE_FEATURES = [
  'Read all free articles',
  'Comment on posts',
  'Like & bookmark posts',
  'Public author profiles',
];

const PREMIUM_FEATURES = [
  'Everything in Free',
  'Unlimited access to premium articles',
  'Early access to new content',
  'Ad-free reading experience',
  'Support independent writers',
  'Priority support',
];

const faqs = [
  {
    q: 'How do I access premium articles after subscribing?',
    a: 'Simply sign in with your account. Premium access is tied to your email — the full article will unlock immediately.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes, you can cancel at any time. Your access continues until the end of your billing period.',
  },
  {
    q: 'Which articles are premium?',
    a: 'Premium articles are marked with a gold ★ badge on the blog listing and post page.',
  },
  {
    q: 'I\'m an author — do I get premium access?',
    a: 'Manager accounts have full premium access by default. Regular authors get a free preview like all other users.',
  },
];

export default function PricingPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 mb-4">
            <Star className="h-3 w-3" />
            DevBlog Premium
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
            Unlock <span className="gradient-text">every story</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Support independent writers and get unlimited access to all premium articles for one low monthly price.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {/* Free */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Free</span>
            </div>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$0</span>
              <span className="text-gray-400 mb-2">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  {f}
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm text-gray-400 line-through">
                <Lock className="h-4 w-4 flex-shrink-0" />
                Premium articles
              </li>
            </ul>
            <Link
              href="/blog"
              className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Start Reading Free
            </Link>
          </div>

          {/* Premium */}
          <div className="relative rounded-2xl border-2 border-amber-400 dark:border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-8 shadow-xl shadow-amber-100/50 dark:shadow-amber-900/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-xs font-bold text-white shadow">
                <Zap className="h-3 w-3" /> Most Popular
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Premium</span>
            </div>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$5</span>
              <span className="text-gray-500 dark:text-gray-400 mb-2">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-amber-500" />
                  {f}
                </li>
              ))}
            </ul>
            <PremiumCTA />
            <p className="mt-3 text-center text-xs text-gray-400">
              Cancel anytime · Instant access · Secure payment
            </p>
          </div>
        </div>

        {/* Why Premium */}
        <div className="mb-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-10">Why upgrade?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Lock, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30', title: 'Exclusive Articles', desc: 'Deep-dives, tutorials, and opinion pieces published only for premium readers.' },
              { icon: Zap, color: 'text-sky-500 bg-sky-100 dark:bg-sky-900/30', title: 'Ad-Free Experience', desc: 'Read without distractions. No banners, no trackers, just the content.' },
              { icon: Rss, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30', title: 'Support Writers', desc: 'Your subscription directly funds the authors creating content you love.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{q}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
