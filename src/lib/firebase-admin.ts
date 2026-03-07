/**
 * Firebase Admin SDK — server-only
 * Used in API routes and NextAuth callbacks.
 * NEVER import this in client components.
 *
 * Initialization is deferred until the first call to getAdminApp()
 * so that the build can succeed without real credentials in .env.local.
 */

import admin from 'firebase-admin';

let initialized = false;

function getAdminApp(): admin.app.App | null {
  if (initialized) {
    return admin.apps.length ? admin.app() : null;
  }
  initialized = true;

  if (admin.apps.length) return admin.app();

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (
    !process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.FIREBASE_ADMIN_PROJECT_ID === 'your_project_id' ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    !privateKey ||
    privateKey.includes('YOUR_KEY_HERE')
  ) {
    console.warn(
      '[Firebase Admin] Missing or placeholder credentials — Firestore operations will fall back to static data until credentials are set in .env.local'
    );
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (err) {
    console.error('[Firebase Admin] Init error:', err);
    return null;
  }
}

export function getAdminDb(): admin.firestore.Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return admin.firestore(app);
  } catch {
    return null;
  }
}

export function getAdminAuth(): admin.auth.Auth | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return admin.auth(app);
  } catch {
    return null;
  }
}

export function getAdminStorage(): admin.storage.Storage | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return admin.storage(app);
  } catch {
    return null;
  }
}

export default admin;

