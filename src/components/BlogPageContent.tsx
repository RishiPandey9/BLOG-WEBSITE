'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PostCard } from '@/components/PostCard';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Newsletter } from '@/components/Newsletter';
import { SkeletonCard } from '@/components/SkeletonCard';
import { categories } from '@/lib/data';
import { ListFilter, LayoutGrid, LayoutList } from 'lucide-react';
import { BlogPost } from '@/types';

export function BlogPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialTag = searchParams.get('tag') || '';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find((c) => c.slug === initialCategory)?.name || ''
  );
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.json())
      .then((data: { posts: BlogPost[] }) => setPosts(data.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        !search ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        !selectedCategory || post.category === selectedCategory;

      const matchesTag =
        !initialTag || post.tags.some((t) => t.toLowerCase() === initialTag.toLowerCase());

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [posts, search, selectedCategory, initialTag]);

  const categoryNames = categories.map((c) => c.name);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
          All <span className="gradient-text">Articles</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Explore our collection of articles about web development, design, AI, and more.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <SearchBar value={search} onChange={setSearch} />
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CategoryFilter
        categories={categoryNames}
        selected={selectedCategory}
        onChange={setSelectedCategory}
      />

      {/* Results Info */}
      <div className="flex items-center gap-2 my-6 text-sm text-gray-500 dark:text-gray-400">
        <ListFilter className="w-4 h-4" />
        <span>
          Showing <strong className="text-gray-900 dark:text-white">{filteredPosts.length}</strong> articles
          {selectedCategory && <> in <strong className="text-gray-900 dark:text-white">{selectedCategory}</strong></>}
          {search && <> matching &ldquo;<strong className="text-gray-900 dark:text-white">{search}</strong>&rdquo;</>}
        </span>
      </div>

      {/* Posts */}
      {postsLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredPosts.length > 0 ? (
        view === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="space-y-6 mb-16">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} featured />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No articles found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
}
