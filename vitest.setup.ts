import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.MANAGER_EMAILS = 'manager@example.com';
process.env.GITHUB_ID = 'test-github-id';
process.env.GITHUB_SECRET = 'test-github-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';
process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-project';
process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test@test.com';
process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';

// Mock NextAuth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null)),
}));

// Mock Firebase
vi.mock('firebase-admin/app', () => ({
  cert: vi.fn(),
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ exists: false, data: () => null })),
        set: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
      })),
      where: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ docs: [] })),
      })),
      get: vi.fn(() => Promise.resolve({ docs: [] })),
    })),
  })),
}));

// Mock external dependencies
vi.mock('@/lib/razorpay', () => ({
  verifyRazorpaySignature: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/lib/cloudinary', () => ({
  uploadImage: vi.fn(() => Promise.resolve({ url: 'https://test.com/image.jpg', publicId: 'test-id' })),
}));

vi.mock('@/lib/resend', () => ({
  sendWelcomeEmail: vi.fn(() => Promise.resolve()),
  sendCommentApprovedEmail: vi.fn(() => Promise.resolve()),
  sendPaymentConfirmationEmail: vi.fn(() => Promise.resolve()),
}));
