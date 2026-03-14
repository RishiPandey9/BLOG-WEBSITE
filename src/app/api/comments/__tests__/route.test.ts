import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  getCommentsByPostIdFromFirestore,
  addCommentToFirestore,
  getPendingCommentsFromFirestore,
  getAllCommentsFromFirestore
} from '@/lib/firestore';
import {
  getCommentsByPostId,
  addComment,
  getPendingComments,
  getAllComments,
  getCommentStats
} from '@/lib/comments';
import { getAdminDb } from '@/lib/firebase-admin';

// Mock all external dependencies
vi.mock('next-auth');
vi.mock('@/lib/firestore');
vi.mock('@/lib/comments');
vi.mock('@/lib/firebase-admin');
vi.mock('@/lib/sentiment', () => ({
  analyzeSentiment: vi.fn().mockReturnValue({
    score: 0.5,
    label: 'neutral',
    confidence: 0.8,
    flagged: false
  })
}));

// Mock environment
process.env.NODE_ENV = 'test';

describe('COMMENTS API Routes', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock Firestore availability
    vi.mocked(getAdminDb).mockReturnValue({
      collection: vi.fn()
    } as any);
  });

  describe('GET /api/comments', () => {
    it('should return comments for a post', async () => {
      const mockComments = [
        {
          id: '1',
          postId: 'post-1',
          content: 'Great post!',
          status: 'approved',
          author: { name: 'User', email: 'user@example.com', avatar: '' }
        }
      ];

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'user@example.com' }
      } as any);

      vi.mocked(getCommentsByPostIdFromFirestore).mockResolvedValue(mockComments as any);
      vi.mocked(getCommentsByPostId).mockReturnValue([]);

      const req = new Request('http://localhost:3000/api/comments?postId=post-1');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].content).toBe('Great post!');
    });

    it('should return only approved comments for non-owners', async () => {
      const mockComments = [
        { id: '1', content: 'Approved comment', status: 'approved', author: { email: 'other@example.com' } },
        { id: '2', content: 'Pending comment', status: 'pending', author: { email: 'other@example.com' } }
      ];

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'user@example.com' }
      } as any);

      vi.mocked(getCommentsByPostIdFromFirestore).mockResolvedValue(mockComments as any);

      const req = new Request('http://localhost:3000/api/comments?postId=post-1');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].status).toBe('approved');
    });

    it('should return all comments for managers', async () => {
      const mockComments = [
        { id: '1', content: 'Approved comment', status: 'approved' },
        { id: '2', content: 'Pending comment', status: 'pending' }
      ];

      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'manager' }
      } as any);

      vi.mocked(getCommentsByPostIdFromFirestore).mockResolvedValue(mockComments as any);

      const req = new Request('http://localhost:3000/api/comments?postId=post-1');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
    });

    it('should return comment stats for managers with stats=true', async () => {
      const mockStats = {
        total: 10,
        approved: 7,
        pending: 2,
        rejected: 1,
        flagged: 1
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'manager' }
      } as any);

      vi.mocked(getAllCommentsFromFirestore).mockResolvedValue([
        { status: 'approved', sentiment: { flagged: false } },
        { status: 'pending', sentiment: { flagged: true } }
      ] as any);

      const req = new Request('http://localhost:3000/api/comments?stats=true');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total).toBeDefined();
      expect(data.approved).toBeDefined();
    });

    it('should return 403 for stats request by non-managers', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'viewer' }
      } as any);

      const req = new Request('http://localhost:3000/api/comments?stats=true');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when postId is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/comments');
      const response = await GET(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('postId is required');
    });
  });

  describe('POST /api/comments', () => {
    it('should return 401 for unauthorized users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({ postId: 'post-1', content: 'Test comment' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Must be signed in to comment');
    });

    it('should create a comment with pending status for viewers', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: 'avatar.jpg',
          role: 'viewer'
        }
      } as any);

      const mockComment = {
        id: 'comment-1',
        postId: 'post-1',
        content: 'Test comment',
        status: 'pending',
        author: { name: 'Test User', email: 'test@example.com', avatar: 'avatar.jpg' }
      };

      vi.mocked(addCommentToFirestore).mockResolvedValue(mockComment as any);

      const req = new Request('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({ postId: 'post-1', content: 'Test comment' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('pending');
      expect(data.content).toBe('Test comment');
    });

    it('should create a comment with approved status for managers', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          name: 'Admin User',
          email: 'admin@example.com',
          image: 'avatar.jpg',
          role: 'manager'
        }
      } as any);

      const mockComment = {
        id: 'comment-1',
        postId: 'post-1',
        content: 'Admin comment',
        status: 'approved',
        author: { name: 'Admin User', email: 'admin@example.com', avatar: 'avatar.jpg' }
      };

      vi.mocked(addCommentToFirestore).mockResolvedValue(mockComment as any);

      const req = new Request('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({ postId: 'post-1', content: 'Admin comment' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('approved');
      expect(data.content).toBe('Admin comment');
    });

    it('should validate required fields', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'viewer' }
      } as any);

      const req = new Request('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({ postId: 'post-1' }), // Missing content
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('postId and content are required');
    });

    it('should reject comments that are too long', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'viewer' }
      } as any);

      const longContent = 'A'.repeat(2001); // Over 2000 characters

      const req = new Request('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({ postId: 'post-1', content: longContent }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Comment too long (max 2000 chars)');
    });
  });
});