import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import {
  getPostsFromFirestore,
  createPostInFirestore,
  deletePostFromFirestore
} from '@/lib/firestore';
import { getRuntimePosts, addRuntimePost, deleteRuntimePost } from '@/lib/posts-store';
import { getAdminDb } from '@/lib/firebase-admin';

// Mock all external dependencies
vi.mock('next-auth/next');
vi.mock('@/lib/firestore');
vi.mock('@/lib/posts-store');
vi.mock('@/lib/firebase-admin');
vi.mock('@/lib/data', () => ({
  posts: [
    {
      id: '1',
      slug: 'test-post',
      title: 'Test Post',
      excerpt: 'Test excerpt',
      content: 'Test content',
      coverImage: 'test.jpg',
      category: 'Test',
      tags: ['test'],
      author: {
        name: 'Test Author',
        username: 'testauthor',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        bio: 'Test bio'
      },
      publishedAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      readingTime: 5,
      likes: 10,
      views: 100,
      commentCount: 5,
      featured: false,
      status: 'published'
    }
  ]
}));

// Mock environment
process.env.NODE_ENV = 'test';

describe('POSTS API Routes', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock Firestore availability
    vi.mocked(getAdminDb).mockReturnValue({
      collection: vi.fn()
    } as any);

    // Route logic reads these before role checks, so keep safe defaults.
    vi.mocked(getPostsFromFirestore).mockResolvedValue([] as any);
    vi.mocked(getRuntimePosts).mockReturnValue([]);
  });

  describe('GET /api/posts', () => {
    it('should return published posts for anonymous users', async () => {
      const mockPosts = [{
        id: '1',
        slug: 'test-post',
        title: 'Test Post',
        status: 'published'
      }];

      vi.mocked(getPostsFromFirestore).mockResolvedValue(mockPosts as any);
      vi.mocked(getRuntimePosts).mockReturnValue([]);
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/posts');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(1);
      expect(data.posts[0].status).toBe('published');
    });

    it('should return user\'s posts when mine=true', async () => {
      const mockPosts = [{
        id: '1',
        slug: 'my-post',
        title: 'My Post',
        status: 'published',
        author: { email: 'user@example.com' }
      }];

      vi.mocked(getPostsFromFirestore).mockResolvedValue(mockPosts as any);
      vi.mocked(getRuntimePosts).mockReturnValue([]);
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'user@example.com' }
      } as any);

      const req = new Request('http://localhost:3000/api/posts?mine=true');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(1);
      expect(data.posts[0].author.email).toBe('user@example.com');
    });

    it('should return all posts for managers when all=true', async () => {
      const mockPosts = [
        { id: '1', title: 'Published Post', status: 'published' },
        { id: '2', title: 'Draft Post', status: 'draft' }
      ];

      vi.mocked(getPostsFromFirestore).mockResolvedValue(mockPosts as any);
      vi.mocked(getRuntimePosts).mockReturnValue([]);
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'manager' }
      } as any);

      const req = new Request('http://localhost:3000/api/posts?all=true');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(2);
    });

    it('should return 403 for non-managers when all=true', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'viewer' }
      } as any);

      const req = new Request('http://localhost:3000/api/posts?all=true');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('POST /api/posts', () => {
    it('should return 401 for unauthorized users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should create a post with pending_review status for viewers', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: 'avatar.jpg',
          role: 'viewer'
        }
      } as any);

      vi.mocked(createPostInFirestore).mockResolvedValue('new-post-id');

      const postData = {
        title: 'New Post',
        content: 'Post content here',
        category: 'Technology'
      };

      const req = new Request('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('pending_review');
      expect(data.title).toBe('New Post');
    });

    it('should create a post with published status for managers', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          name: 'Admin User',
          email: 'admin@example.com',
          image: 'avatar.jpg',
          role: 'manager'
        }
      } as any);

      vi.mocked(createPostInFirestore).mockResolvedValue('new-post-id');

      const postData = {
        title: 'Admin Post',
        content: 'Admin content here',
        category: 'News',
        status: 'published'
      };

      const req = new Request('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('published');
      expect(data.title).toBe('Admin Post');
    });

    it('should validate required fields', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'viewer' }
      } as any);

      const postData = {
        title: '', // Missing required field
        content: 'Some content'
        // Missing category
      };

      const req = new Request('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('title, content, and category are required');
    });
  });

  describe('DELETE /api/posts', () => {
    it('should return 403 for non-managers', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'viewer' }
      } as any);

      const req = new Request('http://localhost:3000/api/posts?id=test-post', {
        method: 'DELETE'
      });

      const response = await DELETE(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should delete a post for managers', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'manager' }
      } as any);

      vi.mocked(deletePostFromFirestore).mockResolvedValue(undefined);

      const req = new Request('http://localhost:3000/api/posts?id=test-post', {
        method: 'DELETE'
      });

      const response = await DELETE(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(deletePostFromFirestore).toHaveBeenCalledWith('test-post');
    });

    it('should require an id parameter', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'manager' }
      } as any);

      const req = new Request('http://localhost:3000/api/posts', {
        method: 'DELETE'
      });

      const response = await DELETE(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('id is required');
    });
  });
});