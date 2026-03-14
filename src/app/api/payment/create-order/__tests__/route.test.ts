import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { getServerSession } from 'next-auth/next';
import { createPremiumOrder } from '@/lib/razorpay';

// Mock external dependencies
vi.mock('next-auth/next');
vi.mock('@/lib/razorpay');

describe('PAYMENT CREATE-ORDER API Route', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('You must be signed in to subscribe');
  });

  it('should return 400 when user is already a manager', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        email: 'manager@example.com',
        role: 'manager'
      }
    } as any);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Managers already have full access');
  });

  it('should successfully create a payment order for viewers', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        email: 'user@example.com',
        name: 'Test User',
        role: 'viewer'
      }
    } as any);

    const mockOrder = {
      orderId: 'order_123',
      amount: 49900,
      currency: 'INR',
      keyId: 'rzp_test_key'
    };

    vi.mocked(createPremiumOrder).mockResolvedValue(mockOrder);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.orderId).toBe('order_123');
    expect(data.amount).toBe(49900);
    expect(data.currency).toBe('INR');
    expect(data.email).toBe('user@example.com');
    expect(data.description).toBe('DevBlog Premium — 30-day access');
  });

  it('should return 500 when order creation fails', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        email: 'user@example.com',
        role: 'viewer'
      }
    } as any);

    vi.mocked(createPremiumOrder).mockRejectedValue(new Error('Razorpay API error'));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Razorpay API error');
  });
});