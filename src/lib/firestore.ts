/**
 * Firestore data service
 * All reads/writes to Firestore go through here.
 * Falls back gracefully when Firebase Admin is not yet configured.
 */

import { getAdminDb } from './firebase-admin';
import type { BlogPost, Comment, CommentStatus, Subscription, PaymentRecord, AdminDelegation } from '@/types';
import { analyzeSentiment } from './sentiment';
import { posts as staticPosts, categories as staticCategories } from './data';
import { getRuntimePosts } from './posts-store';
import { PLAN_DURATION_DAYS } from './razorpay';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helper â€” check if Firestore is available
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function isDbReady(): boolean {
  return getAdminDb() !== null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Seeder â€” populate Firestore with static data
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function seedFirestore(): Promise<{ seeded: boolean; message: string }> {
  if (!isDbReady()) return { seeded: false, message: 'Firebase not configured' };

  const col = getAdminDb()!.collection('posts');
  const snap = await col.limit(1).get();
  if (!snap.empty) return { seeded: false, message: 'Already seeded' };

  const batch = getAdminDb()!.batch();
  for (const post of staticPosts) {
    batch.set(col.doc(post.id), { ...post });
  }
  for (const cat of staticCategories) {
    batch.set(getAdminDb()!.collection('categories').doc(cat.id), { ...cat });
  }
  await batch.commit();
  return { seeded: true, message: `Seeded ${staticPosts.length} posts and ${staticCategories.length} categories` };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POSTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getPostsFromFirestore(): Promise<BlogPost[]> {
  if (!isDbReady()) return staticPosts;
  try {
    const snap = await getAdminDb()!.collection('posts').orderBy('publishedAt', 'desc').get();
    if (snap.empty) return staticPosts;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
  } catch {
    return staticPosts;
  }
}

export async function getPostBySlugFromFirestore(slug: string): Promise<BlogPost | null> {
  if (!isDbReady()) {
    // No Firestore — check runtime store then static fallback
    return getRuntimePosts().find((p) => p.slug === slug) ?? staticPosts.find((p) => p.slug === slug) ?? null;
  }
  try {
    const snap = await getAdminDb()!.collection('posts').where('slug', '==', slug).limit(1).get();
    if (!snap.empty) {
      // Firestore is authoritative — always return its version (has up-to-date isPremium, status, etc.)
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() } as BlogPost;
    }
    // Not in Firestore yet — check runtime store (newly created posts) and static data
    return getRuntimePosts().find((p) => p.slug === slug) ?? staticPosts.find((p) => p.slug === slug) ?? null;
  } catch {
    // Firestore error — fall back to runtime then static
    return getRuntimePosts().find((p) => p.slug === slug) ?? staticPosts.find((p) => p.slug === slug) ?? null;
  }
}

export async function createPostInFirestore(post: Omit<BlogPost, 'id'>): Promise<string> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  const ref = await getAdminDb()!.collection('posts').add(post);
  return ref.id;
}

export async function updatePostInFirestore(id: string, data: Partial<BlogPost>): Promise<void> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  await getAdminDb()!.collection('posts').doc(id).update({ ...data, updatedAt: new Date().toISOString() });
}

export async function deletePostFromFirestore(id: string): Promise<void> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  await getAdminDb()!.collection('posts').doc(id).delete();
}

export async function incrementPostViews(id: string): Promise<void> {
  if (!isDbReady()) return;
  try {
    await getAdminDb()!.collection('posts').doc(id).update({
      views: require('firebase-admin').firestore.FieldValue.increment(1),
    });
  } catch { /* silent */ }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// COMMENTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getCommentsByPostIdFromFirestore(postId: string): Promise<Comment[]> {
  if (!isDbReady()) return [];
  try {
    const snap = await getAdminDb()!.collection('comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
  } catch {
    return [];
  }
}

export async function getAllCommentsFromFirestore(): Promise<Comment[]> {
  if (!isDbReady()) return [];
  try {
    const snap = await getAdminDb()!.collection('comments').orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
  } catch {
    return [];
  }
}

export async function getPendingCommentsFromFirestore(postId?: string): Promise<Comment[]> {
  if (!isDbReady()) return [];
  try {
    let query = getAdminDb()!.collection('comments').where('status', '==', 'pending');
    if (postId) query = query.where('postId', '==', postId) as typeof query;
    const snap = await query.orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
  } catch {
    return [];
  }
}

export async function addCommentToFirestore(
  comment: Omit<Comment, 'id' | 'sentiment'>
): Promise<Comment> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  const sentiment = analyzeSentiment(comment.content);
  const newComment: Omit<Comment, 'id'> = {
    ...comment,
    sentiment,
    status: sentiment.flagged ? ('rejected' as CommentStatus) : ('pending' as CommentStatus),
  };
  const ref = await getAdminDb()!.collection('comments').add(newComment);
  return { id: ref.id, ...newComment };
}

export async function updateCommentStatusInFirestore(
  id: string,
  status: CommentStatus
): Promise<void> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  await getAdminDb()!.collection('comments').doc(id).update({ status });
}

export async function deleteCommentFromFirestore(id: string): Promise<void> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  await getAdminDb()!.collection('comments').doc(id).delete();
}

export async function toggleCommentLikeInFirestore(
  commentId: string,
  userEmail: string
): Promise<{ liked: boolean; likes: number }> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  const ref = getAdminDb()!.collection('comments').doc(commentId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Comment not found');
  const data = doc.data()!;
  const likedBy: string[] = data.likedBy ?? [];
  const alreadyLiked = likedBy.includes(userEmail);
  const updatedLikedBy = alreadyLiked
    ? likedBy.filter((e) => e !== userEmail)
    : [...likedBy, userEmail];
  await ref.update({ likedBy: updatedLikedBy, likes: updatedLikedBy.length });
  return { liked: !alreadyLiked, likes: updatedLikedBy.length };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LIKES (posts)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function togglePostLikeInFirestore(
  postId: string,
  userId: string
): Promise<{ liked: boolean; likes: number }> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  const likeRef = getAdminDb()!.collection('postLikes').doc(`${postId}_${userId}`);
  const postRef = getAdminDb()!.collection('posts').doc(postId);
  const likeDoc = await likeRef.get();
  const postDoc = await postRef.get();
  const currentLikes: number = postDoc.exists ? (postDoc.data()!.likes ?? 0) : 0;

  if (likeDoc.exists) {
    await likeRef.delete();
    await postRef.update({ likes: Math.max(0, currentLikes - 1) });
    return { liked: false, likes: Math.max(0, currentLikes - 1) };
  } else {
    await likeRef.set({ postId, userId, createdAt: new Date().toISOString() });
    await postRef.update({ likes: currentLikes + 1 });
    return { liked: true, likes: currentLikes + 1 };
  }
}

export async function getPostLikeStatus(
  postId: string,
  userId: string
): Promise<{ liked: boolean; likes: number }> {
  if (!isDbReady()) {
    const post = staticPosts.find((p) => p.id === postId);
    return { liked: false, likes: post?.likes ?? 0 };
  }
  try {
    const [likeDoc, postDoc] = await Promise.all([
      getAdminDb()!.collection('postLikes').doc(`${postId}_${userId}`).get(),
      getAdminDb()!.collection('posts').doc(postId).get(),
    ]);
    return {
      liked: likeDoc.exists,
      likes: postDoc.exists ? (postDoc.data()!.likes ?? 0) : 0,
    };
  } catch {
    return { liked: false, likes: 0 };
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BOOKMARKS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getBookmarksFromFirestore(userId: string): Promise<BlogPost[]> {
  if (!isDbReady()) return [];
  try {
    const snap = await getAdminDb()!.collection('bookmarks')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    const postIds = snap.docs.map((d) => d.data().postId as string);
    if (postIds.length === 0) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < postIds.length; i += 10) chunks.push(postIds.slice(i, i + 10));
    const posts: BlogPost[] = [];
    for (const chunk of chunks) {
      const pSnap = await getAdminDb()!.collection('posts').where('__name__', 'in', chunk).get();
      pSnap.docs.forEach((d) => posts.push({ id: d.id, ...d.data() } as BlogPost));
    }
    return posts;
  } catch {
    return [];
  }
}

export async function toggleBookmarkInFirestore(
  postId: string,
  userId: string
): Promise<{ bookmarked: boolean }> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  const ref = getAdminDb()!.collection('bookmarks').doc(`${postId}_${userId}`);
  const doc = await ref.get();
  if (doc.exists) {
    await ref.delete();
    return { bookmarked: false };
  } else {
    await ref.set({ postId, userId, createdAt: new Date().toISOString() });
    return { bookmarked: true };
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// REPORTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function createReport(report: {
  targetId: string;
  targetType: 'post' | 'comment';
  reason: string;
  reportedBy: string;
}): Promise<void> {
  if (!isDbReady()) return;
  await getAdminDb()!.collection('reports').add({ ...report, createdAt: new Date().toISOString(), resolved: false });
}

// ─────────────────────────────────────────────────────────
// SUBSCRIPTIONS
// Collection: subscriptions/{userEmail}
// ─────────────────────────────────────────────────────────

export async function getSubscriptionFromFirestore(userEmail: string): Promise<Subscription | null> {
  if (!isDbReady() || !userEmail) return null;
  try {
    const doc = await getAdminDb()!.collection('subscriptions').doc(userEmail.toLowerCase()).get();
    if (!doc.exists) return null;
    return doc.data() as Subscription;
  } catch {
    return null;
  }
}

export async function createOrUpdateSubscription(
  userEmail: string,
  data: Partial<Subscription>
): Promise<void> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  const now = new Date().toISOString();
  const ref = getAdminDb()!.collection('subscriptions').doc(userEmail.toLowerCase());
  const existing = await ref.get();

  if (existing.exists) {
    await ref.update({ ...data, updatedAt: now });
  } else {
    const startDate = now;
    const endDate   = new Date(Date.now() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await ref.set({
      userEmail: userEmail.toLowerCase(),
      subscriptionType:   'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate: startDate,
      subscriptionEndDate:   endDate,
      amountPaid: 0,
      currency: 'INR',
      createdAt: now,
      updatedAt: now,
      ...data,
    });
  }
}

export async function cancelSubscriptionInFirestore(userEmail: string): Promise<void> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  const now = new Date().toISOString();
  await getAdminDb()!
    .collection('subscriptions')
    .doc(userEmail.toLowerCase())
    .update({ subscriptionStatus: 'CANCELLED', updatedAt: now });
}

export async function addPaymentRecord(record: Omit<PaymentRecord, 'id'>): Promise<void> {
  if (!isDbReady()) return;
  await getAdminDb()!.collection('paymentHistory').add({ ...record });
}

export async function getPaymentHistoryForUser(userEmail: string): Promise<PaymentRecord[]> {
  if (!isDbReady() || !userEmail) return [];
  try {
    const snap = await getAdminDb()!
      .collection('paymentHistory')
      .where('userEmail', '==', userEmail.toLowerCase())
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// ADMIN — Subscription stats
// ─────────────────────────────────────────────────────────

export async function getPremiumSubscriberCount(): Promise<number> {
  if (!isDbReady()) return 0;
  try {
    const snap = await getAdminDb()!
      .collection('subscriptions')
      .where('subscriptionStatus', '==', 'ACTIVE')
      .get();
    return snap.size;
  } catch {
    return 0;
  }
}

export interface RevenueStats {
  totalRevenuePaise: number;
  totalPayments: number;
  currentMonthRevenuePaise: number;
}

export async function getRevenueStats(): Promise<RevenueStats> {
  if (!isDbReady()) return { totalRevenuePaise: 0, totalPayments: 0, currentMonthRevenuePaise: 0 };
  try {
    const snap = await getAdminDb()!
      .collection('paymentHistory')
      .where('status', '==', 'SUCCESS')
      .get();

    const now   = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalRevenuePaise         = 0;
    let currentMonthRevenuePaise  = 0;

    snap.docs.forEach((d) => {
      const data = d.data() as PaymentRecord;
      totalRevenuePaise += data.amountPaid ?? 0;
      if (data.createdAt?.startsWith(month)) {
        currentMonthRevenuePaise += data.amountPaid ?? 0;
      }
    });

    return {
      totalRevenuePaise,
      totalPayments: snap.size,
      currentMonthRevenuePaise,
    };
  } catch {
    return { totalRevenuePaise: 0, totalPayments: 0, currentMonthRevenuePaise: 0 };
  }
}

// ─────────────────────────────────────────────────────────
// ADMIN DELEGATIONS
// Collection: adminDelegations/{id}
// ─────────────────────────────────────────────────────────

/** Returns the first active (non-revoked, non-expired) delegation for a user email. */
export async function getActiveDelegationByEmail(userEmail: string): Promise<AdminDelegation | null> {
  if (!isDbReady() || !userEmail) return null;
  try {
    const now = new Date().toISOString();
    const snap = await getAdminDb()!
      .collection('adminDelegations')
      .where('userEmail', '==', userEmail.toLowerCase())
      .where('isRevoked', '==', false)
      .get();
    // Filter in-memory for expiresAt > now (Firestore doesn't do string range + equality in one query without a composite index)
    const active = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as AdminDelegation))
      .find((d) => d.expiresAt > now);
    return active ?? null;
  } catch {
    return null;
  }
}

/** Returns all delegations (active, expired, revoked) ordered by createdAt desc. */
export async function getAllDelegationsFromFirestore(): Promise<AdminDelegation[]> {
  if (!isDbReady()) return [];
  try {
    const snap = await getAdminDb()!
      .collection('adminDelegations')
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminDelegation));
  } catch {
    return [];
  }
}

/** Creates a new admin delegation. Returns the new document id. */
export async function createDelegationInFirestore(data: Omit<AdminDelegation, 'id'>): Promise<string> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  const ref = await getAdminDb()!.collection('adminDelegations').add({ ...data });
  return ref.id;
}

/** Marks a delegation as revoked. */
export async function revokeDelegationInFirestore(id: string): Promise<void> {
  if (!isDbReady()) throw new Error('Firebase not configured');
  await getAdminDb()!.collection('adminDelegations').doc(id).update({ isRevoked: true });
}

// ─────────────────────────────────────────────────────────
// USERS (for admin panel)
// Collection: users/{id}  (created by NextAuth FirestoreAdapter)
// ─────────────────────────────────────────────────────────

export interface UserListEntry {
  email: string;
  name: string;
  image?: string;
  createdAt?: string;
  postCount: number;
  isPremium: boolean;
  subscriptionEndDate?: string;
}

/**
 * Returns users from the NextAuth `users` collection joined with subscription status.
 * Falls back to an empty array when Firestore is not configured.
 */
export async function getAllUsersForAdmin(): Promise<UserListEntry[]> {
  if (!isDbReady()) return [];
  try {
    const [usersSnap, subsSnap] = await Promise.all([
      getAdminDb()!.collection('users').orderBy('createdAt', 'desc').limit(500).get(),
      getAdminDb()!.collection('subscriptions').where('subscriptionStatus', '==', 'ACTIVE').get(),
    ]);

    const now = new Date().toISOString();
    const premiumMap = new Map<string, string>(); // email → subscriptionEndDate
    subsSnap.docs.forEach((d) => {
      const data = d.data() as Subscription;
      if (data.subscriptionEndDate > now) {
        premiumMap.set((data.userEmail ?? d.id).toLowerCase(), data.subscriptionEndDate);
      }
    });

    return usersSnap.docs
      .map((d) => {
        const data = d.data();
        const email = (data.email ?? '').toLowerCase();
        if (!email) return null;
        const entry: UserListEntry = {
          email,
          name: data.name ?? data.displayName ?? email,
          image: data.image ?? data.photoUrl ?? '',
          createdAt: data.createdAt ?? '',
          postCount: 0, // filled in by API route
          isPremium: premiumMap.has(email),
          subscriptionEndDate: premiumMap.get(email),
        };
        return entry;
      })
      .filter((u): u is UserListEntry => u !== null);
  } catch {
    return [];
  }
}
