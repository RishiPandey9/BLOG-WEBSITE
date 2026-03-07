/**
 * In-memory comment store with mock data.
 * In production, replace with database calls.
 */

import { Comment, CommentStatus } from '@/types';

// Mock comments for demo
const mockComments: Comment[] = [
  {
    id: 'c1',
    postId: '1',
    author: {
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    },
    content: 'This is an amazing guide! I learned so much about Next.js 14. The section on Server Actions was especially helpful.',
    createdAt: '2024-03-01T10:30:00Z',
    likes: 12,
    likedBy: ['alice@example.com', 'bob@example.com'],
    status: 'approved',
    sentiment: { score: 0.85, label: 'positive', confidence: 0.8, flagged: false },
  },
  {
    id: 'c2',
    postId: '1',
    author: {
      name: 'Mike Rodriguez',
      email: 'mike@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    },
    content: 'Great article! Could you also cover middleware in the next one?',
    createdAt: '2024-03-02T14:15:00Z',
    likes: 5,
    likedBy: [],
    status: 'approved',
    sentiment: { score: 0.65, label: 'positive', confidence: 0.7, flagged: false },
  },
  {
    id: 'c3',
    postId: '1',
    author: {
      name: 'Emily Watson',
      email: 'emily@example.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60',
    },
    content: 'I found the examples a bit confusing. Could use more detailed explanations for beginners.',
    createdAt: '2024-03-03T09:00:00Z',
    likes: 2,
    likedBy: [],
    status: 'approved',
    sentiment: { score: -0.3, label: 'negative', confidence: 0.55, flagged: false },
  },
  {
    id: 'c4',
    postId: '1',
    author: {
      name: 'Test User',
      email: 'test@example.com',
      avatar: '',
    },
    content: 'Not bad, fairly standard Next.js tutorial content.',
    createdAt: '2024-03-04T11:00:00Z',
    likes: 0,
    likedBy: [],
    status: 'pending',
    sentiment: { score: -0.1, label: 'neutral', confidence: 0.4, flagged: false },
  },
  {
    id: 'c5',
    postId: '2',
    author: {
      name: 'Alex Park',
      email: 'alex@example.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
    },
    content: 'Absolutely love the design principles outlined here! Implementing these in my own projects right away.',
    createdAt: '2024-03-01T08:20:00Z',
    likes: 8,
    likedBy: ['sarah@example.com'],
    status: 'approved',
    sentiment: { score: 0.9, label: 'positive', confidence: 0.85, flagged: false },
  },
  {
    id: 'c6',
    postId: '3',
    author: {
      name: 'Jordan Lee',
      email: 'jordan@example.com',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=100&auto=format&fit=crop&q=60',
    },
    content: 'This tutorial was exactly what I needed. Very clear and well-structured. Thanks for sharing!',
    createdAt: '2024-03-05T16:45:00Z',
    likes: 15,
    likedBy: [],
    status: 'approved',
    sentiment: { score: 0.8, label: 'positive', confidence: 0.75, flagged: false },
  },
  {
    id: 'c7',
    postId: '2',
    author: {
      name: 'Spam Bot',
      email: 'spam@example.com',
      avatar: '',
    },
    content: 'This is terrible garbage and a waste of time!',
    createdAt: '2024-03-06T02:00:00Z',
    likes: 0,
    likedBy: [],
    status: 'pending',
    sentiment: { score: -0.9, label: 'negative', confidence: 0.9, flagged: true, reason: 'Comment has highly negative sentiment and may need review.' },
  },
];

// In-memory store (simulating a database)
let comments: Comment[] = [...mockComments];

/**
 * Get all comments for a post
 */
export function getCommentsByPostId(postId: string): Comment[] {
  return comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get approved comments for a post (public view)
 */
export function getApprovedComments(postId: string): Comment[] {
  return getCommentsByPostId(postId).filter((c) => c.status === 'approved');
}

/**
 * Get pending comments for a post
 */
export function getPendingComments(postId?: string): Comment[] {
  const filtered = postId
    ? comments.filter((c) => c.postId === postId)
    : comments;
  return filtered
    .filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get all comments (admin view)
 */
export function getAllComments(): Comment[] {
  return comments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Add a new comment
 */
export function addComment(comment: Omit<Comment, 'id'>): Comment {
  const newComment: Comment = {
    ...comment,
    id: `c${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  comments.unshift(newComment);
  return newComment;
}

/**
 * Moderate a comment  
 */
export function moderateComment(
  commentId: string,
  status: CommentStatus,
  moderatorEmail: string
): Comment | null {
  const index = comments.findIndex((c) => c.id === commentId);
  if (index === -1) return null;

  comments[index] = {
    ...comments[index],
    status,
    moderatedBy: moderatorEmail,
    moderatedAt: new Date().toISOString(),
  };
  return comments[index];
}

/**
 * Toggle like on a comment
 */
export function toggleCommentLike(commentId: string, userEmail: string): Comment | null {
  const index = comments.findIndex((c) => c.id === commentId);
  if (index === -1) return null;

  const comment = comments[index];
  const likedByArray = comment.likedBy || [];
  const hasLiked = likedByArray.includes(userEmail);

  comments[index] = {
    ...comment,
    likes: hasLiked ? comment.likes - 1 : comment.likes + 1,
    likedBy: hasLiked
      ? likedByArray.filter((e) => e !== userEmail)
      : [...likedByArray, userEmail],
  };
  return comments[index];
}

/**
 * Delete a comment
 */
export function deleteComment(commentId: string): boolean {
  const initialLength = comments.length;
  comments = comments.filter((c) => c.id !== commentId);
  return comments.length < initialLength;
}

/**
 * Get comment stats
 */
export function getCommentStats() {
  const total = comments.length;
  const approved = comments.filter((c) => c.status === 'approved').length;
  const pending = comments.filter((c) => c.status === 'pending').length;
  const rejected = comments.filter((c) => c.status === 'rejected').length;
  const flagged = comments.filter((c) => c.sentiment.flagged).length;

  return { total, approved, pending, rejected, flagged };
}
