'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRole } from '@/hooks/useRole';
import { formatRelativeDate } from '@/lib/utils';
import { getSentimentEmoji, getSentimentColor } from '@/lib/sentiment';
import { Comment, BlogPost, AdminDelegation } from '@/types';
import {
  Shield, ShieldAlert, Users, FileText, Eye, TrendingUp,
  PenSquare, Trash2, BarChart3, Settings,
  MessageSquare, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, Star,
  Crown, BadgeDollarSign, IndianRupee, UserPlus, UserX, Timer
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { isAuthenticated, isManager, isMainAdmin, isLoading, label } = useRole();

  // Local type for the user list returned by /api/admin/users
  type UserListEntry = {
    email: string;
    name: string;
    image?: string;
    postCount: number;
    isPremium: boolean;
    subscriptionEndDate?: string;
    isAdmin: boolean;
  };

  // All hooks must be called before any early returns
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [commentStats, setCommentStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, flagged: 0 });
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState<{
    subscriberCount: number;
    totalRevenuePaise: number;
    currentMonthRevenuePaise: number;
    totalPayments: number;
  } | null>(null);

  // Users & Delegation state
  const [users, setUsers] = useState<UserListEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [delegations, setDelegations] = useState<AdminDelegation[]>([]);
  const [delegationsLoading, setDelegationsLoading] = useState(true);
  const [userTab, setUserTab] = useState<'all' | 'subscribers' | 'admins'>('all');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantName, setGrantName] = useState('');
  const [grantAvatar, setGrantAvatar] = useState('');
  const [grantDuration, setGrantDuration] = useState<'1h' | '6h' | '1d' | '3d' | '1w' | '1m' | 'custom'>('1d');
  const [grantCustomDate, setGrantCustomDate] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  const fetchCommentData = useCallback(async () => {
    try {
      const [pendingRes, statsRes] = await Promise.all([
        fetch('/api/comments?pending=true'),
        fetch('/api/comments?stats=true'),
      ]);
      if (pendingRes.ok) setPendingComments(await pendingRes.json());
      if (statsRes.ok) setCommentStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const fetchAllPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?all=true');
      if (res.ok) {
        const data = await res.json() as { posts: BlogPost[] };
        setAllPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json() as { users: UserListEntry[] };
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchDelegations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/delegations');
      if (res.ok) {
        const data = await res.json() as { delegations: AdminDelegation[] };
        setDelegations(data.delegations);
      }
    } catch (err) {
      console.error('Failed to fetch delegations:', err);
    } finally {
      setDelegationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isManager) {
      fetchCommentData();
      fetchAllPosts();
      fetchUsers();
      fetchDelegations();
      // Fetch revenue stats
      fetch('/api/subscription', { method: 'POST' })
        .then((r) => r.ok ? r.json() : null)
        .then((data: { subscriberCount: number; revenue: { totalRevenuePaise: number; currentMonthRevenuePaise: number; totalPayments: number } } | null) => {
          if (data) setRevenueStats({
            subscriberCount: data.subscriberCount,
            totalRevenuePaise: data.revenue?.totalRevenuePaise ?? 0,
            currentMonthRevenuePaise: data.revenue?.currentMonthRevenuePaise ?? 0,
            totalPayments: data.revenue?.totalPayments ?? 0,
          });
        })
        .catch(console.error);
    }
  }, [isManager, fetchCommentData, fetchAllPosts, fetchUsers, fetchDelegations]);

  const handleModerate = async (commentId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moderate', status }),
      });
      if (res.ok) {
        setPendingComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentStats((prev) => ({
          ...prev,
          pending: prev.pending - 1,
          [status]: prev[status as 'approved' | 'rejected'] + 1,
        }));
        toast.success(`Comment ${status}`);
      }
    } catch {
      toast.error('Failed to moderate comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setPendingComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentStats((prev) => ({ ...prev, total: prev.total - 1, pending: prev.pending - 1 }));
        toast.success('Comment deleted');
      }
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAllPosts((prev) => prev.filter((p) => p.id !== id));
        toast.success('Post deleted');
      } else {
        toast.error('Failed to delete post');
      }
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handlePublishPost = async (id: string, currentStatus: BlogPost['status']) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAllPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));
        toast.success(newStatus === 'published' ? 'Post published!' : 'Post unpublished');
      }
    } catch {
      toast.error('Failed to update post');
    }
  };

  const handleTogglePremium = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: !current }),
      });
      if (res.ok) {
        setAllPosts((prev) => prev.map((p) => p.id === id ? { ...p, isPremium: !current } : p));
        toast.success(!current ? 'Marked as Premium ★' : 'Removed premium gate');
      } else {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to update premium status');
      }
    } catch {
      toast.error('Failed to update post');
    }
  };

  const handleGrantAdmin = async () => {
    if (!grantEmail) { toast.error('Select a user first'); return; }
    const now = Date.now();
    let expiresAt: string;
    switch (grantDuration) {
      case '1h':  expiresAt = new Date(now + 1  * 60 * 60 * 1000).toISOString(); break;
      case '6h':  expiresAt = new Date(now + 6  * 60 * 60 * 1000).toISOString(); break;
      case '1d':  expiresAt = new Date(now + 1  * 24 * 60 * 60 * 1000).toISOString(); break;
      case '3d':  expiresAt = new Date(now + 3  * 24 * 60 * 60 * 1000).toISOString(); break;
      case '1w':  expiresAt = new Date(now + 7  * 24 * 60 * 60 * 1000).toISOString(); break;
      case '1m':  expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(); break;
      case 'custom':
        if (!grantCustomDate) { toast.error('Pick a custom expiry date'); return; }
        expiresAt = new Date(grantCustomDate).toISOString();
        break;
      default: expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    }
    setGrantLoading(true);
    try {
      const res = await fetch('/api/admin/delegations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: grantEmail, userName: grantName || grantEmail, userAvatar: grantAvatar, expiresAt }),
      });
      if (res.ok) {
        toast.success(`Admin access granted to ${grantName || grantEmail} until ${new Date(expiresAt).toLocaleString()}`);
        setShowGrantModal(false);
        setGrantEmail(''); setGrantName(''); setGrantAvatar(''); setGrantDuration('1d'); setGrantCustomDate('');
        fetchDelegations();
      } else {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to grant admin access');
      }
    } catch { toast.error('Failed to grant admin access'); }
    finally { setGrantLoading(false); }
  };

  const handleRevokeAdmin = async (id: string, name: string) => {
    if (!confirm(`Revoke admin access for ${name}? They will lose admin privileges within a few minutes.`)) return;
    try {
      const res = await fetch(`/api/admin/delegations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setDelegations((prev) => prev.map((d) => d.id === id ? { ...d, isRevoked: true } : d));
        toast.success(`Admin access revoked for ${name}`);
      } else {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to revoke');
      }
    } catch { toast.error('Failed to revoke admin access'); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isManager) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-600 mb-2 max-w-md">
          {isAuthenticated
            ? <>Your current role is <strong className="text-gray-900 dark:text-white">{label}</strong>.</>
            : 'You must sign in first.'}
        </p>
        <p className="text-gray-600 dark:text-gray-600 mb-6 max-w-md">
          Only <strong className="text-amber-600 dark:text-amber-400">Managers</strong> can access the admin panel.
        </p>
        <Link href={isAuthenticated ? '/blog' : '/auth/signin'} className="btn-secondary">
          {isAuthenticated ? 'Browse Articles' : 'Sign In'}
        </Link>
      </div>
    );
  }

  const totalViews = allPosts.reduce((sum, p) => sum + (p.views ?? 0), 0);
  const totalLikes = allPosts.reduce((sum, p) => sum + (p.likes ?? 0), 0);
  const pendingPostsCount = allPosts.filter((p) => p.status === 'pending_review').length;

  const nowIso = new Date().toISOString();
  const activeDelegations = delegations.filter((d) => !d.isRevoked && d.expiresAt > nowIso);

  // Fall back to post authors when Firestore users collection is empty
  const displayUsers: UserListEntry[] = users.length > 0
    ? users
    : Array.from(new Map(allPosts.map((p) => [p.author.email, {
        email: p.author.email,
        name: p.author.name,
        image: p.author.avatar,
        postCount: allPosts.filter((x) => x.author.email === p.author.email).length,
        isPremium: false,
        isAdmin: false,
      }])).values());
  const subscriberUsers = displayUsers.filter((u) => u.isPremium);

  const stats = [
    { label: 'Total Posts', value: allPosts.length, icon: FileText, color: 'text-sky-500 bg-sky-100 dark:bg-sky-900/30' },
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Total Likes', value: totalLikes.toLocaleString(), icon: TrendingUp, color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30' },
    { label: 'Comments', value: commentStats.total, icon: MessageSquare, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Pending Posts', value: pendingPostsCount, icon: Clock, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Authors', value: new Set(allPosts.map((p) => p.author.email)).size, icon: Users, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
  ];

  // Mock users for the admin panel
  const mockUsers = [
    { name: 'Alex Johnson', email: 'alex@devblog.com', role: 'manager' as const, posts: 2, avatar: '💻' },
    { name: 'Sarah Chen', email: 'sarah@devblog.com', role: 'manager' as const, posts: 1, avatar: '🎨' },
    { name: 'Marcus Williams', email: 'marcus@devblog.com', role: 'viewer' as const, posts: 0, avatar: '🚀' },
    { name: 'Priya Patel', email: 'priya@devblog.com', role: 'viewer' as const, posts: 0, avatar: '🤖' },
    { name: 'Jordan Lee', email: 'jordan@devblog.com', role: 'viewer' as const, posts: 0, avatar: '✨' },
  ];

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-sm text-gray-600 dark:text-gray-600">Manage posts, users, and site settings</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-600 dark:text-gray-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue / Premium Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Premium Subscribers',
              value: revenueStats ? revenueStats.subscriberCount.toString() : '—',
              icon: Crown,
              color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
            },
            {
              label: 'Total Revenue',
              value: revenueStats ? `₹${(revenueStats.totalRevenuePaise / 100).toFixed(0)}` : '—',
              icon: IndianRupee,
              color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
            },
            {
              label: 'Monthly Revenue',
              value: revenueStats ? `₹${(revenueStats.currentMonthRevenuePaise / 100).toFixed(0)}` : '—',
              icon: BadgeDollarSign,
              color: 'text-sky-500 bg-sky-100 dark:bg-sky-900/30',
            },
            {
              label: 'Total Payments',
              value: revenueStats ? revenueStats.totalPayments.toString() : '—',
              icon: BarChart3,
              color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-600 dark:text-gray-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Posts Table */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-500" />
                  All Posts
                  {pendingPostsCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                      {pendingPostsCount} pending
                    </span>
                  )}
                </h2>
                <Link href="/create" className="btn-primary text-xs py-1.5 px-3">
                  <PenSquare className="w-3 h-3" /> New
                </Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {postsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  </div>
                ) : allPosts.length === 0 ? (
                  <div className="text-center py-10 text-gray-600 text-sm">No posts yet.</div>
                ) : (
                  allPosts.map((post) => (
                    <div key={post.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-sky-500 dark:hover:text-sky-400 transition-colors truncate block">
                          {post.title}
                        </Link>
                        <p className="text-xs text-gray-600 dark:text-gray-600 mt-0.5 flex items-center gap-2">
                          <span>{post.category} • {post.author.name}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            post.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            post.status === 'pending_review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            post.status === 'draft' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-600' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {post.status === 'pending_review' ? 'Pending Review' : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {post.status === 'pending_review' && (
                          <button
                            onClick={() => handlePublishPost(post.id, post.status)}
                            className="p-1.5 text-gray-600 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                            title="Publish"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {post.status === 'published' && (
                          <button
                            onClick={() => handlePublishPost(post.id, post.status)}
                            className="p-1.5 text-gray-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                            title="Unpublish"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleTogglePremium(post.id, !!post.isPremium)}
                          className={`p-1.5 rounded-lg transition-all ${
                            post.isPremium
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                              : 'text-gray-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          }`}
                          title={post.isPremium ? 'Remove premium gate' : 'Mark as premium'}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/blog/${post.slug}/edit`}
                          className="p-1.5 text-gray-600 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
                          title="Edit"
                        >
                          <PenSquare className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comment Moderation Panel */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  Comment Moderation
                  {commentStats.pending > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                      {commentStats.pending} pending
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {commentStats.approved} approved
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-400" />
                    {commentStats.rejected} rejected
                  </span>
                  {commentStats.flagged > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertTriangle className="w-3 h-3" />
                      {commentStats.flagged} flagged
                    </span>
                  )}
                </div>
              </div>

              {commentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                </div>
              ) : pendingComments.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-300 dark:text-emerald-700 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-600">All caught up! No pending comments.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pendingComments.map((comment) => (
                    <div key={comment.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={comment.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.name || 'User')}&background=6366f1&color=fff&size=32&format=png`}
                          alt={comment.author?.name || 'User'}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {comment.author?.name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-600">
                              {formatRelativeDate(comment.createdAt)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getSentimentColor(comment.sentiment.label)}`}
                            >
                              {getSentimentEmoji(comment.sentiment.label)} {comment.sentiment.label}
                            </span>
                            {comment.sentiment.flagged && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                <AlertTriangle className="w-3 h-3" />
                                Flagged
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            on post: <span className="text-gray-600 dark:text-gray-300">{allPosts.find(p => p.id === comment.postId)?.title || comment.postId}</span>
                          </p>
                          {comment.sentiment.flagged && comment.sentiment.reason && (
                            <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/20">
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {comment.sentiment.reason}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleModerate(comment.id, 'approved')}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleModerate(comment.id, 'rejected')}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Users & Delegation Panel */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tabbed Users / Subscribers / Delegated Admins */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 pt-4 pb-0 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-amber-500" />
                    Users &amp; Access
                  </h2>
                  {isMainAdmin && (
                    <button
                      onClick={() => { setGrantEmail(''); setGrantName(''); setGrantAvatar(''); setShowGrantModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 rounded-lg transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Grant Admin
                    </button>
                  )}
                </div>
                {/* Tabs */}
                <div className="flex">
                  {([
                    { id: 'all' as const, label: 'All Users' },
                    { id: 'subscribers' as const, label: 'Subscribers' },
                    { id: 'admins' as const, label: 'Delegated' },
                  ]).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setUserTab(tab.id)}
                      className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                        userTab === tab.id
                          ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                          : 'border-transparent text-gray-600 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      {tab.label}
                      {tab.id === 'admins' && activeDelegations.length > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-violet-500 text-white rounded-full">
                          {activeDelegations.length}
                        </span>
                      )}
                      {tab.id === 'subscribers' && subscriberUsers.length > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                          {subscriberUsers.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* All Users Tab */}
              {userTab === 'all' && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    </div>
                  ) : displayUsers.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 text-sm">No users found.</div>
                  ) : (
                    displayUsers.map((user) => {
                      const isDelegate = activeDelegations.some((d) => d.userEmail === user.email);
                      return (
                        <div key={user.email} className="flex items-center gap-3 px-4 py-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=32&format=png`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {user.isPremium && (
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            <span className={`tag-pill text-[10px] ${
                              user.isAdmin
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                : isDelegate
                                ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
                                : 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
                            }`}>
                              {user.isAdmin ? 'Admin' : isDelegate ? 'Delegated' : 'Viewer'}
                            </span>
                            {isMainAdmin && !user.isAdmin && !isDelegate && (
                              <button
                                onClick={() => { setGrantEmail(user.email); setGrantName(user.name); setGrantAvatar(user.image ?? ''); setShowGrantModal(true); }}
                                className="p-1 text-gray-300 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                                title="Grant temporary admin access"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Subscribers Tab */}
              {userTab === 'subscribers' && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    </div>
                  ) : subscriberUsers.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 text-sm">No active premium subscribers yet.</div>
                  ) : (
                    subscriberUsers.map((user) => (
                      <div key={user.email} className="flex items-center gap-3 px-4 py-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f59e0b&color=fff&size=32&format=png`}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span className="tag-pill text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Premium
                          </span>
                          {user.subscriptionEndDate && (
                            <span className="text-[10px] text-gray-600">
                              until {new Date(user.subscriptionEndDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Delegated Admins Tab */}
              {userTab === 'admins' && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
                  {delegationsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    </div>
                  ) : delegations.length === 0 ? (
                    <div className="text-center py-10">
                      <Shield className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                      <p className="text-sm text-gray-600">No delegations have been created.</p>
                      {isMainAdmin && (
                        <button
                          onClick={() => { setGrantEmail(''); setGrantName(''); setGrantAvatar(''); setShowGrantModal(true); }}
                          className="mt-3 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          Grant your first delegation →
                        </button>
                      )}
                    </div>
                  ) : (
                    delegations.map((d) => {
                      const isActive = !d.isRevoked && d.expiresAt > nowIso;
                      return (
                        <div key={d.id} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                              <Shield className="w-4 h-4 text-violet-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{d.userName}</p>
                                <span className={`tag-pill text-[10px] ${
                                  isActive
                                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
                                    : d.isRevoked
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-600'
                                }`}>
                                  {isActive ? 'Active' : d.isRevoked ? 'Revoked' : 'Expired'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">{d.userEmail}</p>
                              <p className="text-xs text-gray-600">
                                by <span className="text-gray-600 dark:text-gray-300">{d.grantedByName}</span>
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Timer className="w-3 h-3 text-gray-600 flex-shrink-0" />
                                <span className={`text-[10px] ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600'}`}>
                                  {isActive
                                    ? `Expires ${new Date(d.expiresAt).toLocaleString()}`
                                    : d.isRevoked
                                    ? 'Access revoked'
                                    : `Expired ${new Date(d.expiresAt).toLocaleString()}`}
                                </span>
                              </div>
                            </div>
                            {isMainAdmin && isActive && (
                              <button
                                onClick={() => handleRevokeAdmin(d.id, d.userName)}
                                className="p-1.5 text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0"
                                title="Revoke admin access"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-600" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link
                  href="/create"
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <PenSquare className="w-4 h-4 text-sky-500" />
                  Write a New Post
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  Author Dashboard
                </Link>
                <Link
                  href="/blog"
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  Browse All Posts
                </Link>
              </div>
            </div>

            {/* RBAC Info */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6">
              <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role Permissions (RBAC)
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Admin (Permanent)</span>
                  <p className="text-amber-600/80 dark:text-amber-400/60 mt-0.5">
                    Full control. Can grant &amp; revoke delegated admin access. Set via MANAGER_EMAILS env var.
                  </p>
                </div>
                <div className="border-t border-amber-200 dark:border-amber-800/50 pt-3">
                  <span className="font-semibold text-violet-700 dark:text-violet-400">Delegated Admin</span>
                  <p className="text-amber-600/80 dark:text-amber-400/60 mt-0.5">
                    Temporary admin access with expiry. Can manage posts &amp; moderate comments. Cannot create other admins.
                  </p>
                </div>
                <div className="border-t border-amber-200 dark:border-amber-800/50 pt-3">
                  <span className="font-semibold text-sky-700 dark:text-sky-400">Viewer</span>
                  <p className="text-amber-600/80 dark:text-amber-400/60 mt-0.5">
                    Read posts. Create comments. Edit own profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Grant Admin Modal ──────────────────────────────── */}
        {showGrantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-violet-500" />
                  Grant Temporary Admin Access
                </h2>
                <button
                  onClick={() => setShowGrantModal(false)}
                  className="text-gray-600 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-lg leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-5">
                {/* User email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    User email
                  </label>
                  {displayUsers.length > 0 ? (
                    <select
                      value={grantEmail}
                      onChange={(e) => {
                        const selected = displayUsers.find((u) => u.email === e.target.value);
                        setGrantEmail(e.target.value);
                        setGrantName(selected?.name ?? '');
                        setGrantAvatar(selected?.image ?? '');
                      }}
                      className="input-field w-full text-sm"
                    >
                      <option value="">-- Select a user --</option>
                      {displayUsers.filter((u) => !u.isAdmin).map((u) => (
                        <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="email"
                      value={grantEmail}
                      onChange={(e) => setGrantEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="input-field w-full text-sm"
                    />
                  )}
                  {grantEmail && (
                    <p className="text-xs text-gray-600 dark:text-gray-600 mt-1">Granting to: <strong>{grantName || grantEmail}</strong></p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Access duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: '1h',  label: '1 Hour' },
                      { id: '6h',  label: '6 Hours' },
                      { id: '1d',  label: '1 Day' },
                      { id: '3d',  label: '3 Days' },
                      { id: '1w',  label: '1 Week' },
                      { id: '1m',  label: '1 Month' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGrantDuration(opt.id)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                          grantDuration === opt.id
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setGrantDuration('custom')}
                    className={`mt-2 w-full px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      grantDuration === 'custom'
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-400'
                    }`}
                  >
                    Custom date &amp; time
                  </button>
                  {grantDuration === 'custom' && (
                    <input
                      type="datetime-local"
                      value={grantCustomDate}
                      onChange={(e) => setGrantCustomDate(e.target.value)}
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                      className="input-field w-full text-sm mt-2"
                    />
                  )}
                </div>

                {/* Security note */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    The delegated admin will be able to publish posts and moderate comments, but <strong>cannot</strong> grant admin access to others. Only you can revoke this access.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowGrantModal(false)}
                    className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGrantAdmin}
                    disabled={!grantEmail || grantLoading}
                    className="flex-1 py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {grantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Grant Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
