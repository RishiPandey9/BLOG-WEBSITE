'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Category, BlogPost } from '@/types';
import {
  ScrollReveal,
  StaggerWrapper,
  StaggerItem,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleUp,
} from './motion';

// ─── Wrapper: reveals each section on scroll ──────────────

export function AnimatedSection({ children }: { children: ReactNode }) {
  return (
    <ScrollReveal variant={fadeInUp} duration={0.7}>
      {children}
    </ScrollReveal>
  );
}

// ─── Animated Category Grid ───────────────────────────────

export function AnimatedCategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <StaggerWrapper className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" fast>
      {categories.map((cat) => (
        <StaggerItem key={cat.id} variant={scaleUp}>
          <Link
            href={`/blog?category=${cat.slug}`}
            className="group block p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-300 hover:shadow-lg text-center"
          >
            <motion.div
              whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.4 }}
              className="text-3xl mb-2 inline-block"
            >
              {cat.icon}
            </motion.div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
              {cat.name}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{cat.postCount} posts</p>
          </Link>
        </StaggerItem>
      ))}
    </StaggerWrapper>
  );
}

// ─── Animated Trending Sidebar ────────────────────────────

export function AnimatedTrending({ trendingPosts }: { trendingPosts: BlogPost[] }) {
  return (
    <ScrollReveal variant={fadeInRight} delay={0.1}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-sky-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Trending</h3>
        </div>
        <div className="space-y-4">
          {trendingPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group flex gap-3"
              >
                <span className="text-2xl font-extrabold text-gray-200 dark:text-gray-700 group-hover:text-sky-400 transition-colors">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {post.views.toLocaleString()} views
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

// ─── Animated Tags Cloud ──────────────────────────────────

export function AnimatedTagCloud({ tags }: { tags: string[] }) {
  return (
    <ScrollReveal variant={fadeInRight} delay={0.2}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              whileHover={{ scale: 1.1, y: -2 }}
            >
              <Link
                href={`/tag/${tag.toLowerCase()}`}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all inline-block"
              >
                #{tag}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
