'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { BlogPost } from '@/types';
import { posts as staticPosts } from '@/lib/data';
import { PostCard } from '@/components/PostCard';

export default function BookmarksPage() {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<BlogPost[]>([]);
  const [allPosts, setAllPosts] = useState<BlogPost[]>(staticPosts);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch all published posts from API (includes Firestore + runtime posts)
  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.json())
      .then((data: { posts: BlogPost[] }) => {
        if (data.posts?.length) setAllPosts(data.posts);
      })
      .catch(() => {});
  }, []);

  // Read bookmarks from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('bookmarks') || '[]') as string[];
    const saved = allPosts.filter((p) => stored.includes(p.id));
    setBookmarkedPosts(saved);
    setIsLoaded(true);
  }, [allPosts]);

  const removeBookmark = (postId: string) => {
    const stored = JSON.parse(localStorage.getItem('bookmarks') || '[]') as string[];
    const updated = stored.filter((id) => id !== postId);
    localStorage.setItem('bookmarks', JSON.stringify(updated));
    setBookmarkedPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/blog" className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-sky-600 dark:text-sky-400 fill-sky-600 dark:fill-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Posts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoaded
                ? bookmarkedPosts.length === 0
                  ? 'No saved posts yet'
                  : `${bookmarkedPosts.length} post${bookmarkedPosts.length !== 1 ? 's' : ''} saved`
                : 'Loading...'}
            </p>
          </div>
        </div>

        {isLoaded && bookmarkedPosts.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <Bookmark className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookmarks yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Click the <strong>Save</strong> button on any post to bookmark it for later reading.
            </p>
            <Link href="/blog" className="btn-primary">
              Browse Posts
            </Link>
          </div>
        )}

        {bookmarkedPosts.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedPosts.map((post, i) => (
              <div key={post.id} className="relative group">
                <PostCard post={post} index={i} />
                <button
                  onClick={() => removeBookmark(post.id)}
                  className="absolute top-3 right-3 z-10 p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sky-500 hover:text-red-500 hover:border-red-300 transition-all opacity-0 group-hover:opacity-100"
                  title="Remove bookmark"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
