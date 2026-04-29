# Fix #10 & #11 — Admin Error States + Candidate Job Search Upgrade

**Date:** 2026-04-28  
**Scope:** Two targeted fixes, no new routes, no new files.

---

## Fix #10 — Admin Error States

**Problem:** Both `/admin/users` and `/admin/jobs` show a blank screen if the Firestore fetch fails. A toast appears briefly then disappears, leaving the admin with nothing to act on.

**Fix:** Add an `error: string | null` state to each page. On catch, set the error message and render an error card (icon + message + "Try again" button that re-runs the fetch). The existing loading skeleton and empty-state handling are already correct and stay unchanged.

**Files changed:**
- `src/app/admin/users/page.tsx`
- `src/app/admin/jobs/page.tsx`

---

## Fix #11 — Candidate Job Search Upgrade

**Problem:** `candidate/jobs` loads all 500 jobs at once and only supports 3-field search (title, city, country). The public `browse-jobs` page uses the `useJobSearch` hook with paginated Firestore queries, URL-synced state, and 5 filter dimensions (keyword, country, city, job type, work mode, experience level). Candidates get an inferior search experience.

**Fix:** Rewrite `candidate/jobs/page.tsx` to use `useJobSearch` and the same filter controls as `browse-jobs`. Key differences from browse-jobs to preserve:
- Link prefix stays `/candidate/jobs` (so the candidate sidebar and `/candidate/jobs/[id]` route keep working)
- Use the existing shared `JobCard` component (already accepts `linkPrefix`)
- Keep the page inside its authenticated layout (no public access change)

The inline local `JobCard` defined inside `browse-jobs/page.tsx` gets replaced with the shared `JobCard` component from `@/components/cards/JobCard` — same visual output, removes ~50 lines of duplication.

**Files changed:**
- `src/app/candidate/jobs/page.tsx` — full rewrite
- `src/app/(public)/browse-jobs/page.tsx` — swap local `JobCard` for shared component

**Not changed:** `/browse-jobs` route, public access, auth rules, Firestore rules, any other page.
