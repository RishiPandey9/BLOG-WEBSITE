import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Hero } from '@/components/Hero';
import { PostCard } from '@/components/PostCard';
import { Newsletter } from '@/components/Newsletter';
import { AnimatedSection, AnimatedCategoryGrid, AnimatedTrending, AnimatedTagCloud } from '@/components/HomeAnimations';
import { posts, categories } from '@/lib/data';
import { cn, categoryColors } from '@/lib/utils';

export default function Home() {
  const featuredPosts = posts.filter((p) => p.featured);
  const latestPosts = posts.slice(0, 6);
  const trendingPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <Hero />

      {/* Featured Posts */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Featured Posts</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Handpicked articles just for you
              </p>
            </div>
            <Link
              href="/blog"
              className="btn-ghost text-sm text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-6">
            {featuredPosts.map((post, i) => (
              <PostCard key={post.id} post={post} featured index={i} />
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Categories */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="section-title mb-8">Browse by Category</h2>
          <AnimatedCategoryGrid categories={categories} />
        </section>
      </AnimatedSection>

      {/* Latest + Trending Grid */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Latest Posts */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-title">Latest Posts</h2>
                <Link
                  href="/blog"
                  className="text-sm font-medium text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors flex items-center gap-1"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {latestPosts.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Trending */}
              <AnimatedTrending trendingPosts={trendingPosts} />

              {/* Tags Cloud */}
              <AnimatedTagCloud tags={Array.from(new Set(posts.flatMap((p) => p.tags)))} />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Newsletter */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <Newsletter />
        </section>
      </AnimatedSection>
    </div>
  );
}
