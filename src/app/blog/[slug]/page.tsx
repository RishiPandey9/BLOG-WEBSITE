import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { Metadata } from 'next';
import { Clock, Eye, ArrowLeft, Calendar, Star } from 'lucide-react';
import { getPostBySlugFromFirestore, getPostsFromFirestore } from '@/lib/firestore';
import { formatDate, categoryColors, cn } from '@/lib/utils';
import { BlogContent } from '@/components/BlogContent';
import { PostCard } from '@/components/PostCard';
import CommentSection from '@/components/CommentSection';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { TableOfContents } from '@/components/TableOfContents';
import { PostLikeButton } from '@/components/PostLikeButton';
import { BookmarkButton } from '@/components/BookmarkButton';
import { ShareButtons } from '@/components/ShareButtons';
import {
  ParallaxHero,
  FadeInSection,
  AnimatedActionBar,
  AnimatedTags,
  AnimatedTag,
  AnimatedAuthorCard,
} from '@/components/BlogPostAnimations';
import { EditPostButton } from '@/components/EditPostButton';
import { PremiumPaywall } from '@/components/PremiumPaywall';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Always fetch fresh data so newly published posts appear immediately
export const dynamic = 'force-dynamic';

interface BlogPostPageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const allPosts = await getPostsFromFirestore();
  return allPosts
    .filter((p) => p.status === 'published')
    .map((post) => ({ slug: post.slug }));
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://devblog.vercel.app';

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const post = await getPostBySlugFromFirestore(slug);
  if (!post) return { title: 'Post Not Found' };

  const url = `${BASE_URL}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await Promise.resolve(params);
  const [post, session] = await Promise.all([
    getPostBySlugFromFirestore(slug),
    getServerSession(authOptions),
  ]);

  if (!post) {
    notFound();
  }

  // ─── Premium gate ───────────────────────────────────────────────────────────
  const userIsPremium =
    session?.user?.isPremium === true ||
    session?.user?.role === 'manager';
  const isGated = !!(post!.isPremium && !userIsPremium);

  // Truncate to the first 6 paragraphs for free previews
  const PREVIEW_PARAGRAPHS = 6;
  const paragraphs = post!.content.split(/\n\n+/);
  const previewContent =
    isGated && paragraphs.length > PREVIEW_PARAGRAPHS
      ? paragraphs.slice(0, PREVIEW_PARAGRAPHS).join('\n\n')
      : post!.content;
  // ────────────────────────────────────────────────────────────────────────────

  const allPublishedPosts = await getPostsFromFirestore();
  const relatedPosts = allPublishedPosts
    .filter((p) => p.id !== post!.id && p.category === post!.category && p.status === 'published')
    .slice(0, 3);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Anonymous',
      url: `/u/${post.author?.username || 'user'}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'DevBlog',
      logo: { '@type': 'ImageObject', url: '/favicon.ico' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `/blog/${post.slug}` },
  };

  return (
    <div className="pt-20">
      <ReadingProgressBar />
      <Script
        id="article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero with parallax */}
      <ParallaxHero>
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/blog"
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            All Posts
          </Link>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            <span
              className={cn(
                'tag-pill mb-4 inline-block',
                categoryColors[post.category] || 'bg-gray-100 text-gray-700'
              )}
            >
              {post.category}
            </span>
            {post.isPremium && (
              <span className="mb-4 ml-2 inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-xs font-bold text-white">
                <Star className="h-3 w-3" /> Premium
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Image
                  src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'User')}&background=6366f1&color=fff&format=png`}
                  alt={post.author?.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-white/30"
                />
                <span className="font-medium text-white">{post.author?.name || 'Anonymous'}</span>
              </div>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" aria-hidden="true" /> {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" /> {post.readingTime} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" aria-hidden="true" /> {post.views.toLocaleString()} views
              </span>
            </div>
          </div>
        </div>
      </ParallaxHero>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Action Bar */}
        <AnimatedActionBar>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between py-4 mb-8 border-b border-gray-200 dark:border-gray-800 gap-3">
            <div className="flex items-center gap-2">
              <PostLikeButton postId={post.id} initialLikes={post.likes} />
              <BookmarkButton postId={post.id} />
            </div>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <EditPostButton slug={post.slug} authorEmail={post.author?.email || ''} />
              <ShareButtons title={post.title} slug={post.slug} />
            </div>
          </div>
        </AnimatedActionBar>

        {/* Markdown Content + TOC */}
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {isGated ? (
              // Free preview: fade bottom of content out, then show paywall card
              <>
                <FadeInSection>
                  <div
                    className="relative overflow-hidden"
                    style={{
                      // Mask the last ~200px with a transparent-to-opaque fade
                      WebkitMaskImage:
                        'linear-gradient(to bottom, black 50%, transparent 100%)',
                      maskImage:
                        'linear-gradient(to bottom, black 50%, transparent 100%)',
                    }}
                  >
                    <BlogContent content={previewContent} />
                  </div>
                </FadeInSection>
                <PremiumPaywall isSignedIn={!!session?.user} />
              </>
            ) : (
              <FadeInSection>
                <BlogContent content={previewContent} />
              </FadeInSection>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents content={post.content} />
            </div>
          </div>
        </div>

        {/* Tags */}
        <AnimatedTags>
          {post.tags.map((tag) => (
            <AnimatedTag key={tag}>
              <Link
                href={`/tag/${tag.toLowerCase()}`}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-600 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all inline-block"
              >
                #{tag}
              </Link>
            </AnimatedTag>
          ))}
        </AnimatedTags>

        {/* Author Card */}
        <AnimatedAuthorCard>
        <Link href={`/u/${post.author?.username || 'user'}`} className="block">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-12 hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
          <div className="flex items-start gap-4">
            <Image
              src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'User')}&background=6366f1&color=fff&format=png`}
              alt={post.author?.name || 'User'}
              width={56}
              height={56}
              className="rounded-xl"
            />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white hover:text-sky-500 transition-colors">{post.author?.name || 'Anonymous'}</h3>
              <p className="text-xs text-sky-500 font-mono mb-1">@{post.author?.username || 'user'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-600">{post.author?.bio || ''}</p>
            </div>
          </div>
        </div>
        </Link>
        </AnimatedAuthorCard>

        {/* Comment Section */}
        <CommentSection postId={post.id} />

        <div className="my-12 border-t border-gray-200 dark:border-gray-800" />

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <FadeInSection>
            <h2 className="section-title mb-6">Related Articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((rp, i) => (
                <PostCard key={rp.id} post={rp} index={i} />
              ))}
            </div>
          </FadeInSection>
        )}
      </div>
    </div>
  );
}
