import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

// Utility to create a mock NextRequest
export function createMockRequest(url: string, options: RequestInit = {}): NextRequest {
  return new Request(url, options) as unknown as NextRequest;
}

// Utility to create a mock session
export function createMockSession(user: any = null) {
  return {
    user: user || null,
    expires: '2023-12-31T23:59:59.000Z'
  };
}

// Utility to mock getServerSession
export function mockGetServerSession(session: any = null) {
  vi.mocked(getServerSession).mockResolvedValue(session);
}

// Utility to create a mock user with specific role
export function createMockUser(role: string = 'viewer', overrides: any = {}) {
  return {
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
    role,
    ...overrides
  };
}

// Utility to create a mock post
export function createMockPost(overrides: any = {}) {
  return {
    id: 'post-1',
    slug: 'test-post',
    title: 'Test Post',
    excerpt: 'Test excerpt',
    content: 'Test content',
    coverImage: 'https://example.com/image.jpg',
    category: 'Technology',
    tags: ['test', 'technology'],
    author: {
      name: 'Test Author',
      username: 'testauthor',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Test author bio'
    },
    publishedAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    readingTime: 5,
    likes: 10,
    views: 100,
    commentCount: 5,
    featured: false,
    status: 'published',
    ...overrides
  };
}

// Utility to create a mock comment
export function createMockComment(overrides: any = {}) {
  return {
    id: 'comment-1',
    postId: 'post-1',
    content: 'Test comment',
    author: {
      name: 'Test Commenter',
      email: 'commenter@example.com',
      avatar: 'https://example.com/avatar.jpg'
    },
    createdAt: '2023-01-01T00:00:00Z',
    likes: 5,
    likedBy: [],
    status: 'approved',
    sentiment: {
      score: 0.5,
      label: 'neutral',
      confidence: 0.8,
      flagged: false
    },
    ...overrides
  };
}