# 🔍 Streamly Netflix Clone — Full Codebase Audit Report
### 3-Pass Security, Bug, Workflow & Feature Analysis

---

## 🚨 CRITICAL SECURITY ISSUES

### SEC-1 — JWT Access Token Stored in `localStorage` (XSS-Vulnerable)
**File**: [`client/src/lib/api.ts:9-16`](file:///d:/AiLabs/git/netflix-clone/client/src/lib/api.ts#L9-L16)
```ts
// VULNERABLE — XSS can steal this token
localStorage.setItem('streamly_token', token);
localStorage.getItem('streamly_token');
```
**Risk**: JWT stored in `localStorage` is readable by any JavaScript, including injected XSS scripts. An attacker can steal the token and hijack sessions.
**Fix**: Move the access token to an `httpOnly` cookie (the server already sets them). The client should **only** send `credentials: 'include'` and remove all `localStorage` token storage. The refresh token is already properly stored as httpOnly cookie.

---

### SEC-2 — Admin Credentials Stored in Plain `localStorage`
**File**: [`client/src/lib/adminAuth.ts:41-50, 170-171`](file:///d:/AiLabs/git/netflix-clone/client/src/lib/adminAuth.ts#L39-L51)
```ts
localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify({
  password: 'AdminPassword123', // stored in plaintext in localStorage!
}));
```
**Risk**: Admin email + password stored as **plaintext JSON** in `localStorage`. Anyone with browser access (or XSS) can read the admin credentials. The `updateAdminPassword` function also stores the new plaintext password.
**Fix**: Remove credential persistence from localStorage entirely. Authentication state should come exclusively from the backend token. Never persist passwords client-side.

---

### SEC-3 — Fake Admin Token Generated Client-Side (Broken Auth Bypass)
**File**: [`client/src/lib/adminAuth.ts:139`](file:///d:/AiLabs/git/netflix-clone/client/src/lib/adminAuth.ts#L139)
```ts
token: `admin_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
```
**Risk**: When the backend is unavailable, a fake JWT is generated client-side in the **local fallback auth path**. This fake token can be used to set `isAdminAuthenticated() = true` locally without any real server verification. If the backend goes down, anyone knowing the hardcoded password `AdminPassword123` or `admin123` can bypass auth.
**Fix**: Remove the local fallback admin auth entirely. If the backend is unreachable, show "Server unavailable" — never grant admin access via a fake client-side token.

---

### SEC-4 — ReDoS Vulnerability (Unescaped User Input in RegEx)
**File**: [`server/src/controllers/mediaController.ts:156`](file:///d:/AiLabs/git/netflix-clone/server/src/controllers/mediaController.ts#L156)
```ts
const regex = new RegExp(query, 'i');  // ← user input directly into RegEx
```
**Risk**: A crafted regex payload like `(a+)+$` can cause catastrophic backtracking in Node.js, hanging the server (Denial of Service). This is a classic ReDoS attack.
**Fix**: Escape the user input before creating the regex:
```ts
import escapeStringRegexp from 'escape-string-regexp';
const regex = new RegExp(escapeStringRegexp(query), 'i');
```

---

### SEC-5 — Weak OTP Generation Using `Math.random()` (Cryptographically Insecure)
**File**: [`server/src/controllers/authController.ts:421`](file:///d:/AiLabs/git/netflix-clone/server/src/controllers/authController.ts#L421)
```ts
return Math.floor(100000 + Math.random() * 900000).toString();
```
**Risk**: `Math.random()` is NOT cryptographically secure in Node.js. OTP codes can be predicted if an attacker knows the internal V8 PRNG seed (via timing attacks on V8's RNG).
**Fix**: Use `crypto.randomInt()` from Node's built-in `crypto` module:
```ts
return crypto.randomInt(100000, 999999).toString();
```

---

### SEC-6 — Admin Login Endpoint Has No Rate Limiting
**File**: [`server/src/routes/adminRoutes.ts:25`](file:///d:/AiLabs/git/netflix-clone/server/src/routes/adminRoutes.ts#L25)
```ts
router.post('/login', adminLogin);  // ← no authLimiter!
```
**Risk**: The admin login endpoint (`POST /api/v1/admin/login`) is NOT rate-limited, unlike `/auth/login`. An attacker can brute-force admin credentials indefinitely.
**Fix**: Apply `authLimiter` to the admin login route:
```ts
router.post('/login', authLimiter, adminLogin);
```

---

### SEC-7 — Media Browse/Stream Routes Have No Authentication
**File**: [`server/src/routes/mediaRoutes.ts`](file:///d:/AiLabs/git/netflix-clone/server/src/routes/mediaRoutes.ts)
```ts
router.get('/browse', getBrowseData);  // ← no protect middleware
router.get('/stream/:id', streamMedia);  // ← no protect middleware
```
**Risk**: Any unauthenticated user (or web scraper) can access the content catalog and initiate video streams without a valid subscription. In a real streaming service, content should require authentication (and subscription verification).
**Fix**: Add `protect` middleware to media routes requiring auth.

---

### SEC-8 — Admin Update User Accepts Unrestricted `req.body`
**File**: [`server/src/controllers/adminController.ts:143`](file:///d:/AiLabs/git/netflix-clone/server/src/controllers/adminController.ts#L143)
```ts
const user = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
```
**Risk**: The entire `req.body` is passed to `findByIdAndUpdate`. An attacker with admin access could inject arbitrary fields like `role: 'admin'`, `password: 'hacked'`, `refreshTokens: [...]` etc.
**Fix**: Allowlist only safe fields:
```ts
const { name, email, role, isVerified } = req.body;
await User.findByIdAndUpdate(id, { name, email, role, isVerified }, ...)
```

---

## 🐛 BUGS

### BUG-1 — `streamMedia` Uses `tmdbId` for Lookup but Test Passes `_id`
**File**: [`server/src/controllers/mediaController.ts:208-209`](file:///d:/AiLabs/git/netflix-clone/server/src/controllers/mediaController.ts#L208-L209)
```ts
const numericId = parseInt(String(id), 10);
const media = await Media.findOne({ tmdbId: numericId });
```
**But in the test** ([`media.test.ts:51`](file:///d:/AiLabs/git/netflix-clone/server/src/__tests__/media.test.ts#L51)):
```ts
.get(`/api/v1/media/stream/${media._id}`)  // sends MongoDB _id, not tmdbId!
```
**Issue**: The stream endpoint queries by `tmdbId` (a number), but the test sends a MongoDB `ObjectId` string. `parseInt` of a hex ObjectId returns `NaN`, so `findOne` always returns `null` for this call and it falls through to the default video URL. This is a functional mismatch.
**Fix**: Either change the route to accept both, or use `_id` for streaming consistently.

---

### BUG-2 — Auth Test Asserts Wrong OTP Message
**File**: [`server/src/__tests__/auth.test.ts:69`](file:///d:/AiLabs/git/netflix-clone/server/src/__tests__/auth.test.ts#L69)
```ts
expect(res.body.message).toContain('OTP code dispatched');
```
**But the actual server response is**:
```json
{ "message": "A 6-digit OTP code has been sent to your email address." }
```
The string `'OTP code dispatched'` is **not** in the actual message, so this test **always fails**.
**Fix**: Update the assertion to match the real response:
```ts
expect(res.body.message).toContain('OTP code has been sent');
```

---

### BUG-3 — Invoice Amount Currency Mismatch (₹ vs. $)
**File**: [`server/src/controllers/paymentController.ts:499`](file:///d:/AiLabs/git/netflix-clone/server/src/controllers/paymentController.ts#L499)
```ts
amount: `₹${(inv.amount_paid / 100).toLocaleString('en-IN')}`  // Stripe invoices in ₹
```
```ts
amount: `₹${user.subscription?.planId === 'mobile' ? 149 : ...}`  // fallback in ₹
```
**But PLAN_SPECS uses USD amounts** (`$3.99`, `$9.99`, `$15.99`), and Stripe charges in `usd`. The invoice amount will display the actual Stripe charge (USD) formatted as ₹ — a currency mismatch shown to users.
**Fix**: Ensure consistent currency. Either use USD throughout or convert properly.

---

### BUG-4 — `MOCK_INVOICES` Used as Initial State (USD amounts, not cleared)
**File**: [`client/src/pages/Account.tsx:53-58, 177`](file:///d:/AiLabs/git/netflix-clone/client/src/pages/Account.tsx#L53-L59)
```ts
const MOCK_INVOICES = [
  { amount: "$19.99", ...}  // hardcoded $19.99 USD
];
const [invoices, setInvoices] = useState(MOCK_INVOICES);  // starts as mock
```
The initial state shows **hardcoded $19.99 mock invoices** even before the API responds. If the backend API fails (e.g., server offline), users continue seeing this fake billing history.
**Fix**: Initialize `invoices` state as `[]` and show a loading skeleton. Only show mock data if the user explicitly has no billing history.

---

### BUG-5 — `getBrowseData` Seeds DB on Every Cold Start (Race Condition Risk)
**File**: [`server/src/controllers/mediaController.ts:56-59`](file:///d:/AiLabs/git/netflix-clone/server/src/controllers/mediaController.ts#L56-L59)
```ts
if (dbItems.length === 0) {
  await Media.insertMany(FALLBACK_CATALOGUE);  // ← called on every cold GET /browse
  dbItems = await Media.find().lean();
}
```
**Issue**: Under concurrent requests, multiple requests could pass the `length === 0` check simultaneously before any insert completes, causing duplicate insertion errors (E11000 on `tmdbId` unique index).
**Fix**: Use a database-level upsert or an atomic operation, or move seeding entirely to the `seedData.ts` script and remove this auto-seed from the controller.

---

### BUG-6 — `updateUser` in Admin Doesn't Validate MongoDB ObjectId
**File**: [`server/src/controllers/adminController.ts:142-148`](file:///d:/AiLabs/git/netflix-clone/server/src/controllers/adminController.ts#L142-L148)
```ts
const { id } = req.params;
const user = await User.findByIdAndUpdate(id, req.body, ...);
```
**Issue**: If `id` is not a valid MongoDB ObjectId, Mongoose throws a `CastError` which crashes to a 500 error instead of a clean 400/404. Same issue in `deleteUser`, `updateUserSubscription`.
**Fix**: Add ObjectId validation:
```ts
import { Types } from 'mongoose';
if (!Types.ObjectId.isValid(id)) return next(new AppError('Invalid user ID.', 400));
```

---

### BUG-7 — `verifyResetOtp` Does Not Clear OTP After Verification
**File**: [`server/src/controllers/authController.ts:459-480`](file:///d:/AiLabs/git/netflix-clone/server/src/controllers/authController.ts#L459-L480)
```ts
// After verifying OTP — user.otpCode is NOT cleared
res.status(200).json({ status: 'success', message: 'OTP code verified successfully.' });
```
**Issue**: After a successful OTP verification, the hashed OTP is not cleared. This means the same OTP can be verified multiple times within the 10-minute window, and could be replayed.
**Fix**: Clear OTP after successful `verifyResetOtp` or add a `verified` boolean flag to prevent re-use.

---

### BUG-8 — Parental Controls Stored Only in `localStorage` (Not Backend)
**File**: [`client/src/pages/Account.tsx:81-88`](file:///d:/AiLabs/git/netflix-clone/client/src/pages/Account.tsx#L81-L88)
```ts
const saved = localStorage.getItem("streamly-parental-controls");
```
**Issue**: Parental control settings (maturity level, PIN requirement, PIN value — `"1234"`) are only stored in `localStorage`. They are lost when the user clears their browser data, are not synced across devices, and the PIN is stored unencrypted.
**Fix**: Persist parental controls and PINs in the Profile model on the backend (Profile already has a `pin` field).

---

## ⚠️ BROKEN WORKFLOWS

### WF-1 — CD Pipeline is a No-Op (No Actual Deployment)
**File**: [`.github/workflows/cd.yml`](file:///d:/AiLabs/git/netflix-clone/.github/workflows/cd.yml)
```yaml
- name: Deployment Verification Status
  run: echo "🚀 Full-stack build compiled cleanly!"
```
**Issue**: The CD workflow only runs `npm build` and echoes a success message. There is **no actual deployment step** — no SSH, no Render/Railway/Fly.io/Heroku deploy, no Docker push, no AWS CLI, nothing. Every push to `main` says "deployed" but nothing actually deploys.
**Fix**: Add a real deployment step (e.g., Render deploy hook, Fly.io CLI, Railway token, Heroku CLI, or SSH deploy script).

---

### WF-2 — Stress Test Runs Against Rate-Limited Endpoint (Invalid Benchmark)
**File**: [`server/src/__tests__/stress.test.ts`](file:///d:/AiLabs/git/netflix-clone/server/src/__tests__/stress.test.ts)
```ts
url: `http://localhost:${PORT}/api/v1/media/browse`,
connections: 20,
```
**Issue**: The `/api/v1/media/browse` endpoint is behind the global `apiLimiter` (300 req/15min per IP). With 20 concurrent connections, the limiter fires immediately, returning `429 Too Many Requests` — as shown in the actual results: **1342 non-2xx / 300 2xx**. The benchmark is not measuring real server performance; it's measuring how fast the rate limiter rejects requests.
**Fix**: Either target the `/health` endpoint (unrate-limited) for benchmarking, or disable the rate limiter for the stress test server instance, or use the `health` check which is free of rate limiting.

---

### WF-3 — Admin Login Token Not Used for Subsequent Admin API Calls
**File**: [`client/src/lib/adminUsers.ts`](file:///d:/AiLabs/git/netflix-clone/client/src/lib/adminUsers.ts)
**Issue**: After admin login, the token is stored in `localStorage` as `streamly_admin_session`. However, many admin data fetches in `adminUsers.ts` and `videoCatalog.ts` still read from `localStorage`-backed mock data instead of calling the backend API with the admin token.
**Fix**: Ensure all admin data store functions call `apiRequest` with the admin JWT in the Authorization header.

---

### WF-4 — Missing `getWatchHistory` Route
**File**: [`server/src/routes/profileRoutes.ts:35-37`](file:///d:/AiLabs/git/netflix-clone/server/src/routes/profileRoutes.ts#L35-L37)
```ts
router.route('/:profileId/history').post(validate(watchHistorySchema), updateWatchProgress);
// ← No GET handler for watch history!
```
**Issue**: The profile routes only have a `POST` for updating watch history. There is no `GET /profiles/:profileId/history` endpoint to retrieve the watch history from the server. The frontend reads history from `localStorage` only.
**Fix**: Add a `getWatchHistory` handler and register `GET` on the `/history` route.

---

### WF-5 — Media Browse Does Not Filter by `type` in the Browse Controller
**File**: [`server/src/controllers/mediaController.ts:50-122`](file:///d:/AiLabs/git/netflix-clone/server/src/controllers/mediaController.ts#L50-L122)
**Issue**: The Movies/TVShows pages call `GET /media/browse?type=movie` and `?type=tv`, but the `getBrowseData` controller **never reads `req.query.type`** — it returns the same full mixed catalog regardless. The filtering is done purely client-side.
**Fix**: Read `req.query.type` and filter DB results accordingly:
```ts
const mediaTypeFilter = req.query.type as string | undefined;
let dbItems = await Media.find(mediaTypeFilter ? { mediaType: mediaTypeFilter } : {}).lean();
```

---

## 📋 MISSING FEATURES

### MF-1 — No Email Verification on Registration
**Issue**: When a user registers, `isVerified` is set to `true` by default without sending any verification email. The OTP system is only used for password reset, not for email verification. An unverified email can be used to create an account with anyone's email address.
**Fix**: Send a verification OTP on registration. Block access until email is verified (`isVerified = false` by default), and provide a resend verification endpoint.

---

### MF-2 — No Subscription Gate on Content Access
**Issue**: All authenticated users (regardless of whether their subscription is `active`, `canceled`, or `past_due`) can access browse, stream, and all content endpoints. There's no subscription status check before serving content.
**Fix**: Add a middleware or controller check that verifies `user.subscription.status === 'active'` before streaming content, redirecting expired subscribers to an upgrade/renewal page.

---

### MF-3 — Cancel Subscription Endpoint Missing
**Issue**: Users can change plans, update payment, and view billing — but there is **no endpoint or UI flow** to cancel a subscription. The `cancelAtPeriodEnd` flag exists in the User model but is never set to `true` via a cancel endpoint.
**Fix**: Add `POST /payments/cancel-subscription` that calls `stripe.subscriptions.update(id, { cancel_at_period_end: true })` and sets the DB flag.

---

### MF-4 — No Search History Persistence on Backend
**Issue**: The search history is read from and written to `localStorage` only (see `client/src/pages/Search.tsx:16`). This is not synced to the backend, so it disappears when clearing browser data and doesn't sync across devices.
**Fix**: Persist search history in user profile or a dedicated backend endpoint.

---

### MF-5 — No Push Notifications (Notifications are Hardcoded)
**File**: [`client/src/pages/Account.tsx:102-131`](file:///d:/AiLabs/git/netflix-clone/client/src/pages/Account.tsx#L102-L131)
**Issue**: The notification bell shows 4 hardcoded static notifications that never change and have no backend backing:
```ts
const [notifications, setNotifications] = useState([
  { title: "New 4K Release", desc: "Dune: Part Two is now streaming..." },
  ...
])
```
**Fix**: Add a notifications collection in MongoDB and a `GET /notifications` endpoint. Push real events (new content, payment failure, subscription renewal).

---

### MF-6 — `getWatchHistory` API Endpoint Does Not Exist
**Issue**: `GET /api/v1/profiles/:profileId/history` is not implemented (only POST for updating). The MyList page and watch progress tracking cannot be properly restored from server state.

---

### MF-7 — Profile PIN is Stored as Plaintext in MongoDB
**File**: [`server/src/models/Profile.ts:91-94`](file:///d:/AiLabs/git/netflix-clone/server/src/models/Profile.ts#L91-L94)
```ts
pin: { type: String, maxlength: 4 }
```
**Issue**: Profile PINs are stored as plaintext 4-digit strings in MongoDB. While low-risk (only 4 digits), security best practice requires hashing them with bcrypt.
**Fix**: Hash PINs with `bcrypt` before saving, verify them on profile unlock.

---

## 📊 SUMMARY MATRIX

| Category | ID | Severity | Status |
|---|---|---|---|
| JWT in localStorage | SEC-1 | 🔴 Critical | Not Fixed |
| Admin creds in localStorage | SEC-2 | 🔴 Critical | Not Fixed |
| Fake client-side admin token | SEC-3 | 🔴 Critical | Not Fixed |
| ReDoS via user regex input | SEC-4 | 🔴 Critical | Not Fixed |
| Weak OTP via Math.random() | SEC-5 | 🟠 High | Not Fixed |
| Admin login no rate limit | SEC-6 | 🟠 High | Not Fixed |
| Media routes unauthenticated | SEC-7 | 🟠 High | Not Fixed |
| Admin updateUser mass assignment | SEC-8 | 🟠 High | Not Fixed |
| streamMedia ID type mismatch | BUG-1 | 🟡 Medium | Not Fixed |
| Auth test wrong OTP assertion | BUG-2 | 🟡 Medium | Not Fixed |
| Invoice currency mismatch | BUG-3 | 🟡 Medium | Not Fixed |
| Mock invoices as initial state | BUG-4 | 🟡 Medium | Not Fixed |
| getBrowseData race condition | BUG-5 | 🟡 Medium | Not Fixed |
| Missing ObjectId validation | BUG-6 | 🟡 Medium | Not Fixed |
| OTP not cleared after verify | BUG-7 | 🟠 High | Not Fixed |
| Parental PIN in localStorage | BUG-8 | 🟡 Medium | Not Fixed |
| CD pipeline no-op | WF-1 | 🟡 Medium | Not Fixed |
| Stress test hits rate limiter | WF-2 | 🟡 Medium | Not Fixed |
| Admin token not used in API calls | WF-3 | 🟡 Medium | Not Fixed |
| Missing GET watch history route | WF-4 | 🟡 Medium | Not Fixed |
| Browse ignores ?type query param | WF-5 | 🟡 Medium | Not Fixed |
| No email verification on signup | MF-1 | 🟠 High | Missing |
| No subscription gate | MF-2 | 🟠 High | Missing |
| No cancel subscription endpoint | MF-3 | 🟠 High | Missing |
| Search history not persisted | MF-4 | 🟢 Low | Missing |
| Notifications are hardcoded | MF-5 | 🟢 Low | Missing |
| getWatchHistory endpoint missing | MF-6 | 🟡 Medium | Missing |
| Profile PIN stored plaintext | MF-7 | 🟡 Medium | Missing |

---

> _Scanned across: `server/src/` (controllers, models, middlewares, routes, utils), `client/src/` (pages, lib, components), `.github/workflows/`, and all test suites._
