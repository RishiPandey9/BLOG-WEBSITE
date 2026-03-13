'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface PostLikeButtonProps {
  postId: string;
  initialLikes: number;
  className?: string;
}

export function PostLikeButton({ postId, initialLikes, className }: PostLikeButtonProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);

  useEffect(() => {
    let isMounted = true;

    async function loadLikeStatus() {
      try {
        const res = await fetch(`/api/posts/${postId}/like`, { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        setLiked(Boolean(data.liked));
        if (typeof data.likes === 'number') setLikes(data.likes);
      } catch {
        // Keep server-rendered fallback values.
      }
    }

    loadLikeStatus();
    return () => {
      isMounted = false;
    };
  }, [postId, session?.user?.email]);

  const handleLike = async () => {
    if (!session) {
      toast.error('Sign in to like posts');
      return;
    }

    const next = !liked;
    setLiked(next);
    setLikes((prev) => (next ? prev + 1 : prev - 1));

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: next ? 'like' : 'unlike' }),
      });
      if (!res.ok) {
        throw new Error('Like request failed');
      }
      const data = await res.json();
      if (typeof data.likes === 'number') {
        setLikes(data.likes);
      }
      if (typeof data.liked === 'boolean') {
        setLiked(data.liked);
      }
    } catch {
      // revert on error
      setLiked(!next);
      setLikes((prev) => (next ? prev - 1 : prev + 1));
      toast.error('Could not save like. Check Firestore configuration.');
    }
  };

  return (
    <button
      onClick={handleLike}
      aria-label={liked ? `Unlike post. ${likes} likes` : `Like post. ${likes} likes`}
      aria-pressed={liked}
      className={cn(
        'btn-ghost text-sm transition-all',
        liked ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : '',
        className
      )}
    >
      <Heart className={cn('w-4 h-4', liked && 'fill-red-500 dark:fill-red-400')} aria-hidden="true" />
      <span aria-hidden="true">{likes.toLocaleString()}</span>
    </button>
  );
}
