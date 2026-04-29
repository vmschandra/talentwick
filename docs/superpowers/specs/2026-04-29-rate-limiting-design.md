# Rate Limiting on API Routes — Design Spec

**Date:** 2026-04-29

---

## Problem

Three API routes have no rate limiting and are open to abuse:

| Route | Auth required | Risk |
|---|---|---|
| `/api/auth/forgot-password` | None | Anyone can spam password reset emails to any address |
| `/api/email` | Firebase token | Authenticated users can trigger unlimited emails |
| `/api/messages/notify` | Firebase token | Authenticated users can spam notifications/emails |

---

## Solution

A shared Firestore-backed rate limiter. Each request is checked against a counter stored in a `rateLimits` Firestore collection before the route does any real work. Requests that exceed the limit get a `429 Too Many Requests` response immediately.

Firestore TTL policy auto-deletes expired rate limit documents so the collection stays small.

---

## Rate Limits

| Route | Key | Limit |
|---|---|---|
| `/api/auth/forgot-password` | Client IP (`x-forwarded-for`) | 5 requests per 15 minutes |
| `/api/email` | Firebase user ID | 30 requests per minute |
| `/api/messages/notify` | Firebase user ID | 30 requests per minute |

---

## Firestore Data Model

**Collection:** `rateLimits`

**Document ID:** `{route}:{identifier}` — e.g. `forgot-password:203.0.113.42` or `email:uid_abc123`

**Fields:**

| Field | Type | Description |
|---|---|---|
| `count` | number | Requests made in the current window |
| `windowStart` | Timestamp | When the current window started |
| `expireAt` | Timestamp | `windowStart + windowDuration` — used by Firestore TTL to auto-delete |

**Algorithm (fixed window):**
1. Read the document for this key
2. If it doesn't exist, or `windowStart` is older than the window duration → create/reset: `count=1`, new `windowStart`, new `expireAt` → allow
3. If `count < limit` → increment `count` → allow
4. If `count >= limit` → return `429` with a `Retry-After` header

All reads and writes use a Firestore transaction to prevent race conditions under concurrent requests.

---

## Firestore TTL Setup (one-time, Firebase Console)

1. Open Firebase Console → Firestore → **Indexes** tab → **TTL policies**
2. Click **Add TTL policy**
3. Collection: `rateLimits`, Field: `expireAt`
4. Save

Firestore will automatically delete documents once their `expireAt` timestamp has passed (deletion happens within 72 hours of expiry — documents that are technically expired but not yet deleted are still checked by the code using `windowStart`, so no correctness issue).

---

## Code Changes

### New file: `src/lib/rate-limit.ts`

Exports a single function:

```ts
checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; retryAfter?: number }>
```

- `key` — the document ID (`route:identifier`)
- `limit` — max requests allowed in the window
- `windowSeconds` — window duration in seconds
- Returns `{ allowed: true }` or `{ allowed: false, retryAfter: secondsUntilReset }`

Uses the Firebase Admin SDK (`getAdminDb()`) — already available in the project.

### Modified files

**`src/app/api/auth/forgot-password/route.ts`**
- Extract client IP from `x-forwarded-for` header (Vercel always sets this)
- Call `checkRateLimit("forgot-password:{ip}", 5, 900)` at the top of the handler
- Return `429` with `Retry-After` header if not allowed

**`src/app/api/email/route.ts`**
- User ID is already verified from the Bearer token
- Call `checkRateLimit("email:{uid}", 30, 60)` after token verification
- Return `429` if not allowed

**`src/app/api/messages/notify/route.ts`**
- Caller ID is already decoded from the token (`callerId`)
- Call `checkRateLimit("messages-notify:{callerId}", 30, 60)` after token verification
- Return `429` if not allowed

---

## What Is Not Changed

- Firestore security rules — `rateLimits` is only accessed server-side via Admin SDK, never from the client
- All existing auth checks and business logic in each route
- Any other API routes (`/api/payments/*`, `/api/health`, etc.)
- No new npm packages required — uses existing Firebase Admin SDK

---

## Error Response Format

```json
{ "error": "Too many requests. Please try again later." }
```

HTTP status `429`, with `Retry-After: <seconds>` header set to the remaining window time.
