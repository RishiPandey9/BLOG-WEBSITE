'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatRelativeDate } from '@/lib/utils';
import { getSentimentEmoji, getSentimentColor } from '@/lib/sentiment';
import { Comment } from '@/types';
import {
  MessageSquare,
  Heart,
  Send,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewSentiment, setPreviewSentiment] = useState<string | null>(null);

  const userEmail = session?.user?.email || '';
  const userRole = (session?.user as { role?: string })?.role || 'viewer';
  const isManagerUser = userRole === 'manager';

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      // Ignore abort errors and transient network failures; polling will retry.
      if (err instanceof Error && err.name === 'AbortError') return;
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void fetchComments();
    const id = window.setInterval(() => {
      void fetchComments();
    }, 10000);
    return () => window.clearInterval(id);
  }, [fetchComments]);

  // Live sentiment preview as user types
  useEffect(() => {
    if (newComment.trim().length < 10) {
      setPreviewSentiment(null);
      return;
    }
    const timer = setTimeout(async () => {
      // We import the sentiment analysis dynamically to keep it client-side
      const { analyzeSentiment } = await import('@/lib/sentiment');
      const result = analyzeSentiment(newComment);
      setPreviewSentiment(
        `${getSentimentEmoji(result.label)} ${result.label.charAt(0).toUpperCase() + result.label.slice(1)} sentiment`
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [newComment]);

  // Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: newComment.trim() }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setNewComment('');
        setPreviewSentiment(null);
        if (comment.status === 'pending') {
          toast.success('Comment submitted! It will appear once approved by a moderator.');
        } else {
          toast.success('Comment posted!');
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to post comment');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Like a comment
  const handleLike = async (commentId: string) => {
    if (!session) {
      toast.error('Please sign in to like comments');
      return;
    }
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== commentId) return c;

            const liked = Boolean(updated.liked);
            const nextLikedBy = liked
              ? Array.from(new Set([...(c.likedBy ?? []), userEmail]))
              : (c.likedBy ?? []).filter((e) => e !== userEmail);

            return {
              ...c,
              likes: typeof updated.likes === 'number' ? updated.likes : c.likes,
              likedBy: nextLikedBy,
            };
          })
        );
      }
    } catch {
      toast.error('Failed to like comment');
    }
  };

  // Moderate a comment
  const handleModerate = async (commentId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moderate', status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  status,
                  moderatedBy: (updated as { moderatedBy?: string }).moderatedBy ?? c.moderatedBy,
                  moderatedAt: (updated as { moderatedAt?: string }).moderatedAt ?? c.moderatedAt,
                }
              : c
          )
        );
        toast.success(`Comment ${status}`);
      }
    } catch {
      toast.error('Failed to moderate comment');
    }
  };

  // Delete a comment
  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success('Comment deleted');
      }
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const approvedComments = comments.filter((c) => c.status === 'approved');
  const pendingComments = comments.filter((c) => c.status === 'pending');
  const myPendingComments = pendingComments.filter((c) => c.author?.email === userEmail);
  const otherPendingComments = pendingComments.filter((c) => c.author?.email !== userEmail);

  return (
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Comments
            <span className="ml-2 text-base font-normal text-gray-600 dark:text-gray-600">
              ({approvedComments.length})
            </span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-600">
            Share your thoughts on this post
          </p>
        </div>
      </div>

      {/* Comment Form */}
      <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm">
        {session ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-start gap-3">
              <img
                src={session.user?.image || '/default-avatar.png'}
                alt={session.user?.name || 'User'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900/30"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {session.user?.name}
                  </span>
                  {isManagerUser && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      <Shield className="w-3 h-3" />
                      Manager
                    </span>
                  )}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a thoughtful comment..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all resize-none"
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    {previewSentiment && (
                      <span className="text-xs text-gray-600 dark:text-gray-600 flex items-center gap-1 animate-in fade-in">
                        {previewSentiment}
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {newComment.length}/2000
                    </span>
                    {!isManagerUser && newComment.trim().length > 0 && (
                      <span className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Requires approval
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <MessageSquare className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-600 mb-2">
              Sign in to join the conversation
            </p>
            <a
              href="/auth/signin"
              className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2"
            >
              Sign In to Comment
            </a>
          </div>
        )}
      </div>

      {/* My Pending Comments */}
      {myPendingComments.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Your pending comments ({myPendingComments.length})
            </span>
          </div>
          <div className="space-y-3">
            {myPendingComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                userEmail={userEmail}
                isManager={isManagerUser}
                onLike={handleLike}
                onModerate={handleModerate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Manager: Other Pending Comments */}
      {isManagerUser && otherPendingComments.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Pending Approval ({otherPendingComments.length})
            </span>
          </div>
          <div className="space-y-3">
            {otherPendingComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                userEmail={userEmail}
                isManager={isManagerUser}
                onLike={handleLike}
                onModerate={handleModerate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved Comments */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : approvedComments.length > 0 ? (
        <div className="space-y-4">
          {approvedComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              userEmail={userEmail}
              isManager={isManagerUser}
              onLike={handleLike}
              onModerate={handleModerate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-600">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      )}
    </section>
  );
}

// Individual Comment Card

interface CommentCardProps {
  comment: Comment;
  userEmail: string;
  isManager: boolean;
  onLike: (id: string) => void;
  onModerate: (id: string, status: 'approved' | 'rejected') => void;
  onDelete: (id: string) => void;
}

function CommentCard({
  comment,
  userEmail,
  isManager,
  onLike,
  onModerate,
  onDelete,
}: CommentCardProps) {
  const hasLiked = comment.likedBy?.includes(userEmail) ?? false;
  const isPending = comment.status === 'pending';
  const isRejected = comment.status === 'rejected';

  return (
    <div
      className={`group p-4 rounded-xl border transition-all ${
        isPending
          ? 'bg-amber-50/50 dark:bg-amber-900/5 border-amber-200/50 dark:border-amber-800/20'
          : isRejected
          ? 'bg-red-50/50 dark:bg-red-900/5 border-red-200/50 dark:border-red-800/20 opacity-60'
          : 'bg-white dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600/50'
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <img
          src={comment.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.name || 'User')}&background=6366f1&color=fff&format=png`}
          alt={comment.author?.name || 'User'}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {comment.author?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-600">
              {formatRelativeDate(comment.createdAt)}
            </span>

            {/* Status badge */}
            {isPending && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <Clock className="w-3 h-3" />
                Pending
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                <XCircle className="w-3 h-3" />
                Rejected
              </span>
            )}

            {/* Sentiment badge */}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getSentimentColor(
                comment.sentiment.label
              )}`}
              title={`Sentiment: ${comment.sentiment.label} (score: ${comment.sentiment.score})`}
            >
              {getSentimentEmoji(comment.sentiment.label)}
              {comment.sentiment.label}
            </span>

            {/* Flagged indicator */}
            {comment.sentiment.flagged && isManager && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                <AlertTriangle className="w-3 h-3" />
                Flagged
              </span>
            )}
          </div>

          {/* Comment content */}
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Flagged reason for managers */}
          {comment.sentiment.flagged && comment.sentiment.reason && isManager && (
            <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/20">
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {comment.sentiment.reason}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            {/* Like button */}
            <button
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                hasLiked
                  ? 'text-rose-500'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-all ${
                  hasLiked ? 'fill-current scale-110' : ''
                }`}
              />
              <span>{comment.likes > 0 ? comment.likes : 'Like'}</span>
            </button>

            {/* Manager moderation controls */}
            {isManager && isPending && (
              <>
                <button
                  onClick={() => onModerate(comment.id, 'approved')}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => onModerate(comment.id, 'rejected')}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}

            {/* Delete button for managers */}
            {isManager && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}

            {/* Moderation info */}
            {comment.moderatedBy && isManager && (
              <span className="text-xs text-gray-600 ml-auto">
                {comment.status === 'approved' ? 'Approved' : 'Rejected'} by {comment.moderatedBy}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
