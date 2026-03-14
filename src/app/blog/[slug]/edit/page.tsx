import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlugFromFirestore } from '@/lib/firestore';
import { EditPostForm } from '@/components/EditPostForm';

interface EditPostPageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EditPostPageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const post = await getPostBySlugFromFirestore(slug);
  if (!post) return { title: 'Post Not Found' };
  return { title: `Edit: ${post.title}` };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await Promise.resolve(params);
  const post = await getPostBySlugFromFirestore(slug);

  if (!post) {
    notFound();
  }

  return <EditPostForm post={post} />;
}
