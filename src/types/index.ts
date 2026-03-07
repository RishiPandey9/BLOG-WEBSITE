// ─── Post Status Workflow ─────────────────────────────────────────────────────
export type PostStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    username: string;   // used for /u/[username] profiles
    email: string;      // used for ownership checks
    avatar: string;
    bio: string;
  };
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  likes: number;
  views: number;
  commentCount: number;
  featured: boolean;
  status: PostStatus;
  isPremium?: boolean; // if true, free users only see a preview
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export type SubscriptionType = 'FREE' | 'PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Subscription {
  userEmail: string;
  subscriptionType: SubscriptionType;
  subscriptionStatus: SubscriptionStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  amountPaid: number;   // in paise (e.g. 49900 = ₹499)
  currency: string;     // e.g. 'INR'
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id?: string;
  userEmail: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaid: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  postCount: number;
}

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'toxic';

export interface CommentSentiment {
  score: number;
  label: SentimentLabel;
  confidence: number;
  flagged: boolean;
  reason?: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: {
    name: string;
    email: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  likedBy: string[];           // emails of users who liked
  status: CommentStatus;       // pending, approved, rejected
  sentiment: CommentSentiment; // auto-analyzed sentiment
  moderatedBy?: string;        // email of moderator who approved/rejected
  moderatedAt?: string;        // when it was moderated
}

export type UserRole = 'manager' | 'viewer';

// ─── Extended User / Author Profile ──────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  role: UserRole;
  joinedAt: string;
  followerCount: number;
  followingCount: number;
  socialLinks: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  isBanned: boolean;
  banReason?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  bio?: string;
  role: UserRole;
  createdAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType = 'like' | 'comment' | 'follow' | 'approved' | 'rejected';

export interface Notification {
  id: string;
  recipientEmail: string;
  type: NotificationType;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

// ─── Follow System ────────────────────────────────────────────────────────────
export interface Follow {
  followerEmail: string;
  followingUsername: string;
  createdAt: string;
}

// ─── Report System ────────────────────────────────────────────────────────────
export type ReportReason =
  | 'spam'
  | 'misinformation'
  | 'harassment'
  | 'inappropriate_content'
  | 'copyright'
  | 'other';

export type ReportTargetType = 'post' | 'comment';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  reporterEmail: string;
  status: ReportStatus;
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

/**
 * RBAC Permissions
 *
 * Manager: Can create, edit, delete posts, manage users, access admin panel
 * Viewer:  Can read posts, comment, like, bookmark, submit for review
 */
export const ROLE_PERMISSIONS = {
  manager: [
    'post:create',
    'post:edit',
    'post:delete',
    'post:publish',
    'user:manage',
    'comment:moderate',
    'admin:access',
    'report:resolve',
    'user:ban',
  ],
  viewer: [
    'post:read',
    'post:submit',
    'comment:create',
    'profile:edit',
    'post:like',
    'post:bookmark',
    'post:report',
    'comment:like',
    'comment:report',
    'author:follow',
  ],
} as const;

export type Permission = (typeof ROLE_PERMISSIONS)[UserRole][number];
