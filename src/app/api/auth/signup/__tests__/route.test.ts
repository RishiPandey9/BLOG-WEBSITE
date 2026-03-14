import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn().mockReturnValue({
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue(undefined)
      })
    })
  })
}));

// Mock Resend
vi.mock('@/lib/resend', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined)
}));

describe('SIGNUP API Route', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    mockFetch.mockReset();

    // Set environment variables
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
  });

  it('should return 400 when required fields are missing', async () => {
    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }), // Missing name and password
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name, email and password are required.');
  });

  it('should return 400 when password is too short', async () => {
    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: '123' // Too short
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password must be at least 6 characters.');
  });

  it('should return 503 when Firebase is not configured', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'your_firebase_api_key'; // Not configured

    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Firebase is not configured yet. Add your API key to .env.local');
  });

  it('should successfully create a user', async () => {
    // Mock successful Firebase signup response
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        localId: 'user-123',
        idToken: 'test-token'
      })
    }));

    // Mock successful update display name response
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    }));

    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.uid).toBe('user-123');
  });

  it('should handle EMAIL_EXISTS error', async () => {
    // Mock Firebase signup error response
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({
        error: { message: 'EMAIL_EXISTS' }
      })
    }));

    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('An account with this email already exists.');
  });

  it('should handle WEAK_PASSWORD error', async () => {
    // Mock Firebase signup error response
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({
        error: { message: 'WEAK_PASSWORD' }
      })
    }));

    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password must be at least 6 characters.');
  });
});