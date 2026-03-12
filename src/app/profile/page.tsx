'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PenSquare, Calendar, Heart, Eye, Settings, LogIn, Shield } from 'lucide-react';
import { posts } from '@/lib/data';
import { PostCard } from '@/components/PostCard';
import { useRole } from '@/hooks/useRole';

export default function ProfilePage() {
  const { session, isAuthenticated, isLoading, isManager, label: roleLabel, badgeColor } = useRole();

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
        <div className="text-6xl mb-4">👋</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h1>
        <p className="text-gray-600 dark:text-gray-600 mb-6 max-w-md">
          Sign in to view your profile and manage your posts.
        </p>
        <Link href="/auth/signin" className="btn-primary">
          <LogIn className="w-4 h-4" />
          Sign In
        </Link>
      </div>
    );
  }

  const userPosts = posts.slice(0, 3); // Mock: show some posts as user's posts

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? 'User'}
                width={96}
                height={96}
                className="rounded-2xl ring-4 ring-white/30 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-4xl font-bold">
                {session?.user?.name?.[0] ?? 'U'}
              </div>
            )}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold">{session?.user?.name}</h1>
                <span className={`tag-pill text-xs ${badgeColor}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {roleLabel}
                </span>
              </div>
              <p className="text-sky-100 text-sm mt-1">{session?.user?.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                <span className="flex items-center gap-1 text-sm text-sky-100">
                  <PenSquare className="w-4 h-4" /> {userPosts.length} Posts
                </span>
                <span className="flex items-center gap-1 text-sm text-sky-100">
                  <Heart className="w-4 h-4" /> 342 Likes
                </span>
                <span className="flex items-center gap-1 text-sm text-sky-100">
                  <Eye className="w-4 h-4" /> 12.4K Views
                </span>
              </div>
            </div>
            <div className="md:ml-auto">
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition-all flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Posts</h2>
          {isManager && (
            <Link href="/create" className="btn-primary text-sm py-2 px-4">
              <PenSquare className="w-4 h-4" />
              New Post
            </Link>
          )}
        </div>

        {/* User Posts */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {userPosts.length === 0 && (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div className="text-5xl mb-4">✍️</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No posts yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-600 mb-4">
              Start sharing your knowledge with the community!
            </p>
            <Link href="/create" className="btn-primary text-sm">
              Write Your First Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
