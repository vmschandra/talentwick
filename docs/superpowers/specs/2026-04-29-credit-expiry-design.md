# Credit Expiry Guard — Design Spec

**Date:** 2026-04-29

---

## Problem

`postJobWithCredit` in `src/lib/firebase/firestore.ts` only checks `jobPostCredits >= 1`. It does not check `creditsExpiresAt`. A recruiter whose credits have expired (e.g. purchased 35 days ago, expired 5 days ago) can still post jobs as long as their count > 0.

The same gap exists in the UI: `post-job/page.tsx` shows a "no credits" gate based only on `credits < 1`.

---

## Fix

A `hasValidCredits` helper (inline function, not exported — only needed in two places) checks both:
1. `jobPostCredits >= 1`
2. `creditsExpiresAt` is absent OR `creditsExpiresAt.toDate() > now`

Applied in two places:

### 1. Firestore transaction (`src/lib/firebase/firestore.ts`)

The authoritative server-side guard. Inside `postJobWithCredit`, the existing check:
```ts
const credits = recruiterSnap.data()?.jobPostCredits || 0;
if (credits < 1) throw new Error("No credits remaining");
```

Becomes:
```ts
const data = recruiterSnap.data();
const credits = data?.jobPostCredits || 0;
const expiresAt = data?.creditsExpiresAt;
const creditsExpired = expiresAt && expiresAt.toDate() <= new Date();
if (credits < 1 || creditsExpired) throw new Error("No valid credits");
```

### 2. Post-job page UI (`src/app/recruiter/post-job/page.tsx`)

Add a local helper above the render logic:
```ts
function hasValidCredits(profile: RecruiterProfile | null): boolean {
  if (!profile || profile.jobPostCredits < 1) return false;
  if (!profile.creditsExpiresAt) return true;
  return profile.creditsExpiresAt.toDate() > new Date();
}
```

Replace two existing credit checks:
- Render gate (`if (credits < 1)`) → `if (!hasValidCredits(profile))`
- Submit guard (`if ((profile.jobPostCredits || 0) < 1)`) → `if (!hasValidCredits(profile))`

Also update the "No Credits Available" message to say "expired or unavailable" so the user understands why they're blocked.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/firebase/firestore.ts` | Add `creditsExpiresAt` check in `postJobWithCredit` transaction |
| `src/app/recruiter/post-job/page.tsx` | Add `hasValidCredits` helper, use it in UI gate and submit guard |

**Not changed:** Firestore rules, pricing/checkout flow, webhook (credits are still added the same way).
