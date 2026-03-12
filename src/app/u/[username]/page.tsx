import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { posts } from '@/lib/data';
import { formatDate, categoryColors, cn } from '@/lib/utils';
import { Calendar, Eye, Heart, MessageSquare, Github, Twitter, Linkedin, Globe, Users } from 'lucide-react';
import { PostCard } from '@/components/PostCard';

interface AuthorPageProps {
  params: { username: string };
}

// Build a unique author map from post data
function getAuthorByUsername(username: string) {
  const post = posts.find((p) => p.author.username === username);
  return post?.author ?? null;
}

export async function generateStaticParams() {
  const usernames = Array.from(new Set(posts.map((p) => p.author.username)));
  return usernames.map((username) => ({ username }));
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const author = getAuthorByUsername(params.username);
  if (!author) return { title: 'Author Not Found' };
  return {
    title: `${author.name} — DevBlog`,
    description: author.bio,
    openGraph: { title: author.name, description: author.bio, images: [author.avatar] },
  };
}

export default function AuthorProfilePage({ params }: AuthorPageProps) {
  const author = getAuthorByUsername(params.username);
  if (!author) notFound();

  const authorPosts = posts.filter(
    (p) => p.author.username === params.username && p.status === 'published'
  );

  const totalViews = authorPosts.reduce((s, p) => s + p.views, 0);
  const totalLikes = authorPosts.reduce((s, p) => s + p.likes, 0);
  const totalComments = authorPosts.reduce((s, p) => s + p.commentCount, 0);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 mb-10 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-transparent to-indigo-50 dark:from-sky-950/20 dark:to-indigo-950/20 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Image
                src={author.avatar}
                alt={author.name}
                width={96}
                height={96}
                className="rounded-2xl ring-4 ring-sky-200 dark:ring-sky-900/50 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full ring-2 ring-white dark:ring-gray-900" title="Active author" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                {author.name}
              </h1>
              <p className="text-sky-600 dark:text-sky-400 font-mono text-sm mb-2">@{author.username}</p>
              <p className="text-gray-600 dark:text-gray-300 max-w-xl">{author.bio}</p>

              {/* Social links */}
              <div className="flex items-center gap-2 mt-3">
                <a href="#" className="p-1.5 text-gray-600 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" aria-label="GitHub">
                  <Github className="w-4 h-4" />
                </a>
                <a href="#" className="p-1.5 text-gray-600 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all" aria-label="Twitter">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="p-1.5 text-gray-600 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" aria-label="Website">
                  <Globe className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Follow count + button */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-600">
                <Users className="w-4 h-4" />
                <span className="font-semibold text-gray-900 dark:text-white">248</span> followers
              </div>
              <button className="btn-primary text-sm">
                Follow
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            {[
              { label: 'Articles', value: authorPosts.length, icon: '✍️' },
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: '👁️' },
              { label: 'Total Likes', value: totalLikes.toLocaleString(), icon: '❤️' },
              { label: 'Comments', value: totalComments.toLocaleString(), icon: '💬' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="text-center">
                <div className="text-xl mb-0.5">{icon}</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-600 dark:text-gray-600">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Author's posts */}
        <h2 className="section-title mb-6">Articles by {author.name}</h2>

        {authorPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-600">No published articles yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {authorPosts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
