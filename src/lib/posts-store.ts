/**
 * In-memory post store — fallback when Firestore is not available.
 * New posts created via the API are stored here for the server's lifetime.
 * In production with Firestore configured, this is bypassed.
 */

import { BlogPost } from '@/types';

// Mutable in-memory store (module-level singleton)
const runtimePosts: BlogPost[] = [];

export function getRuntimePosts(): BlogPost[] {
  return [...runtimePosts];
}

export function addRuntimePost(post: BlogPost): void {
  runtimePosts.unshift(post); // newest first
}

export function updateRuntimePost(id: string, data: Partial<BlogPost>): boolean {
  const idx = runtimePosts.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  runtimePosts[idx] = { ...runtimePosts[idx], ...data, updatedAt: new Date().toISOString() };
  return true;
}

export function deleteRuntimePost(id: string): boolean {
  const idx = runtimePosts.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  runtimePosts.splice(idx, 1);
  return true;
}

/**
 * Upsert: update if the post already exists in runtime store,
 * otherwise insert it at the front. Used to seed static posts
 * with overrides (e.g. isPremium toggle) when Firestore is unavailable.
 */
export function upsertRuntimePost(post: BlogPost): void {
  const idx = runtimePosts.findIndex((p) => p.id === post.id);
  if (idx !== -1) {
    runtimePosts[idx] = { ...post, updatedAt: new Date().toISOString() };
  } else {
    runtimePosts.unshift(post);
  }
}
