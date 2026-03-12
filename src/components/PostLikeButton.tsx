'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface PostLikeButtonProps {
  postId: string;
  initialLikes: number;
  className?: string;
}

export function PostLikeButton({ postId, initialLikes, className }: PostLikeButtonProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [realtimeReady, setRealtimeReady] = useState(false);

  useEffect(() => {
    const postRef = doc(db, 'posts', postId);
    const unsubscribePost = onSnapshot(
      postRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { likes?: number };
          if (typeof data.likes === 'number') setLikes(data.likes);
        }
        setRealtimeReady(true);
      },
      () => {
        setRealtimeReady(false);
      }
    );

    let unsubscribeLikeDoc: (() => void) | undefined;
    const userEmail = session?.user?.email;
    if (userEmail) {
      const likeRef = doc(db, 'postLikes', `${postId}_${userEmail}`);
      unsubscribeLikeDoc = onSnapshot(
        likeRef,
        (snap) => {
          setLiked(snap.exists());
        },
        () => {
          // Keep current liked state and let API fallback drive updates.
        }
      );
    }

    return () => {
      unsubscribePost();
      if (unsubscribeLikeDoc) unsubscribeLikeDoc();
    };
  }, [postId, session?.user?.email]);

  useEffect(() => {
    if (realtimeReady) return;
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
  }, [postId, realtimeReady]);

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
