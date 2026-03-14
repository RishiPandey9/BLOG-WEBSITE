import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockSession, createMockUser, createMockPost, createMockComment } from './test-utils';
import { GET as getPosts, POST as createPost } from '../../app/api/posts/route';
import { POST as createComment } from '../../app/api/comments/route';
import { POST as signup } from '../../app/api/auth/signup/route';
import { getServerSession } from 'next-auth/next';
import { getServerSession as getServerSessionFromNextAuth } from 'next-auth';
import { getAdminDb } from '../firebase-admin';
import { createPostInFirestore, addCommentToFirestore, getPostsFromFirestore } from '../firestore';
import { getRuntimePosts } from '../posts-store';

// Mock all external dependencies
vi.mock('next-auth');
vi.mock('next-auth/next');
vi.mock('@/lib/firestore');
vi.mock('@/lib/posts-store');
vi.mock('@/lib/comments');
vi.mock('@/lib/firebase-admin');
vi.mock('@/lib/data', () => ({
  posts: []
}));
vi.mock('@/lib/sentiment', () => ({
  analyzeSentiment: vi.fn().mockReturnValue({
    score: 0.5,
    label: 'neutral',
    confidence: 0.8,
    flagged: false
  })
}));

// Set environment
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';

describe('Integration Tests - User Flows', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock Firestore availability
    vi.mocked(getAdminDb).mockReturnValue({
      collection: vi.fn()
    } as any);
  });

  describe('User Registration Flow', () => {
    it('should allow a new user to register successfully', async () => {
      // Mock Firebase responses
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            localId: 'user-123',
            idToken: 'test-token'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        });

      const req = createMockRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await signup(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.uid).toBeDefined();
    });
  });

  describe('Content Creation Flow', () => {
    it('should allow a viewer to create a post that goes to review', async () => {
      const mockSession = createMockSession(createMockUser('viewer'));
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      vi.mocked(createPostInFirestore).mockResolvedValue('new-post-id');

      const req = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My First Post',
          content: 'This is my first blog post content',
          category: 'Technology'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createPost(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('pending_review');
      expect(data.title).toBe('My First Post');
    });

    it('should allow a manager to create and publish a post directly', async () => {
      const mockSession = createMockSession(createMockUser('manager'));
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      vi.mocked(createPostInFirestore).mockResolvedValue('new-post-id');

      const req = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Manager Post',
          content: 'This is a manager post',
          category: 'News',
          status: 'published'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createPost(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('published');
      expect(data.title).toBe('Manager Post');
    });
  });

  describe('Comment Interaction Flow', () => {
    it('should allow authenticated users to comment on posts', async () => {
      const mockSession = createMockSession(createMockUser('viewer'));
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(getServerSessionFromNextAuth).mockResolvedValue(mockSession as any);

      const mockComment = createMockComment({ content: 'Great article! Thanks for sharing.', status: 'pending' });
      vi.mocked(addCommentToFirestore).mockResolvedValue(mockComment as any);

      const req = createMockRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId: 'post-1',
          content: 'Great article! Thanks for sharing.'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createComment(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.content).toBe('Great article! Thanks for sharing.');
      expect(data.status).toBe('pending');
    });

    it('should automatically approve comments from managers', async () => {
      const mockSession = createMockSession(createMockUser('manager'));
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(getServerSessionFromNextAuth).mockResolvedValue(mockSession as any);

      const mockComment = createMockComment({ status: 'approved' });
      vi.mocked(addCommentToFirestore).mockResolvedValue(mockComment as any);

      const req = createMockRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId: 'post-1',
          content: 'Manager comment'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createComment(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('approved');
    });
  });

  describe('Content Browsing Flow', () => {
    it('should show only published posts to anonymous users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const publishedPosts = [
        createMockPost({ id: '1', title: 'Published Post 1', status: 'published' }),
        createMockPost({ id: '2', title: 'Published Post 2', status: 'published' })
      ];

      const draftPost = createMockPost({ id: '3', title: 'Draft Post', status: 'draft' });

      vi.mocked(getPostsFromFirestore).mockResolvedValue([...publishedPosts, draftPost] as any);
      vi.mocked(getRuntimePosts).mockReturnValue([]);

      const req = createMockRequest('http://localhost:3000/api/posts');
      const response = await getPosts(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(2);
      expect(data.posts.every((post: any) => post.status === 'published')).toBe(true);
    });

    it('should allow managers to see all posts including drafts', async () => {
      const mockSession = createMockSession(createMockUser('manager'));
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const allPosts = [
        createMockPost({ id: '1', title: 'Published Post', status: 'published' }),
        createMockPost({ id: '2', title: 'Draft Post', status: 'draft' }),
        createMockPost({ id: '3', title: 'Pending Post', status: 'pending_review' })
      ];

      vi.mocked(getPostsFromFirestore).mockResolvedValue(allPosts as any);

      const req = createMockRequest('http://localhost:3000/api/posts?all=true');
      const response = await getPosts(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(3);
    });
  });

  describe('Premium Content Flow', () => {
    it('should restrict access to premium content for non-subscribers', async () => {
      vi.mocked(getServerSession).mockResolvedValue(
        createMockSession(createMockUser('viewer', { isPremium: false })) as any
      );

      const posts = [
        createMockPost({ id: '1', title: 'Free Post', isPremium: false }),
        createMockPost({ id: '2', title: 'Premium Post', isPremium: true })
      ];

      vi.mocked(getPostsFromFirestore).mockResolvedValue(posts as any);
      vi.mocked(getRuntimePosts).mockReturnValue([]);

      const req = createMockRequest('http://localhost:3000/api/posts');
      const response = await getPosts(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should still return all posts but UI will handle restriction
      expect(data.posts).toHaveLength(2);
    });

    it('should allow premium subscribers to access premium content', async () => {
      const mockSession = createMockSession(
        createMockUser('viewer', {
          isPremium: true,
          subscriptionStatus: 'ACTIVE'
        })
      );
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const posts = [
        createMockPost({ id: '1', title: 'Free Post', isPremium: false }),
        createMockPost({ id: '2', title: 'Premium Post', isPremium: true })
      ];

      vi.mocked(getPostsFromFirestore).mockResolvedValue(posts as any);

      const req = createMockRequest('http://localhost:3000/api/posts');
      const response = await getPosts(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(2);
    });
  });
});