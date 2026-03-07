import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { posts } from '@/lib/data';
import { EditPostForm } from '@/components/EditPostForm';

interface EditPostPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: EditPostPageProps): Promise<Metadata> {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return { title: 'Post Not Found' };
  return { title: `Edit: ${post.title}` };
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return <EditPostForm post={post} />;
}
