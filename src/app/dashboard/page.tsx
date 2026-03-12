'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRole } from '@/hooks/useRole';
import { BlogPost } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  FileText, Eye, Heart, MessageSquare, PenSquare,
  TrendingUp, BarChart3, Clock, Plus, Edit2, Send,
  CheckCircle2, XCircle, AlertCircle, BookOpen, Loader2, Trash2,
  Crown, CreditCard, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { RazorpayCheckoutButton } from '@/components/RazorpayCheckoutButton';
import type { Subscription, PaymentRecord } from '@/types';

const statusConfig = {
  published: { label: 'Published', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle2 },
  draft: { label: 'Draft', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-600', icon: Edit2 },
  pending_review: { label: 'In Review', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', icon: AlertCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', icon: XCircle },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { isAuthenticated, isLoading } = useRole();
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'pending_review' | 'analytics'>('all');
  const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  const fetchMyPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?mine=true');
      if (res.ok) {
        const data = await res.json() as { posts: BlogPost[] };
        setMyPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json() as { subscription: Subscription | null; paymentHistory: PaymentRecord[] };
        setSubscription(data.subscription);
        setPaymentHistory(data.paymentHistory);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyPosts();
      fetchSubscription();
    }
  }, [isAuthenticated, fetchMyPosts, fetchSubscription]);

  const handleCancelSubscription = async () => {
    if (!confirm('Cancel your Premium subscription? Access continues until the end of the billing period.')) return;
    setCancellingSubscription(true);
    try {
      const res = await fetch('/api/subscription', { method: 'DELETE' });
      if (res.ok) {
        setSubscription((prev) => prev ? { ...prev, subscriptionStatus: 'CANCELLED' } : null);
        toast.success('Subscription cancelled. Access continues until expiry.');
      } else {
        toast.error('Failed to cancel subscription.');
      }
    } catch {
      toast.error('Failed to cancel subscription.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMyPosts((prev) => prev.filter((p) => p.id !== id));
        toast.success('Post deleted');
      } else {
        toast.error('Failed to delete post');
      }
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">ðŸ”’</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view your dashboard</h1>
        <Link href="/auth/signin" className="btn-primary mt-6">Sign In</Link>
      </div>
    );
  }

  const filtered = activeTab === 'all' ? myPosts : myPosts.filter((p) => p.status === activeTab);

  const stats = {
    total: myPosts.length,
    published: myPosts.filter((p) => p.status === 'published').length,
    drafts: myPosts.filter((p) => p.status === 'draft').length,
    views: myPosts.reduce((s, p) => s + (p.views ?? 0), 0),
    likes: myPosts.reduce((s, p) => s + (p.likes ?? 0), 0),
    comments: myPosts.reduce((s, p) => s + (p.commentCount ?? 0), 0),
  };

  const trendingScore = (p: BlogPost) => (p.views ?? 0) * 0.5 + (p.likes ?? 0) * 2 + (p.commentCount ?? 0) * 3;
  const topPost = myPosts.length > 0 ? [...myPosts].sort((a, b) => trendingScore(b) - trendingScore(a))[0] : null;

  // Analytics helpers
  const publishedPosts = myPosts.filter((p) => p.status === 'published');
  const maxViews = Math.max(...publishedPosts.map((p) => p.views ?? 0), 1);
  const maxLikes = Math.max(...publishedPosts.map((p) => p.likes ?? 0), 1);
  const engagementRate = stats.views > 0 ? (((stats.likes + stats.comments) / stats.views) * 100).toFixed(1) : '0.0';
  const avgViews = publishedPosts.length > 0 ? Math.round(stats.views / publishedPosts.length) : 0;
  const categoryDist = myPosts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const sortedCategories = Object.entries(categoryDist).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10"
        >
          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? 'User'}
                width={52}
                height={52}
                className="rounded-xl ring-2 ring-sky-300 dark:ring-sky-800"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {session?.user?.name?.split(' ')[0]} ðŸ‘‹
              </h1>
              <p className="text-gray-600 dark:text-gray-600 text-sm">Here&apos;s your content overview</p>
            </div>
          </div>
          <Link href="/create" className="btn-primary text-sm self-start md:self-auto">
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10"
        >
          {[
            { label: 'Total Posts', value: stats.total, icon: FileText, color: 'sky', sub: `${stats.published} live` },
            { label: 'Published', value: stats.published, icon: CheckCircle2, color: 'green', sub: `${stats.drafts} drafts` },
            { label: 'Drafts', value: stats.drafts, icon: Edit2, color: 'amber', sub: 'in progress' },
            { label: 'Total Views', value: stats.views.toLocaleString(), icon: Eye, color: 'purple', sub: `avg ${avgViews}/post` },
            { label: 'Total Likes', value: stats.likes.toLocaleString(), icon: Heart, color: 'red', sub: `${engagementRate}% engage` },
            { label: 'Comments', value: stats.comments.toLocaleString(), icon: MessageSquare, color: 'indigo', sub: 'all posts' },
          ].map(({ label, value, icon: Icon, color, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center hover:shadow-md dark:hover:shadow-gray-900 transition-shadow"
            >
              <div className={`w-8 h-8 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
              <div className="text-xs text-gray-600 dark:text-gray-600 mt-0.5">{label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-600 mt-0.5">{sub}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Post List */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 w-fit overflow-x-auto">
              {(['all', 'published', 'draft', 'pending_review', 'analytics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-all capitalize whitespace-nowrap',
                    activeTab === tab
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                  )}
                >
                  {tab === 'pending_review' ? 'In Review' : tab === 'analytics' ? 'ðŸ“Š Analytics' : tab}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {activeTab === 'analytics' ? (
                <div className="space-y-6">
                  {/* Engagement summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Engagement Rate', value: `${engagementRate}%`, icon: TrendingUp, color: 'text-sky-500' },
                      { label: 'Avg Views / Post', value: avgViews.toLocaleString(), icon: BarChart3, color: 'text-purple-500' },
                      { label: 'Total Likes', value: stats.likes, icon: Heart, color: 'text-red-500' },
                      { label: 'Total Comments', value: stats.comments, icon: MessageSquare, color: 'text-indigo-500' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
                        <Icon className={`w-4 h-4 mb-1.5 ${color}`} />
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-600">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Views bar chart */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Eye className="w-4 h-4 text-sky-500" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Views by Post</h3>
                    </div>
                    {publishedPosts.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-6">No published posts yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {[...publishedPosts]
                          .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
                          .slice(0, 8)
                          .map((post) => (
                            <div key={post.id}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <Link href={`/blog/${post.slug}`} className="text-gray-700 dark:text-gray-300 hover:text-sky-500 transition-colors line-clamp-1 max-w-[75%]">{post.title}</Link>
                                <span className="font-semibold text-gray-600 dark:text-gray-600 shrink-0">{(post.views ?? 0).toLocaleString()}</span>
                              </div>
                              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((post.views ?? 0) / maxViews) * 100}%` }}
                                  transition={{ duration: 0.7, ease: 'easeOut' }}
                                  className="h-2 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Likes bar chart */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Heart className="w-4 h-4 text-red-500" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Likes by Post</h3>
                    </div>
                    {publishedPosts.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-6">No published posts yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {[...publishedPosts]
                          .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
                          .slice(0, 8)
                          .map((post) => (
                            <div key={post.id}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-700 dark:text-gray-300 line-clamp-1 max-w-[75%]">{post.title}</span>
                                <span className="font-semibold text-gray-600 dark:text-gray-600 shrink-0">{post.likes ?? 0}</span>
                              </div>
                              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((post.likes ?? 0) / maxLikes) * 100}%` }}
                                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
                                  className="h-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Category distribution */}
                  {sortedCategories.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-5">
                        <BookOpen className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Posts by Category</h3>
                      </div>
                      <div className="space-y-3">
                        {sortedCategories.map(([cat, count]) => (
                          <div key={cat}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{cat}</span>
                              <span className="text-gray-600 dark:text-gray-600">{count} post{count > 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(count / myPosts.length) * 100}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                                className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-600 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                  {myPosts.length === 0
                    ? <><p className="mb-3">You haven&apos;t written any posts yet.</p><Link href="/create" className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" />Write your first post</Link></>
                    : 'No posts in this category.'}
                </div>
              ) : null}
              {filtered.map((post, i) => {
                const cfg = statusConfig[post.status];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-start gap-4 hover:shadow-md dark:hover:shadow-gray-900 transition-shadow"
                  >
                    {/* Cover thumbnail */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                      <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                        <span className={cn('shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.color)}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-600">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.commentCount}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(post.publishedAt)}</span>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="p-1.5 text-gray-600 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
                        title="View"
                      >
                        <BookOpen className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/blog/${post.slug}/edit`}
                        className="p-1.5 text-gray-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Premium Subscription Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Subscription</h3>
              </div>
              {subLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ) : subscription && subscription.subscriptionStatus === 'ACTIVE' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <Star className="h-3 w-3" /> Premium Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-600">
                    Access until{' '}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {new Date(subscription.subscriptionEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </p>
                  {paymentHistory.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-600 mb-2 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Payment History
                      </p>
                      <div className="space-y-1.5">
                        {paymentHistory.slice(0, 3).map((rec) => (
                          <div key={rec.id ?? rec.razorpayPaymentId} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-600">
                              {new Date(rec.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className={cn('font-semibold', rec.status === 'SUCCESS' ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                              {rec.status === 'SUCCESS' ? `â‚¹${(rec.amountPaid / 100).toFixed(0)}` : 'Failed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {subscription.subscriptionStatus === 'ACTIVE' && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancellingSubscription}
                      className="w-full rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-60 transition-all"
                    >
                      {cancellingSubscription ? 'Cancellingâ€¦' : 'Cancel Subscription'}
                    </button>
                  )}
                </div>
              ) : subscription && subscription.subscriptionStatus === 'CANCELLED' ? (
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-600">
                    Cancelled
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-600">
                    Access until{' '}
                    {new Date(subscription.subscriptionEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <RazorpayCheckoutButton label="Renew Premium" className="w-full justify-center text-xs py-2.5" />
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-600">
                    Free Plan
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-600">
                    Upgrade to unlock all premium articles.
                  </p>
                  <RazorpayCheckoutButton label="Upgrade â€” â‚¹499/mo" className="w-full justify-center text-xs py-2.5" />
                </div>
              )}
            </div>
            {/* Top performing post */}
            {topPost && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-sky-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Performing</h3>
                </div>
                <Link href={`/blog/${topPost.slug}`} className="block group">
                  <div className="relative h-32 rounded-xl overflow-hidden mb-3">
                    <Image src={topPost.coverImage} alt={topPost.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-sky-500 transition-colors">
                    {topPost.title}
                  </h4>
                </Link>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{topPost.views.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Views</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{topPost.likes}</div>
                    <div className="text-xs text-gray-600">Likes</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{topPost.commentCount}</div>
                    <div className="text-xs text-gray-600">Comments</div>
                  </div>
                </div>
              </div>
            )}

            {/* Trending score */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Post Rankings</h3>
              </div>
              <div className="space-y-3">
                {[...myPosts]
                  .sort((a, b) => trendingScore(b) - trendingScore(a))
                  .slice(0, 5)
                  .map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        i === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                        i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800' :
                        i === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                        'bg-gray-50 text-gray-600 dark:bg-gray-900'
                      )}>
                        {i + 1}
                      </span>
                      <Link href={`/blog/${p.slug}`} className="text-xs text-gray-600 dark:text-gray-300 hover:text-sky-500 transition-colors line-clamp-1 flex-1">
                        {p.title}
                      </Link>
                      <span className="text-xs text-gray-600 shrink-0">{Math.round(trendingScore(p))}</span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-600 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                Score = viewsÃ—0.5 + likesÃ—2 + commentsÃ—3
              </p>
            </div>

            {/* Quick actions */}
            <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-5 text-white">
              <h3 className="font-semibold mb-1">Ready to write?</h3>
              <p className="text-sky-100 text-sm mb-4">Start a new post or continue a draft.</p>
              <Link href="/create" className="flex items-center gap-2 text-sm font-medium bg-white/20 hover:bg-white/30 transition-all rounded-xl px-4 py-2.5">
                <Send className="w-4 h-4" />
                Create New Post
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
