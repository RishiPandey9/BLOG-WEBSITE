'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Heart, Eye, ArrowUpRight, MessageSquare, Star, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/types';
import { formatDate, categoryColors, cn } from '@/lib/utils';

interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
  index?: number;
}

export function PostCard({ post, featured = false, index = 0 }: PostCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className={cn(
        'group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-gray-900/50 hover:border-sky-300 dark:hover:border-sky-700',
        featured ? 'md:flex' : ''
      )}
    >
      {/* Cover Image */}
      <div className={cn(
        'relative overflow-hidden',
        featured ? 'md:w-2/5 h-56 md:h-auto' : 'h-52'
      )}>
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes={featured ? '(max-width: 768px) 100vw, 40vw' : '(max-width: 768px) 100vw, 33vw'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {post.featured && (
          <div className="absolute top-3 left-3">
            <Badge variant="default" className="shadow-lg bg-amber-500 hover:bg-amber-600 border-0">
              <Star className="w-3 h-3" /> Featured
            </Badge>
          </div>
        )}
        {post.isPremium && (
          <div className={cn('absolute', post.featured ? 'top-3 left-28' : 'top-3 left-3')}>
            <Badge variant="warning" className="shadow-lg border-0">
              <Star className="w-3 h-3 fill-white" /> Premium
            </Badge>
          </div>
        )}
        {post.isPremium && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-1 text-white">
              <Lock className="w-8 h-8 drop-shadow-lg" />
              <span className="text-xs font-semibold drop-shadow">Members only</span>
            </div>
          </div>
        )}
        {post.status !== 'published' && (
          <div className="absolute top-3 right-3">
            <Badge
              variant={post.status === 'draft' ? 'secondary' : post.status === 'pending_review' ? 'warning' : 'destructive'}
              className="shadow-lg"
            >
              {post.status === 'draft' ? '📝 Draft' : post.status === 'pending_review' ? '⏳ In Review' : '❌ Rejected'}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('p-6 flex flex-col', featured ? 'md:w-3/5 justify-center' : '')}>
        {/* Category + Reading Time */}
        <div className="flex items-center gap-3 mb-3">
          <Badge variant="outline" className={cn(
            'border-transparent',
            categoryColors[post.category] || 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/50'
          )}>
            {post.category}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {post.readingTime} min read
          </span>
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h2 className={cn(
            'font-bold text-gray-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors line-clamp-2 mb-2',
            featured ? 'text-2xl' : 'text-lg'
          )}>
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-4 leading-relaxed">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Image
              src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'User')}&background=6366f1&color=fff&format=png`}
              alt={post.author?.name || 'User'}
              width={28}
              height={28}
              className="rounded-full ring-2 ring-gray-100 dark:ring-gray-800"
            />
            <div>
              <Link href={`/u/${post.author?.username || 'user'}`} className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-sky-500 transition-colors">{post.author?.name || 'Anonymous'}</Link>
              <p className="text-xs text-gray-600 dark:text-gray-300">{formatDate(post.publishedAt)}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
              <Heart className="w-3 h-3 transition-transform group-hover:scale-110" aria-hidden="true" />
              {post.likes}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
              <Eye className="w-3 h-3" aria-hidden="true" />
              {post.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
              <MessageSquare className="w-3 h-3" aria-hidden="true" />
              {post.commentCount}
            </span>
            <Link
              href={`/blog/${post.slug}`}
              className="flex items-center gap-1 text-xs font-semibold text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors group/link"
            >
              {post.isPremium ? <Lock className="w-3 h-3" aria-hidden="true" /> : null}
              {post.isPremium ? 'Preview' : 'Read'}
              <ArrowUpRight className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
