# Rate Limiting on API Routes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Firestore-backed rate limiting to three API routes that are currently open to abuse.

**Architecture:** A single `checkRateLimit` helper reads/writes a `rateLimits` Firestore collection using a transaction (fixed-window algorithm). Each of the three API routes calls this helper at entry and returns 429 if the caller is over limit. Firestore TTL auto-cleans expired documents.

**Tech Stack:** Next.js 14 App Router, Firebase Admin SDK (already in project), TypeScript

---

## File Map

| File | Change |
|---|---|
| `src/lib/rate-limit.ts` | Create — core rate limit helper |
| `src/app/api/auth/forgot-password/route.ts` | Modify — add IP-based rate limit |
| `src/app/api/email/route.ts` | Modify — capture uid from token, add user-based rate limit |
| `src/app/api/messages/notify/route.ts` | Modify — add user-based rate limit |

**Not changed:** Firestore rules (rateLimits is not listed → implicitly denied to clients), firestore.indexes.json (lookups are by document ID only — no composite index needed), any other file.

---

## Task 1: Create the rate limit helper

**Files:**
- Create: `src/lib/rate-limit.ts`

- [ ] **Step 1: Create the file**

Write `src/lib/rate-limit.ts` with this exact content:

```ts
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds until the window resets
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const db = getAdminDb();
  const docRef = db.collection("rateLimits").doc(key);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);

    if (!snap.exists) {
      const windowStart = Timestamp.fromMillis(now);
      const expireAt = Timestamp.fromMillis(now + windowMs);
      tx.set(docRef, { count: 1, windowStart, expireAt });
      return { allowed: true };
    }

    const data = snap.data()!;
    const windowStart = (data.windowStart as Timestamp).toMillis();

    if (now - windowStart >= windowMs) {
      // Window expired — reset
      const newWindowStart = Timestamp.fromMillis(now);
      const expireAt = Timestamp.fromMillis(now + windowMs);
      tx.set(docRef, { count: 1, windowStart: newWindowStart, expireAt });
      return { allowed: true };
    }

    if (data.count >= limit) {
      const retryAfter = Math.ceil((windowStart + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    tx.update(docRef, { count: FieldValue.increment(1) });
    return { allowed: true };
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/lib/rate-limit.ts
git commit -m "feat: add Firestore-backed rate limit helper"
```

---

## Task 2: Rate limit forgot-password (by IP, 5 per 15 min)

**Files:**
- Modify: `src/app/api/auth/forgot-password/route.ts`

- [ ] **Step 1: Add the import**

At the top of `src/app/api/auth/forgot-password/route.ts`, add after the existing imports:

```ts
import { checkRateLimit } from "@/lib/rate-limit";
```

- [ ] **Step 2: Add the rate limit check**

Inside the `POST` handler, add these lines as the very first thing inside the `try` block (before the `const { email } = await request.json()` line):

```ts
const ip =
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
const rl = await checkRateLimit(`forgot-password:${ip}`, 5, 900);
if (!rl.allowed) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 900) } }
  );
}
```

The full handler should now start like this:

```ts
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const rl = await checkRateLimit(`forgot-password:${ip}`, 5, 900);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 900) } }
      );
    }

    const { email } = await request.json();
    // ... rest of existing code unchanged ...
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/forgot-password/route.ts
git commit -m "feat: rate limit forgot-password to 5 requests per 15 min per IP"
```

---

## Task 3: Rate limit email route (by user ID, 30 per minute)

**Files:**
- Modify: `src/app/api/email/route.ts`

- [ ] **Step 1: Add the import**

At the top of `src/app/api/email/route.ts`, add after the existing imports:

```ts
import { checkRateLimit } from "@/lib/rate-limit";
```

- [ ] **Step 2: Capture the uid from the verified token**

The current code verifies the token but discards the decoded result:

```ts
// CURRENT (around line 18):
try {
  await getAdminAuth().verifyIdToken(authHeader.slice(7));
} catch {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Replace with (captures `decoded` so we have the uid):

```ts
let decoded: { uid: string };
try {
  decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
} catch {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

- [ ] **Step 3: Add the rate limit check**

Immediately after the token verification block (before `const body = await request.json()`), add:

```ts
const rl = await checkRateLimit(`email:${decoded.uid}`, 30, 60);
if (!rl.allowed) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/email/route.ts
git commit -m "feat: rate limit email route to 30 requests per minute per user"
```

---

## Task 4: Rate limit messages/notify (by user ID, 30 per minute)

**Files:**
- Modify: `src/app/api/messages/notify/route.ts`

- [ ] **Step 1: Add the import**

At the top of `src/app/api/messages/notify/route.ts`, add after the existing imports:

```ts
import { checkRateLimit } from "@/lib/rate-limit";
```

- [ ] **Step 2: Add the rate limit check**

In the `POST` handler, `callerId` is already set from the decoded token (around line 14: `const callerId = decoded.uid`). Add the rate limit check immediately after `callerId` is defined, before the `const { conversationId, ... } = await request.json()` line:

```ts
const rl = await checkRateLimit(`messages-notify:${callerId}`, 30, 60);
if (!rl.allowed) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/messages/notify/route.ts
git commit -m "feat: rate limit messages/notify to 30 requests per minute per user"
```

---

## Task 5: Enable Firestore TTL (manual console step)

This keeps the `rateLimits` collection from accumulating stale documents forever.

- [ ] **Step 1: Open Firebase Console**

Go to [console.firebase.google.com](https://console.firebase.google.com) → select your TalentWick project → **Firestore Database** → **Indexes** tab → **TTL policies** section.

- [ ] **Step 2: Add TTL policy**

Click **Add TTL policy** and fill in:
- **Collection group:** `rateLimits`
- **Field path:** `expireAt`

Click **Save**.

Firestore will now automatically delete `rateLimits` documents within 72 hours of their `expireAt` timestamp. Documents that are logically expired but not yet physically deleted are still correctly handled by the code (the `windowStart` field is what the code uses to determine expiry — not the TTL).

- [ ] **Step 3: Verify end-to-end manually**

Start the dev server:
```bash
npm run dev
```

Test forgot-password rate limit (run this 6 times in quick succession — the 6th should return 429):
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

After 5 calls, the 6th should return:
```json
{ "error": "Too many requests. Please try again later." }
```
with HTTP status `429` and a `Retry-After` header.

Check Firestore Console → `rateLimits` collection — you should see a document `forgot-password:127.0.0.1` with `count: 5`.

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```
