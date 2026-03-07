import { MetadataRoute } from 'next';
import { posts, categories } from '@/lib/data';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://devblog.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const postEntries: MetadataRoute.Sitemap = posts
    .filter((p) => p.status === 'published')
    .map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'weekly',
      priority: post.featured ? 0.9 : 0.7,
    }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/blog?category=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags.map((t) => t.toLowerCase()))));
  const tagEntries: MetadataRoute.Sitemap = allTags.map((tag) => ({
    url: `${BASE_URL}/tag/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const authorUsernames = Array.from(new Set(posts.map((p) => p.author.username)));
  const authorEntries: MetadataRoute.Sitemap = authorUsernames.map((username) => ({
    url: `${BASE_URL}/u/${username}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    ...postEntries,
    ...categoryEntries,
    ...tagEntries,
    ...authorEntries,
  ];
}
