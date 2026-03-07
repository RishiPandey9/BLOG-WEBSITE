'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenSquare, Eye, Send, Tags, Type, FileText, ArrowLeft, Save, Clock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BlogContent } from '@/components/BlogContent';
import { ImageUploader } from '@/components/ImageUploader';
import { categories } from '@/lib/data';
import { useRole } from '@/hooks/useRole';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function CreatePostPage() {
  const { isAuthenticated, isManager, isLoading } = useRole();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slug = generateSlug(title);

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
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
          You need to sign in to write blog posts.
        </p>
        <Link href="/auth/signin" className="btn-primary">Sign In to Continue</Link>
      </div>
    );
  }

  const handleSubmit = async (mode: 'draft' | 'submit' | 'publish') => {
    if (!title || !content || !category) {
      toast.error('Please fill in title, category, and content.');
      return;
    }
    setIsSubmitting(true);

    const status = mode === 'publish' ? 'published' : mode === 'draft' ? 'draft' : 'pending_review';

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          category,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          coverImage,
          status,
          slug,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save post');
      }

      if (mode === 'draft') {
        toast.success('Draft saved! ✏️');
      } else if (mode === 'publish') {
        toast.success('Post published! 🎉');
      } else {
        toast.success('Post submitted for review! ⏳ A manager will review it shortly.');
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save post';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isManager ? 'Create New Post' : 'Write an Article'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
              className="btn-ghost text-sm"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`btn-ghost text-sm ${isPreview ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : ''}`}
            >
              <Eye className="w-4 h-4" />
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            {isManager ? (
              <button onClick={() => handleSubmit('publish')} disabled={isSubmitting} className="btn-primary text-sm">
                <Send className="w-4 h-4" />
                Publish
              </button>
            ) : (
              <button onClick={() => handleSubmit('submit')} disabled={isSubmitting} className="btn-primary text-sm">
                <Clock className="w-4 h-4" />
                Submit for Review
              </button>
            )}
          </div>
        </div>

        {/* Viewer info banner */}
        {!isManager && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Your post will be submitted for <strong>Manager review</strong> before being published publicly.</span>
          </div>
        )}

        {/* Auto-generated slug preview */}
        {title && (
          <div className="mb-6 flex items-center gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-500">Slug:</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">/blog/{slug}</span>
          </div>
        )}

        {isPreview ? (
          /* Preview Mode */
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              {title || 'Untitled Post'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{excerpt}</p>
            <BlogContent content={content || '*Start writing your post...*'} />
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Type className="w-4 h-4" />
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="An amazing blog post title..."
                className="input-field text-xl font-bold"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4" />
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short summary of your post..."
                rows={2}
                className="input-field resize-none"
              />
            </div>

            {/* Cover Image */}
            <ImageUploader
              value={coverImage}
              onChange={setCoverImage}
              folder="covers"
            />

            {/* Category + Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tags className="w-4 h-4" />
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="nextjs, react, typescript (comma separated)"
                  className="input-field"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <PenSquare className="w-4 h-4" />
                Content (Markdown) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog post content in Markdown..."
                rows={20}
                className="input-field font-mono text-sm resize-y"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Supports Markdown: **bold**, *italic*, # headings, ```code blocks```, lists, and more.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
