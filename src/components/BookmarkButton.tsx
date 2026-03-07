'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  postId: string;
  className?: string;
}

export function BookmarkButton({ postId, className }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('bookmarks') || '[]') as string[];
    setBookmarked(stored.includes(postId));
  }, [postId]);

  const toggle = () => {
    const stored = JSON.parse(localStorage.getItem('bookmarks') || '[]') as string[];
    const next = stored.includes(postId)
      ? stored.filter((id) => id !== postId)
      : [...stored, postId];
    localStorage.setItem('bookmarks', JSON.stringify(next));
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? 'Bookmark removed' : 'Post bookmarked!');
  };

  return (
    <button
      onClick={toggle}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
      className={cn(
        'btn-ghost text-sm transition-all',
        bookmarked
          ? 'text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20'
          : '',
        className
      )}
    >
      <Bookmark className={cn('w-4 h-4', bookmarked && 'fill-sky-500 dark:fill-sky-400')} />
      {bookmarked ? 'Saved' : 'Save'}
    </button>
  );
}
