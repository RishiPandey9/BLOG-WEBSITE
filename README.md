# DevBlog

A multi-author community publishing platform built for SaaS-style operation.

Users can sign in, write posts, submit for moderation, interact through comments/likes/bookmarks, and upgrade to premium content access. Managers/admins moderate content and control publication workflows.

## Current Project State

This repository is currently aligned to a hardened production baseline:

- Next.js 16 App Router with React 19.
- TypeScript and Tailwind CSS.
- Firebase Firestore + Firebase Admin for server data.
- NextAuth-based authentication with OAuth and credentials support.
- Role-aware content workflow (viewer, delegated admin, manager).
- Premium subscription flow using Razorpay + webhook verification.
- Production API behavior hardened to avoid silent in-memory write fallbacks.
- Responsive behavior improved and documented with a dedicated QA checklist.
- Local validation completed for the current codebase:
  - lint passes
  - production build passes
  - npm audit --omit=dev reports 0 vulnerabilities

## Live Links

- Production App: https://blog-website-rishi.vercel.app
- Blog: https://blog-website-rishi.vercel.app/blog

## Core Features

### Publishing and Discovery

- Blog listing with search, category filtering, and sorting.
- Dynamic post pages with metadata, JSON-LD, reading progress, and related posts.
- Tag pages and author profile pages.
- Trending and engagement metrics in dashboard/admin surfaces.

### Authoring Workflow

- Post lifecycle:
  - draft
  - pending_review
  - published
  - rejected
- Any authenticated user can submit content.
- Manager/admin roles can approve, reject, edit, publish/unpublish, and delete.

### Auth and Access Control

- OAuth providers (GitHub and Google).
- Credentials sign-in path via Firebase Auth REST.
- Role resolution using manager email allowlist and delegated admin grants.
- JWT session strategy.

### Engagement

- Comment submission and moderation flow.
- Sentiment analysis for comments.
- Post likes and bookmarks.
- Share actions and reading UX components.

### Premium SaaS Layer

- Razorpay one-time order creation.
- Server-side signature verification.
- Webhook signature verification and subscription activation.
- Payment history and subscription state in Firestore.
- Premium paywall component and premium-aware session flags.

### Admin Surfaces

- Comment moderation queue.
- Post moderation and publication controls.
- User list with premium/delegation indicators.
- Delegated admin grant/revoke flows.
- Revenue and subscriber metrics.

## Tech Stack

- Framework: Next.js 16 (App Router)
- UI Runtime: React 19
- Language: TypeScript
- Styling: Tailwind CSS 3
- Auth: NextAuth v4
- Data: Firebase Firestore + Firebase Admin SDK
- Payments: Razorpay
- Email: Resend
- Animation: Framer Motion + Lenis
- Testing Tooling: Vitest + Testing Library helpers
- Linting: ESLint CLI

## Project Structure

src/
- app/
  - API routes under app/api
  - page routes, auth, admin, dashboard, blog, pricing, etc.
- components/
  - page and UI components
- hooks/
- lib/
  - auth, firestore, cloudinary, payments, sentiment, utilities
- types/

docs/testing/
- TESTING_IMPLEMENTATION_PLAN.md
- EXECUTION_BACKLOG.md
- COVERAGE_MATRIX.md
- EXECUTION_TRACKER.md
- RESPONSIVE_QA_CHECKLIST.md

## Prerequisites

- Node.js 20.9.0+
- npm
- Firebase project with Firestore enabled
- OAuth credentials for GitHub and Google
- Razorpay account for payments
- Optional: Resend account for transactional emails
- Optional: Cloudinary account for image uploads

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create .env.local in project root:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

NEXT_PUBLIC_BASE_URL=http://localhost:3000

GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

MANAGER_EMAILS=admin@example.com,you@example.com

FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=notifications@yourdomain.com

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

3. Run development server:

```bash
npm run dev
```

4. Build and run production locally:

```bash
npm run build
npm start
```

## Scripts

- npm run dev
  - starts local development server
- npm run build
  - builds production app
- npm start
  - starts production server from build output
- npm run lint
  - runs ESLint over JS/TS/TSX files

## Production Notes

- The app enforces safer production behavior for content APIs:
  - if persistent datastore is unavailable, production write paths return errors instead of silently writing to in-memory stores.
- Seed endpoint:
  - GET /api/seed is blocked in production.
  - use authenticated manager POST flow where applicable.
- Payment security:
  - webhook verification requires RAZORPAY_WEBHOOK_SECRET.
  - payment verification is performed server-side.

## Responsive QA

Use docs/testing/RESPONSIVE_QA_CHECKLIST.md before release to verify behavior across:

- Mobile small and standard
- Tablet
- Laptop
- Desktop

Checklist includes global checks, route-by-route checks, and execution steps.

## Testing Planning Docs

The repository includes a test planning package in docs/testing:

- TESTING_IMPLEMENTATION_PLAN.md
- EXECUTION_BACKLOG.md
- COVERAGE_MATRIX.md
- EXECUTION_TRACKER.md

Use these for rollout planning and evidence tracking.

## License

MIT
