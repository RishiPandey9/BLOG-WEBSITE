# Testing Implementation Plan

## Scope and Intent
This plan defines what must be tested, why it must be tested, and how to prioritize coverage based on business risk in this repository.

Constraints applied:
- No test code included in this document.
- No test execution included in this document.
- No specific frameworks or libraries prescribed.

## 1. System Understanding

### Application Purpose
DevBlog is a multi-author publishing platform with role-based controls, moderation workflows, premium content gating, and payment-backed subscription access.

### Major Components
- App Router pages and API routes: `src/app/**`
- Domain/service logic: `src/lib/**`
- Shared types and contracts: `src/types/**`
- UI workflow components: `src/components/**`
- Role utilities: `src/hooks/useRole.ts`, `src/lib/rbac.ts`

### Data and State Planes
- Primary persisted store: Firestore via Admin SDK (`src/lib/firebase-admin.ts`, `src/lib/firestore.ts`)
- Auth/session: NextAuth + Firebase Auth REST (`src/lib/auth.ts`)
- Runtime fallback stores: `src/lib/posts-store.ts`, `src/lib/comments.ts`
- Static seed/fallback data: `src/lib/data.ts`
- Local browser state: bookmark localStorage (`src/components/BookmarkButton.tsx`, `src/app/bookmarks/page.tsx`)

### External Integrations
- Firebase Auth + Firestore
- Razorpay (order creation, signature verification, webhooks)
- Cloudinary (image uploads)
- Resend (email notifications)

### Critical Business Paths
- Role and permission enforcement (manager vs viewer)
- Post lifecycle: `draft -> pending_review -> published/rejected`
- Comment moderation with sentiment classification
- Premium entitlement and paywall enforcement
- Payment verification and subscription activation

## 2. Risk-Based Priorities

### Priority 0: Security and Revenue
- Authorization boundaries on manager-only endpoints
- Payment signature and webhook verification paths
- Premium access entitlement correctness

### Priority 1: Workflow Integrity
- Post/comment lifecycle transitions
- Visibility rules for public, author, and manager users
- Data-source fallback behavior under dependency loss

### Priority 2: Consistency and Scale
- Counter consistency (likes/comments)
- Aggregation correctness (admin stats/revenue)
- Concurrent event handling (verify vs webhook)

## 3. Core Functional Domains to Validate

### Authentication and Session Claims
- Sign-up and credential sign-in behavior
- OAuth sign-in continuity
- Session claim enrichment (`role`, `isPremium`, `subscriptionStatus`, `subscriptionEndDate`)

### Authorization and RBAC
- Manager-only API protections
- Viewer-only and authenticated-user route behavior
- UI gating consistency with server-side enforcement

### Post Management
- Create post status derivation by role
- Post update restrictions (status/premium manager-only)
- Publish/unpublish/delete behavior and visibility impact

### Comments and Moderation
- Comment submission validation and sentiment processing
- Moderation actions (approve/reject/delete)
- Visibility filtering by user role and ownership

### Payment and Subscription
- Order creation preconditions
- Verify path signature validation and side effects
- Webhook path event handling and idempotency risk
- Subscription cancellation and billing history retrieval

### Upload and Media
- File type/size validation
- Auth requirement and Cloudinary outage behavior

### SEO and Discoverability Outputs
- Sitemap and robots behavior
- Published-only assumptions and source-of-truth drift

## 4. Edge and Boundary Analysis
- Invalid/missing body fields on all write APIs
- Comment length boundaries (empty, max, overflow)
- Upload size and MIME boundaries
- Empty store and mixed-source fallback scenarios
- Time boundaries around subscription expiry
- Encoding/slug/tag handling with special characters

## 5. Async vs Sync Behavior
- Async: Razorpay webhook pipeline, session refresh updates, email side effects
- Sync: most CRUD endpoints and upload processing

Validation focus:
- Ordering and completion guarantees
- Duplicate/replayed event tolerance
- Partial failure behavior and invariants

## 6. Concurrency and Race Risks
- Parallel post/comment like toggles
- Concurrent verify + webhook updates for one payment
- Concurrent moderation and deletion actions
- Fallback-store writes under transient Firestore outage

## 7. Data Integrity and Consistency
- Subscription/payment record coherence
- Counter and aggregate correctness under parallel writes
- Store precedence correctness (Firestore/runtime/static/local)
- No unintended data exposure from stale static sources

## 8. Failure and Resilience Scenarios
- Firebase unavailable or partially available
- Razorpay API timeout/error and webhook signature failures
- Cloudinary unavailable
- Resend unavailable
- Missing or placeholder environment configuration

Expected behavior:
- Correct status code semantics
- Graceful degradation where designed
- No unauthorized access or entitlement corruption

## 9. Performance, Load, and Scalability Planning
- High-read routes (`/api/posts`, post pages)
- Write-heavy interactions (likes/comments)
- Admin aggregates under large collections
- Webhook burst handling
- Upload throughput and large asset pressure

## 10. Security-Relevant Areas
- Auth flow correctness and unauthorized rejection
- Server-side authorization hard enforcement
- Input validation and malformed payload handling
- Signature verification strictness and replay defenses
- Sensitive data handling in responses/logging

## 11. Integration and System Validation
- Auth-provider and session callback interactions
- Firestore reads/writes and fallback transitions
- Razorpay verify/webhook boundaries
- Cloudinary and Resend side effect behavior

## 12. Validation Signals
- API status codes and response contracts
- Firestore document transitions by collection
- Session claim transitions after payment/cancellation
- UI-visible state and status badges
- Error logs for expected degraded modes

## 13. Coverage Strategy
- Highest depth: auth/RBAC, payment/subscription, post/comment lifecycle
- Broad contract checks: all public APIs and manager-only APIs
- Integration checks: each external boundary + degraded mode
- Workflow checks: author, reader, manager, subscriber end-to-end journeys
