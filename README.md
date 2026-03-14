# DevBlog — Multi-Author Community Publishing Platform

A full-featured multi-author blogging platform built with Next.js 16 (App Router), TypeScript, NextAuth.js, Tailwind CSS, and Firebase. Anyone can write and submit posts; Managers review and publish them.

## Recent Updates (March 2026)

- Added and stabilized comprehensive API test suites for posts, comments, signup, and payment routes
- Added component test suites for Navbar and PostCard interactions
- Added integration user-flow tests with reusable test helpers
- Updated Vitest config to resolve `@` alias correctly in test runtime
- Added Firebase config files (`firebase.json`, `firestore.indexes.json`) for local/deploy consistency
- Verified full quality gate after fixes:
  - `npm run lint` passes
  - `npm test -- --run` passes (`91/91` tests)

## Live Links

- **Production App**: https://blog-website-rishi.vercel.app
- **Blog Page**: https://blog-website-rishi.vercel.app/blog

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase)

---

## Features

### Content & Discovery
- **Blog Listing** - Search by title/tag/author, filter by category, sort, toggle grid/list view
- **Individual Post Pages** - Parallax hero, reading progress bar, auto-generated Table of Contents, estimated reading time
- **Tag Pages** - Dedicated `/tag/[tag]` page for every tag
- **Trending Algorithm** - Score = `views x 0.5 + likes x 2 + comments x 3`
- **Markdown Rendering** - Syntax-highlighted code blocks with copy-code button
- **Related Posts** - Auto-suggested articles in the same category

### Authoring & Workflow
- **Post Status Flow** - `draft` -> `pending_review` -> `published` / `rejected`
- **Create Posts** - Any authenticated user can write and submit for review
- **Edit Posts** - Managers can inline-edit any post with live preview
- **Author Dashboard** - Stats (posts, views, likes, comments), draft management, quick-edit
- **Image Uploads** - Cover image uploader integrated into the post editor

### Authentication & Roles
- **OAuth** - Sign in with GitHub or Google via NextAuth.js v4
- **Email / Password** - Register and sign in with credentials (Firebase Auth)
- **Auto-redirect** - Authenticated users visiting `/auth/signin` are redirected to the homepage
- **RBAC** - Roles resolved at sign-in:
  - **Manager** - publish/reject/edit posts, moderate comments, access admin panel
  - **Viewer** - write posts for review, comment, like, bookmark
  - **Delegated Admin** - time-limited admin access granted by managers
- **Firestore user sync** - Every sign-in (OAuth or credentials) automatically upserts the user into Firestore so they appear in the admin Users panel

### Engagement
- **Comments** - Submit -> pending -> Manager approval; sentiment analysis auto-flags toxic content
- **Post Likes** - Per-user toggle, API-backed
- **Bookmarks** - Saved to `localStorage`
- **Share Buttons** - Twitter, LinkedIn, copy link

### Admin Panel
- Comment moderation (approve / reject / delete)
- Post management (publish / unpublish / delete)
- Comment sentiment stats dashboard
- **User management** - full user list (all sign-in providers), premium status, post counts
- **Delegated admin grants** - assign / revoke temporary admin access with expiry
- **Revenue stats** - subscriber count, total and monthly revenue (Razorpay)

### SEO & Performance
- Dynamic `sitemap.ts` and `robots.ts`
- JSON-LD Article structured data on every post
- Open Graph + Twitter Card metadata per post
- Canonical URLs
- Skeleton loading cards for perceived performance
- Framer Motion animations + Lenis smooth scroll (respects `prefers-reduced-motion`)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework, SSR & API routes |
| TypeScript | Type safety |
| NextAuth.js v4 | GitHub + Google OAuth, JWT sessions |
| Tailwind CSS 3.4 | Utility-first styling, dark mode via `class` |
| Firebase / Firestore | Persistent data store |
| Firebase Admin SDK | Server-side Firestore access |
| Framer Motion | Scroll animations |
| Lenis | Smooth scroll |
| Lucide React | Icon library |
| React Hot Toast | Toast notifications |
| Resend | Transactional email |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Firebase project with Firestore enabled
- GitHub and/or Google OAuth app credentials

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# GitHub OAuth — https://github.com/settings/developers
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Google OAuth — https://console.cloud.google.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Manager emails (comma-separated) — these users get the Manager role
MANAGER_EMAILS=admin@example.com,you@example.com

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Resend (optional — for email notifications)
RESEND_API_KEY=your_resend_api_key

# Razorpay (required for premium payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Cloudinary (required for image uploads via /api/upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Production OAuth Setup (Required)

For production login to work, update OAuth app settings with your deployed domain.

GitHub OAuth app (`https://github.com/settings/developers`):

- Homepage URL: `https://blog-website-rishi.vercel.app`
- Authorization callback URL: `https://blog-website-rishi.vercel.app/api/auth/callback/github`

Google OAuth client (`https://console.cloud.google.com/apis/credentials`):

- Authorized JavaScript origins:
  - `https://blog-website-rishi.vercel.app`
  - `http://localhost:3000`
- Authorized redirect URIs:
  - `https://blog-website-rishi.vercel.app/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google`

Ensure Vercel production env has:

- `NEXTAUTH_URL=https://blog-website-rishi.vercel.app`
- valid `GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Seed Firestore (optional)

```bash
# Populates Firestore with the static sample posts from lib/data.ts
GET /api/seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Home (hero, featured, categories, trending)
│   ├── blog/
│   │   ├── page.tsx              # Blog listing (search, filter, grid/list)
│   │   └── [slug]/
│   │       ├── page.tsx          # Post view (parallax, TOC, comments, likes)
│   │       └── edit/             # Edit post (Manager only)
│   ├── create/                   # Create new post
│   ├── dashboard/                # Author dashboard
│   ├── admin/                    # Admin panel (comments, posts moderation)
│   ├── u/[username]/             # Public author profile
│   ├── tag/[tag]/                # All posts for a tag
│   ├── profile/                  # Signed-in user's own profile
│   ├── bookmarks/                # Saved bookmarks page
│   ├── contact/                  # Contact form
│   ├── auth/signin/              # OAuth sign-in
│   ├── auth/signup/              # Sign-up
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── posts/                # CRUD posts
│   │   │   └── [id]/like/        # Toggle post like
│   │   ├── comments/             # CRUD + moderate comments
│   │   ├── bookmarks/            # Get / toggle bookmarks
│   │   ├── upload/               # Image upload
│   │   └── seed/                 # Seed Firestore
│   ├── sitemap.ts                # Dynamic SEO sitemap
│   └── robots.ts                 # robots.txt
├── components/
│   ├── Navbar.tsx                # Global nav
│   ├── Hero.tsx                  # Parallax hero with floating particles
│   ├── PostCard.tsx              # Animated post card with status badge
│   ├── BlogContent.tsx           # Markdown renderer with copy-code buttons
│   ├── BlogPageContent.tsx       # Blog listing client wrapper
│   ├── CommentSection.tsx        # Full comment system
│   ├── TableOfContents.tsx       # Auto-generated TOC from headings
│   ├── ReadingProgressBar.tsx    # Fixed top progress bar
│   ├── BookmarkButton.tsx        # Toggle bookmark
│   ├── PostLikeButton.tsx        # Like / unlike a post
│   ├── ShareButtons.tsx          # Share to Twitter, LinkedIn, copy link
│   ├── EditPostForm.tsx          # Inline post editor with preview
│   ├── ImageUploader.tsx         # Cover image uploader
│   ├── SkeletonCard.tsx          # Loading skeleton
│   ├── Footer.tsx                # Animated footer
│   ├── Newsletter.tsx            # Newsletter signup
│   ├── SearchBar.tsx             # Debounced search input
│   ├── CategoryFilter.tsx        # Category pill filter
│   └── motion.tsx                # Framer Motion reusable components
├── hooks/
│   └── useRole.ts                # RBAC role hook
├── lib/
│   ├── auth.ts                   # NextAuth config + role resolver
│   ├── data.ts                   # Static seed data (fallback)
│   ├── firestore.ts              # Firestore service layer
│   ├── firebase.ts               # Firebase client SDK init
│   ├── firebase-admin.ts         # Firebase Admin SDK init
│   ├── posts-store.ts            # In-memory runtime post store (fallback)
│   ├── comments.ts               # In-memory comment store (fallback)
│   ├── sentiment.ts              # Keyword-based sentiment analysis
│   ├── rbac.ts                   # Permission helpers
│   ├── resend.ts                 # Email service
│   └── utils.ts                  # cn(), formatDate(), categoryColors, ...
└── types/
    ├── index.ts                  # All TypeScript interfaces and types
    └── next-auth.d.ts            # NextAuth session type augmentation
```

---

## Role-Based Access Control

| Action | Viewer | Manager |
|---|---|---|
| Read published posts | ✅ | ✅ |
| Submit post for review | ✅ | ✅ |
| Publish / reject posts | ❌ | ✅ |
| Edit any post | ❌ | ✅ |
| Comment on posts | ✅ | ✅ |
| Like / bookmark posts | ✅ | ✅ |
| Approve / reject comments | ❌ | ✅ |
| Access admin panel | ❌ | ✅ |

Managers are determined by the `MANAGER_EMAILS` environment variable, resolved at JWT sign-in time.

Delegated Admin is also supported. Managers can grant temporary admin access to any user for a configurable duration from the admin panel.

---

## Post Status Workflow

```
[Viewer writes] → DRAFT
      ↓ Submit for review
   PENDING_REVIEW
      ↓ Manager approves         ↓ Manager rejects
   PUBLISHED                  REJECTED
```

---

## License

MIT

---

## Testing Strategy Package

The repository includes an execution-ready testing planning package:

- `docs/testing/TESTING_IMPLEMENTATION_PLAN.md`
- `docs/testing/EXECUTION_BACKLOG.md`
- `docs/testing/COVERAGE_MATRIX.md`
- `docs/testing/EXECUTION_TRACKER.md`

Use these files together:

1. Read the strategy in `docs/testing/TESTING_IMPLEMENTATION_PLAN.md`.
2. Execute in phase order via `docs/testing/EXECUTION_BACKLOG.md`.
3. Validate route/module/workflow scope from `docs/testing/COVERAGE_MATRIX.md`.
4. Track progress and sign-off evidence in `docs/testing/EXECUTION_TRACKER.md`.

### Run Tests

```bash
# Run all tests once
npm test -- --run

# Run coverage
npm run test:coverage
```

### Firestore Indexes

Firestore composite indexes used by this project are defined in:

- `firestore.indexes.json`

Firebase config references this index file via:

- `firebase.json`
