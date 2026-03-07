# Coverage Matrix

## API Route Coverage

| Route | Domain | Risk | Must Validate |
|---|---|---|---|
| `POST /api/auth/signup` | Identity | High | Validation, duplicate handling, weak password handling, Firestore profile optionality, welcome-email side effect tolerance |
| `GET/POST /api/auth/[...nextauth]` | Identity/session | High | Provider sign-in continuity, callback claim propagation |
| `GET /api/posts` | Content visibility | High | Public published-only filtering, `mine=true`, `all=true` manager enforcement, fallback merge precedence |
| `POST /api/posts` | Authoring | High | Required fields, role-conditioned status assignment, slug/readingTime derivation, fallback store behavior |
| `DELETE /api/posts?id=` | Governance | High | Manager-only deletion, missing id handling |
| `PATCH /api/posts/[id]` | Workflow state | High | Manager-only restrictions on `status` and `isPremium`, publish timestamp behavior, post-not-found handling |
| `DELETE /api/posts/[id]` | Governance | High | Manager-only deletion and fallback behavior |
| `POST /api/posts/[id]/like` | Engagement | Medium | Auth requirement, toggle idempotency, count consistency |
| `GET /api/posts/[id]/like` | Engagement | Medium | Like status lookup, anonymous behavior |
| `GET /api/comments` | Moderation/visibility | High | post-scoped filtering, manager-only all/pending/stats access, owner visibility of pending comments |
| `POST /api/comments` | Moderation pipeline | High | Input validation, max length, sentiment-derived status, manager auto-approve |
| `PATCH /api/comments/[id]` | Moderation/engagement | High | Action validation, manager-only moderation, like behavior consistency |
| `DELETE /api/comments/[id]` | Moderation | High | Manager-only delete behavior |
| `GET /api/bookmarks` | Personalization | Medium | Auth/no-auth behavior, Firestore retrieval |
| `POST /api/bookmarks` | Personalization | Medium | Auth requirement, body validation, toggle behavior |
| `POST /api/payment/create-order` | Billing | Critical | Auth requirement, manager exclusion, provider failure handling |
| `POST /api/payment/verify` | Billing/security | Critical | Required payment fields, signature verification, subscription write, payment history write, email side effect tolerance |
| `POST /api/payment/webhook` | Billing async | Critical | Raw-body signature verification, event parsing, captured/failed paths, replay risk handling |
| `GET /api/subscription` | Entitlement | High | Auth requirement, subscription + history retrieval |
| `POST /api/subscription` | Admin revenue | High | Manager-only stats access, aggregate correctness |
| `DELETE /api/subscription` | Entitlement | High | Auth requirement, cancellation semantics |
| `POST /api/upload` | Media/security | High | Auth requirement, MIME boundary, size boundary, provider outage behavior |
| `GET/POST /api/seed` | Setup/governance | Medium | Manager guard in POST, production GET restriction |

## Service and Domain Logic Coverage

| Module | Domain | Risk | Must Validate |
|---|---|---|---|
| `src/lib/auth.ts` | Auth/session | Critical | Role resolution, subscription refresh timing, manager premium override, credential sign-in failure behavior |
| `src/lib/rbac.ts` | Authorization | High | Permission mapping correctness and role checks |
| `src/lib/firestore.ts` | Persistence | Critical | CRUD correctness, fallback logic, counter updates, subscription/payment writes, aggregate calculations |
| `src/lib/razorpay.ts` | Billing security | Critical | Signature verification correctness and failure behavior |
| `src/lib/sentiment.ts` | Moderation classifier | High | Toxic pattern detection, negation/intensifier behavior, boundary score labeling |
| `src/lib/cloudinary.ts` | Media integration | High | Config detection and upload response integrity |
| `src/lib/resend.ts` | Notifications | Medium | Optional side effects and no-fail core transaction behavior |
| `src/lib/posts-store.ts` | Fallback state | High | Upsert/update/delete correctness under fallback mode |
| `src/lib/comments.ts` | Fallback moderation | High | Status transitions and like toggle correctness |

## End-to-End Workflow Coverage

| Workflow | Risk | Must Validate |
|---|---|---|
| Signup -> Signin -> Session claims | High | Role and baseline entitlement claims populated correctly |
| Viewer creates post -> pending review -> manager publish | High | State transitions and public visibility correctness |
| Viewer submits comment -> moderation -> publish/reject | High | Moderation visibility and status correctness |
| Premium purchase (verify path) -> entitlement unlock | Critical | Signature gate, subscription activation, session refresh behavior |
| Premium purchase (webhook path) -> entitlement unlock | Critical | Async processing correctness and duplicate-event tolerance |
| Premium cancellation -> residual access window | High | Cancelled state semantics and end-date handling |
| Upload image in authoring flow | High | Security constraints, error handling, URL propagation |
| Admin stats/revenue views | High | Aggregation and access control correctness |
