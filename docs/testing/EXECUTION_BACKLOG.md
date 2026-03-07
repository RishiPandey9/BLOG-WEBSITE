# Testing Execution Backlog

This backlog converts the testing plan into executable work with clear exit criteria.

## Phase 1: Critical Path Protection

## 1. Auth and RBAC Hardening
- Scope:
- `src/lib/auth.ts`
- `src/lib/rbac.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/api/posts/route.ts`
- `src/app/api/posts/[id]/route.ts`
- `src/app/api/comments/route.ts`
- `src/app/api/comments/[id]/route.ts`
- `src/app/api/subscription/route.ts`
- Exit criteria:
- Unauthorized calls consistently rejected.
- Manager-only actions blocked for viewers.
- Session claims are present and consistent after sign-in.

## 2. Post Lifecycle and Visibility
- Scope:
- Create, update, publish/unpublish, delete, and list filters (`mine`, `all`, public)
- Exit criteria:
- Viewer create requests force `pending_review`.
- Published-only public responses are stable.
- Manager full visibility and controls are correct.

## 3. Comment Lifecycle and Moderation
- Scope:
- Comment submission, status assignment, moderation actions
- Exit criteria:
- Invalid comments rejected correctly.
- Sentiment flagging outcomes are reflected in status.
- Moderation transitions are correct and visible as expected.

## 4. Payment Verify Flow
- Scope:
- `src/app/api/payment/create-order/route.ts`
- `src/app/api/payment/verify/route.ts`
- `src/lib/razorpay.ts`
- `src/lib/firestore.ts` subscription/payment history methods
- Exit criteria:
- Invalid signatures are rejected.
- Valid verification activates premium and writes payment history.
- Session entitlement can refresh to premium state.

## 5. Premium Gating
- Scope:
- `src/app/blog/[slug]/page.tsx`
- `src/components/PremiumPaywall.tsx`
- `src/app/pricing/PricingClient.tsx`
- Exit criteria:
- Gated posts preview correctly for non-premium users.
- Premium and manager users receive full content.
- Expired/cancelled states enforce expected behavior.

---

## Phase 2: Resilience and Integration Boundaries

## 1. Fallback-Mode Behavior
- Scope:
- `src/lib/firestore.ts`
- `src/lib/posts-store.ts`
- `src/lib/comments.ts`
- Exit criteria:
- Firestore outages degrade predictably.
- Runtime/static fallback precedence is consistent.

## 2. Webhook Reliability
- Scope:
- `src/app/api/payment/webhook/route.ts`
- Exit criteria:
- Invalid signatures rejected.
- Supported events produce expected state updates.
- Repeated deliveries do not corrupt core state.

## 3. External Dependency Failure Handling
- Scope:
- Upload, email, auth REST, payment create-order/verify
- Exit criteria:
- Error responses are actionable and stable.
- Optional side effects fail safely.

## 4. Aggregation and Admin Metrics Integrity
- Scope:
- Comment stats and premium/revenue stats paths
- Exit criteria:
- Aggregated values match source records under typical and degraded conditions.

## 5. Upload Boundary Enforcement
- Scope:
- `src/app/api/upload/route.ts`
- `src/components/ImageUploader.tsx`
- Exit criteria:
- MIME/size limits enforced.
- Auth required.
- Cloudinary unavailability handled clearly.

---

## Phase 3: Concurrency, Scale, and Long-Tail Risks

## 1. Parallel Interaction Consistency
- Scope:
- Post likes, comment likes, bookmarks
- Exit criteria:
- No persistent count drift or contradictory state under parallel operations.

## 2. Verify-vs-Webhook Race Handling
- Scope:
- Subscription and payment history updates
- Exit criteria:
- Final entitlement and records remain coherent under concurrent updates.

## 3. Read/Write Load Scenarios
- Scope:
- Listing reads, comment writes/moderation, admin reads
- Exit criteria:
- Stable correctness and acceptable response behavior at target load.

## 4. Time and Locale Boundaries
- Scope:
- Subscription expiry comparisons and date presentation paths
- Exit criteria:
- No entitlement errors at boundary times.

## 5. Discoverability Drift
- Scope:
- `src/app/sitemap.ts`, `src/app/tag/[tag]/page.tsx`, `src/app/u/[username]/page.tsx`, static-data pages
- Exit criteria:
- Published content discoverability is consistent with live source of truth.

---

## Governance and Readiness Gates

## Severity Gate
- No open high-severity defects for the phase scope.

## Regression Gate
- Previously stabilized critical-path scenarios remain passing.

## Coverage Gate
- Phase must cover intended domains, not just route count.

## Evidence Requirement
- Each completed item includes:
- Scenario list covered
- Risks validated
- Observed behaviors and acceptance outcome
- Open defects or residual risks
