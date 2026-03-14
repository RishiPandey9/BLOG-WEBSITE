'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useRole } from '@/hooks/useRole';

interface EditPostButtonProps {
  slug: string;
  authorEmail: string;
}

export function EditPostButton({ slug, authorEmail }: EditPostButtonProps) {
  const { isManager, session } = useRole();
  const isOwner = (session?.user?.email ?? '').toLowerCase() === authorEmail.toLowerCase();

  if (!isManager && !isOwner) return null;

  return (
    <Link href={`/blog/${slug}/edit`} className="btn-ghost text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20">
      <Pencil className="w-4 h-4" />
      Edit Post
    </Link>
  );
}
