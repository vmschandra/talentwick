# Resume Storage Cleanup — Design Spec

**Date:** 2026-04-29

---

## Problem

`uploadResume` in `src/lib/firebase/storage.ts` uploads to `resumes/${uid}/${file.name}`. When a candidate replaces their resume with a differently-named file, the old file stays in Firebase Storage indefinitely. Over time this wastes storage and creates GDPR liability (user's personal data that is no longer their active resume, never cleaned up).

---

## Solution

Change the upload path to a fixed name — `resumes/${uid}/resume.pdf` — so that every new upload overwrites the previous one automatically. Firebase Storage `uploadBytes` on an existing path replaces the object in place.

This requires no deletion logic, no schema changes, and no Firestore rule changes (the existing `resumes/{uid}/{filename}` rule already matches `resumes/{uid}/resume.pdf`).

The `resumeFileName` field on the candidate profile continues to store the original human-readable filename (e.g. "John_CV_2026.pdf") for display purposes — that is unaffected.

---

## What changes

| File | Change |
|---|---|
| `src/lib/firebase/storage.ts` | Change upload path from `resumes/${uid}/${file.name}` to `resumes/${uid}/resume.pdf` |

**Not changed:** `storage.rules`, `ResumeUploader.tsx`, `CandidateProfile` type, Firestore profile fields.

---

## Existing users

Candidates who already have a resume stored at `resumes/${uid}/OldName.pdf` will continue to use that file until they next upload. On their next upload, the new file goes to `resumes/${uid}/resume.pdf` and the old path becomes an orphan. This is acceptable — the volume of orphaned files is bounded (at most one per existing user) and decreases over time as users upload new resumes.
