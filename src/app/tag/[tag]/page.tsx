import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { posts } from '@/lib/data';
import { PostCard } from '@/components/PostCard';
import { Tag, ArrowLeft } from 'lucide-react';

interface TagPageProps {
  params: { tag: string };
}

export async function generateStaticParams() {
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags.map((t) => t.toLowerCase()))));
  return Array.from(allTags).map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const decodedTag = decodeURIComponent(params.tag);
  return {
    title: `#${decodedTag} — DevBlog`,
    description: `All articles tagged with #${decodedTag} on DevBlog`,
  };
}

export default function TagPage({ params }: TagPageProps) {
  const decodedTag = decodeURIComponent(params.tag);

  const tagPosts = posts.filter((p) =>
    p.status === 'published' &&
    p.tags.some((t) => t.toLowerCase() === decodedTag.toLowerCase())
  );

  if (tagPosts.length === 0) notFound();

  // Related tags — tags appearing on the same posts (excluding current)
  const relatedTags = Array.from(
    new Set(tagPosts.flatMap((p) => p.tags.filter((t) => t.toLowerCase() !== decodedTag.toLowerCase())))
  ).slice(0, 12);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Articles
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
                #{decodedTag}
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-13">
              {tagPosts.length} {tagPosts.length === 1 ? 'article' : 'articles'} tagged with&nbsp;
              <span className="text-sky-500 font-medium">#{decodedTag}</span>
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Posts grid */}
          <div className="lg:col-span-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tagPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
            </div>
          </div>

          {/* Sidebar — related tags */}
          <div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Related Tags</h3>
              <div className="flex flex-wrap gap-2">
                {relatedTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tag/${tag.toLowerCase()}`}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
