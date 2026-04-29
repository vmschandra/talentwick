# Credit Expiry Guard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent recruiters with expired credits from posting jobs by adding an expiry check in both the Firestore transaction and the UI.

**Architecture:** Two targeted edits. The transaction fix is the authoritative server-side guard; the UI fix ensures the user sees an accurate "no credits" gate before even submitting.

**Tech Stack:** Next.js 14, Firebase client SDK (`firebase/firestore`), TypeScript

---

## File Map

| File | Change |
|---|---|
| `src/lib/firebase/firestore.ts` | Modify `postJobWithCredit` — add `creditsExpiresAt` check |
| `src/app/recruiter/post-job/page.tsx` | Add `hasValidCredits` helper, replace two credit checks |

---

## Task 1: Fix the Firestore transaction guard

**Files:**
- Modify: `src/lib/firebase/firestore.ts` (around line 227)

- [ ] **Step 1: Read the current transaction**

Open `src/lib/firebase/firestore.ts`. Find `postJobWithCredit` (around line 220). The transaction currently reads:

```ts
const recruiterSnap = await transaction.get(recruiterRef);
const credits = recruiterSnap.data()?.jobPostCredits || 0;
if (credits < 1) throw new Error("No credits remaining");
```

- [ ] **Step 2: Replace the credit check**

Replace those three lines with:

```ts
const recruiterSnap = await transaction.get(recruiterRef);
const data = recruiterSnap.data();
const credits = data?.jobPostCredits || 0;
const expiresAt = data?.creditsExpiresAt;
const creditsExpired = expiresAt && expiresAt.toDate() <= new Date();
if (credits < 1 || creditsExpired) throw new Error("No valid credits");
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase/firestore.ts
git commit -m "fix: check credit expiry in postJobWithCredit transaction"
```

---

## Task 2: Fix the post-job page UI guard

**Files:**
- Modify: `src/app/recruiter/post-job/page.tsx`

- [ ] **Step 1: Add the helper function**

Find the `onSubmit` function (around line 195). Add this helper immediately above it (after the other helper functions like `addSkill`, `removeSkill`):

```ts
function hasValidCredits(p: RecruiterProfile | null): boolean {
  if (!p || p.jobPostCredits < 1) return false;
  if (!p.creditsExpiresAt) return true;
  return p.creditsExpiresAt.toDate() > new Date();
}
```

`RecruiterProfile` is already imported from `@/types`.

- [ ] **Step 2: Fix the submit guard**

Find this line inside `onSubmit` (around line 198):

```ts
if ((profile.jobPostCredits || 0) < 1) {
  toast.error("No credits remaining. Please purchase credits first.");
  return;
}
```

Replace with:

```ts
if (!hasValidCredits(profile)) {
  toast.error("Your credits have expired or are unavailable. Please purchase credits first.");
  return;
}
```

- [ ] **Step 3: Fix the render gate**

Find the render section (around line 268):

```ts
const credits = profile?.jobPostCredits ?? 0;

if (credits < 1) {
```

Replace with:

```ts
if (!hasValidCredits(profile)) {
```

And remove the `const credits = ...` line entirely (it's no longer used for the gate — the credits display line further down uses `profile?.jobPostCredits ?? 0` directly, which is fine to keep).

- [ ] **Step 4: Update the "No Credits" message**

Find the heading inside the no-credits card (around line 278):

```tsx
<h2 className="text-2xl font-bold">No Credits Available</h2>
<p className="max-w-md text-muted-foreground">
  You need at least 1 job posting credit to post a new job. Purchase credits to continue.
</p>
```

Replace with:

```tsx
<h2 className="text-2xl font-bold">No Credits Available</h2>
<p className="max-w-md text-muted-foreground">
  Your credits have expired or run out. Purchase a new plan to continue posting jobs.
</p>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/app/recruiter/post-job/page.tsx
git commit -m "fix: guard post-job UI against expired credits"
```
