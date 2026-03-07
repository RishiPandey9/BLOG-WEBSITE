# DevBlog Platform — Copilot Instructions

## Project Vision
A full-featured **multi-author community publishing platform** — not just a personal blog.
Anyone can write and submit posts; Managers review and publish them.
The goal is to become a scalable, safe, and engaging blogging ecosystem.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth | NextAuth.js v4 (GitHub + Google OAuth) |
| Styling | Tailwind CSS 3.4 (dark mode via `class`) |
| Animation | Framer Motion + Lenis smooth scroll |
| Data | In-memory JSON (dev) → replace with DB in production |
| Notifications | react-hot-toast |

---

## Directory Structure
```
src/
├── app/                     # Next.js App Router pages + API routes
│   ├── page.tsx             # Home (hero, featured, categories, trending)
│   ├── blog/
│   │   ├── page.tsx         # Blog listing (search, filter, grid/list)
│   │   └── [slug]/
│   │       ├── page.tsx     # Post view (parallax, TOC, comments, likes)
│   │       └── edit/        # Edit post (Manager only)
│   ├── create/              # Create new post (any authenticated user → pending)
│   ├── dashboard/           # Author dashboard (stats, drafts, quick edit)
│   ├── u/[username]/        # Public author profile page
│   ├── tag/[tag]/           # Tag page — all posts for a tag
│   ├── admin/               # Admin panel (comment moderation, reports)
│   ├── contact/             # Contact form
│   ├── profile/             # Signed-in user's own profile
│   ├── auth/signin/         # OAuth sign-in
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── comments/        # CRUD + moderate comments
│   │   ├── posts/[id]/like/ # Toggle post like
│   │   └── bookmarks/       # Get / toggle bookmarks
│   ├── sitemap.ts           # Dynamic SEO sitemap
│   └── robots.ts            # robots.txt
├── components/
│   ├── Navbar.tsx           # Global nav (links, theme, user menu, notifications bell)
│   ├── Hero.tsx             # Parallax hero with floating particles
│   ├── PostCard.tsx         # Animated post card with status badge
│   ├── BlogContent.tsx      # Markdown renderer with copy-code buttons
│   ├── BlogPageContent.tsx  # Blog listing client wrapper
│   ├── CommentSection.tsx   # Full comment system (submit, approve, like)
│   ├── TableOfContents.tsx  # Auto-generated TOC from headings
│   ├── ReadingProgressBar.tsx # Fixed top progress bar
│   ├── BookmarkButton.tsx   # Toggle bookmark (localStorage)
│   ├── PostLikeButton.tsx   # Like/unlike a post (API-backed)
│   ├── ShareButtons.tsx     # Share to Twitter, LinkedIn, copy link
│   ├── SkeletonCard.tsx     # Loading skeleton for post cards
│   ├── EditPostButton.tsx   # "Edit Post" link (Manager only)
│   ├── EditPostForm.tsx     # Full inline editor with preview
│   ├── Footer.tsx           # Animated footer
│   ├── Newsletter.tsx       # Newsletter signup section
│   ├── SearchBar.tsx        # Debounced search input
│   ├── CategoryFilter.tsx   # Category pill filter
│   └── motion.tsx           # Framer Motion reusable animation components
├── hooks/
│   └── useRole.ts           # RBAC role hook (isManager, isViewer, etc.)
├── lib/
│   ├── auth.ts              # NextAuth config + MANAGER_EMAILS role resolver
│   ├── data.ts              # Static blog post + category data
│   ├── comments.ts          # In-memory comment store
│   ├── sentiment.ts         # Keyword-based sentiment analysis engine
│   ├── rbac.ts              # Permission helpers
│   └── utils.ts             # cn(), formatDate(), categoryColors, etc.
└── types/
    └── index.ts             # All TypeScript interfaces and types
```

---

## Core Concepts

### 1. RBAC — Role-Based Access Control
Two roles resolved at JWT sign-in time:
- **Manager** — email in `MANAGER_EMAILS` list in `lib/auth.ts`. Can create, edit, delete, publish posts; moderate comments; access admin panel.
- **Viewer** — all authenticated users not in manager list. Can read, comment, like, bookmark, submit posts for review.

### 2. Post Status Workflow
```
[Viewer writes] → DRAFT
      ↓ Submit for review
   PENDING_REVIEW
      ↓ Manager approves         ↓ Manager rejects
   PUBLISHED                  REJECTED  (back to author as draft)
```
Post statuses: `draft` | `pending_review` | `published` | `rejected`

### 3. Multi-Author System
- Every user has a public profile at `/u/[username]`
- Profile shows: avatar, bio, join date, follower count, social links, published posts
- Authors manage their work from `/dashboard`

### 4. Comment System
- All comments start as `pending` and require Manager approval
- Auto sentiment analysis on submit: `positive` | `neutral` | `negative` | `toxic`
- Toxic comments auto-flagged
- Approved comments support: likes (per-user), nested replies (planned), reporting

### 5. Content Features
- Markdown rendering with syntax-highlighted code blocks
- Copy-code button on every code block
- Auto-generated Table of Contents from headings
- Reading progress bar (fixed top)
- Estimated reading time on every post
- Post likes (per-user, toggle)
- Bookmarks (localStorage)
- Share buttons (Twitter, LinkedIn, copy link)

### 6. Discoverability
- `/blog` — search by title/tags/author, filter by category, sort by newest/most viewed/most liked
- `/tag/[tag]` — dedicated page for every tag
- Trending algorithm: `score = views × 0.5 + likes × 2 + comments × 3`
- Tag cloud on home + sidebar

### 7. Author Dashboard (`/dashboard`)
Shows for the signed-in author:
- Stats: total posts, drafts, total views, total likes, total comments
- Post list with quick-edit and status badges
- Draft saving with auto-slug generation

### 8. SEO
- `app/sitemap.ts` — dynamic sitemap including all published post slugs
- `app/robots.ts` — robots.txt
- JSON-LD structured data on every post page (Article schema)
- Dynamic Open Graph metadata per post
- Canonical URLs

### 9. Safety & Moderation
- Report system: users can report posts/comments with a reason
- Sentiment engine auto-flags toxic content
- Manager can ban users (isBanned flag), preventing post/comment/like

### 10. Planned / Future (Phase 3+)
- Follow system (follow authors, following feed)
- Notification system (bell icon, per-user unread count)
- Email digest (weekly newsletter, new post alerts)
- RSS feed per author + site-wide
- AI tag suggestions + auto-summary
- Content recommendation engine ("Continue reading")

---

## Key Patterns & Conventions

### Server vs Client Components
- Pages that only read static data → **Server Components** (no `'use client'`)
- Pages with user interaction, hooks, or browser APIs → **Client Components** (`'use client'`)
- When a Server Component page needs animated children, wrap the animated part in a separate `ClientWrapper.tsx`

### Styling
- Use `cn()` from `lib/utils.ts` for conditional class merging
- Use `categoryColors` map for consistent category badge colors
- Global CSS custom utilities: `btn-primary`, `btn-secondary`, `btn-ghost`, `input-field`, `card`, `gradient-text`, `tag-pill`, `section-title`

### API Routes
- All API routes live under `src/app/api/`
- Use `getServerSession(authOptions)` from `next-auth/next` to get the current user in API routes
- Return `NextResponse.json()` with appropriate HTTP status codes

### Data Layer
- Currently: static `posts[]` array in `lib/data.ts`, comments in module-level array in `lib/comments.ts`
- In production: replace with Prisma + PostgreSQL or Firebase Firestore
- Never import `lib/data.ts` in client components that will be SSR — pass data as props instead

### Animations
- Use `ScrollReveal`, `StaggerWrapper`, `StaggerItem` from `components/motion.tsx` for reusable scroll-triggered animations
- All animations support `useReducedMotion` for accessibility
- Lenis smooth scroll applied globally via `SmoothScroll` in `providers.tsx`
