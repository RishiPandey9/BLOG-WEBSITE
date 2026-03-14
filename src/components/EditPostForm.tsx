'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PenSquare, Eye, Save,
  Tags, Type, FileText, ArrowLeft, ShieldAlert, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BlogContent } from '@/components/BlogContent';
import { ImageUploader } from '@/components/ImageUploader';
import { TipTapEditor } from '@/components/TipTapEditor';
import { categories } from '@/lib/data';
import { useRole } from '@/hooks/useRole';
import type { BlogPost } from '@/types';

interface EditPostFormProps {
  post: BlogPost;
}

function decodeHtmlEntities(input: string): string {
  const decodeOnce = (value: string): string => {
    if (typeof window !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = value;
      return textarea.value;
    }

    return value
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x2F;/gi, '/')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  };

  let decoded = input;
  for (let i = 0; i < 3; i += 1) {
    const next = decodeOnce(decoded);
    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
}

export function EditPostForm({ post }: EditPostFormProps) {
  const { isAuthenticated, isManager, isLoading, label, session } = useRole();
  const router = useRouter();
  const initialContent = decodeHtmlEntities(post.content);

  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(initialContent);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [category, setCategory] = useState(post.category);
  const [tags, setTags] = useState(post.tags.join(', '));
  const [coverImage, setCoverImage] = useState(post.coverImage);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = (session?.user?.email ?? '').toLowerCase() === (post.author.email ?? '').toLowerCase();
  const canEditPost = isManager || isOwner;

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
        <p className="text-gray-600 dark:text-gray-600 mb-6 max-w-md">
          You need to sign in to edit blog posts.
        </p>
        <Link href="/auth/signin" className="btn-primary">Sign In to Continue</Link>
      </div>
    );
  }

  if (!canEditPost) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-600 mb-2 max-w-md">
          Your current role is <strong className="text-gray-900 dark:text-white">{label}</strong>.
        </p>
        <p className="text-gray-600 dark:text-gray-600 mb-6 max-w-md">
          Only the original post author or a <strong className="text-amber-600 dark:text-amber-400">Manager</strong> can edit this post.
        </p>
        <Link href={`/blog/${post.slug}`} className="btn-secondary">Back to Post</Link>
      </div>
    );
  }

  const handleSave = async () => {
    if (!title || !content || !category) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          category,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          coverImage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update post' }));
        throw new Error(err.error || 'Failed to update post');
      }

      toast.success('Post updated successfully! ✅');
      router.push(`/blog/${post.slug}`);
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update post';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty =
    title !== post.title ||
    content !== initialContent ||
    excerpt !== post.excerpt ||
    category !== post.category ||
    tags !== post.tags.join(', ') ||
    coverImage !== post.coverImage;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Link href={`/blog/${post.slug}`} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back to Post
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Post</h1>
              <p className="text-xs text-gray-600 dark:text-gray-600 mt-0.5">
                Editing: <span className="text-amber-600 dark:text-amber-400 font-medium">{post.title}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full font-medium"
              >
                Unsaved changes
              </motion.span>
            )}
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`btn-ghost text-sm ${isPreview ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : ''}`}
            >
              <Eye className="w-4 h-4" />
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="btn-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <><CheckCircle2 className="w-4 h-4" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </motion.div>

        {isPreview ? (
          /* Preview Mode */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8"
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 mb-4">
              {category || 'Uncategorised'}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              {title || 'Untitled Post'}
            </h1>
            <p className="text-gray-600 dark:text-gray-600 mb-8 border-l-4 border-sky-400 pl-4 italic">{excerpt}</p>
            <BlogContent content={content || '*Start writing your post...*'} />
          </motion.div>
        ) : (
          /* Edit Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="space-y-6"
          >
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
                Content <span className="text-red-500">*</span>
              </label>
              <TipTapEditor
                value={content}
                onChange={setContent}
                placeholder="Update your blog post content..."
              />
            </div>

            {/* Post metadata (read-only) */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-600 mb-1">Post ID</p>
                <p className="font-mono text-gray-600 dark:text-gray-300 text-xs">{post.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-600 mb-1">Slug</p>
                <p className="font-mono text-gray-600 dark:text-gray-300 text-xs">{post.slug}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-600 mb-1">Published</p>
                <p className="text-gray-600 dark:text-gray-300 text-xs">{new Date(post.publishedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-600 mb-1">Reading Time</p>
                <p className="text-gray-600 dark:text-gray-300 text-xs">{post.readingTime} min</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
