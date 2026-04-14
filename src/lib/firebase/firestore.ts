import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  runTransaction,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import { db, firebaseConfigured } from "./config";
import {
  Job,
  CandidateProfile,
  RecruiterProfile,
  Application,
  ApplicationStatus,
  JobFilters,
  Notification,
  NotificationType,
} from "@/types";

const JOBS_PER_PAGE = 20;
// Use a larger fetch when keyword/location filters are active so client-side
// filtering doesn't exhaust the page before the user has seen enough results.
const JOBS_FILTERED_FETCH = 100;

// ─── Candidate Profile ───────────────────────────────────

export async function getCandidateProfile(uid: string): Promise<CandidateProfile | null> {
  if (!firebaseConfigured) return null;
  const snap = await getDoc(doc(db, "candidateProfiles", uid));
  return snap.exists() ? (snap.data() as CandidateProfile) : null;
}

export async function saveCandidateProfile(uid: string, data: Partial<CandidateProfile>): Promise<void> {
  await setDoc(doc(db, "candidateProfiles", uid), { ...data, uid, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getAllCandidateProfiles(): Promise<CandidateProfile[]> {
  if (!firebaseConfigured) return [];
  // Capped at 500 to avoid unbounded reads on large datasets.
  const snap = await getDocs(query(collection(db, "candidateProfiles"), limit(500)));
  return snap.docs.map((d) => d.data() as CandidateProfile);
}

// ─── Recruiter Profile ───────────────────────────────────

export async function getRecruiterProfile(uid: string): Promise<RecruiterProfile | null> {
  if (!firebaseConfigured) return null;
  const snap = await getDoc(doc(db, "recruiterProfiles", uid));
  return snap.exists() ? (snap.data() as RecruiterProfile) : null;
}

export async function saveRecruiterProfile(uid: string, data: Partial<RecruiterProfile>): Promise<void> {
  await setDoc(
    doc(db, "recruiterProfiles", uid),
    { ...data, uid, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ─── Jobs ────────────────────────────────────────────────

export async function createJob(jobData: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "jobs"), {
    ...jobData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getJob(jobId: string): Promise<Job | null> {
  if (!firebaseConfigured) return null;
  const snap = await getDoc(doc(db, "jobs", jobId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Job : null;
}

// Fetch multiple jobs by ID in a single parallel batch (avoids N+1 queries).
export async function getJobsByIds(jobIds: string[]): Promise<Map<string, Job>> {
  if (!firebaseConfigured || jobIds.length === 0) return new Map();
  const unique = Array.from(new Set(jobIds));
  const snaps = await Promise.all(unique.map((id) => getDoc(doc(db, "jobs", id))));
  const result = new Map<string, Job>();
  snaps.forEach((snap) => {
    if (snap.exists()) result.set(snap.id, { id: snap.id, ...snap.data() } as Job);
  });
  return result;
}

export async function updateJob(jobId: string, data: Partial<Job>): Promise<void> {
  await updateDoc(doc(db, "jobs", jobId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteJob(jobId: string): Promise<void> {
  // Atomically delete the job and all its applications in one batch so
  // candidates don't see orphaned "Unknown Job" entries in their history.
  const appSnap = await getDocs(
    query(collection(db, "applications"), where("jobId", "==", jobId))
  );
  const batch = writeBatch(db);
  batch.delete(doc(db, "jobs", jobId));
  appSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function searchJobs(
  filters?: JobFilters,
  lastDoc?: DocumentSnapshot,
  pageSize = JOBS_PER_PAGE
): Promise<{ jobs: Job[]; lastDoc: DocumentSnapshot | null }> {
  if (!firebaseConfigured) return { jobs: [], lastDoc: null };

  // Use a larger server-side fetch when keyword or location filters are present
  // because those are applied client-side after Firestore returns results.
  const hasClientFilter = !!(filters?.keyword || filters?.location || filters?.salaryMin || filters?.salaryMax);
  const fetchSize = hasClientFilter ? JOBS_FILTERED_FETCH : pageSize;

  const constraints: QueryConstraint[] = [
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(fetchSize),
  ];

  if (filters?.jobType?.length === 1) {
    constraints.push(where("jobType", "==", filters.jobType[0]));
  }
  if (filters?.workMode?.length === 1) {
    constraints.push(where("workMode", "==", filters.workMode[0]));
  }
  if (filters?.experienceLevel) {
    constraints.push(where("experienceLevel", "==", filters.experienceLevel));
  }

  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, "jobs"), ...constraints);
  const snapshot = await getDocs(q);

  // Index snapshot docs by job ID so we can find the correct pagination cursor
  // after client-side filtering (the old code used the last Firestore doc which
  // could skip valid results when filters removed docs from the middle).
  const docsById = new Map(snapshot.docs.map((d) => [d.id, d]));
  let jobs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Job));

  // Filter out expired jobs (expiresAt enforced server-side in a future Cloud Function)
  const now = new Date();
  jobs = jobs.filter((j) => !j.expiresAt || j.expiresAt.toDate() > now);

  // Client-side filtering for fields Firestore can't compound-query
  if (filters?.keyword) {
    const kw = filters.keyword.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(kw) ||
        j.description.toLowerCase().includes(kw) ||
        j.skills.some((s) => s.toLowerCase().includes(kw))
    );
  }
  if (filters?.location) {
    const loc = filters.location.toLowerCase();
    jobs = jobs.filter((j) => j.location.toLowerCase().includes(loc));
  }
  if (filters?.salaryMin) {
    jobs = jobs.filter((j) => j.salary && j.salary.max >= filters.salaryMin!);
  }
  if (filters?.salaryMax) {
    jobs = jobs.filter((j) => j.salary && j.salary.min <= filters.salaryMax!);
  }

  // Trim to requested page size after client filtering
  const pagedJobs = jobs.slice(0, pageSize);

  // Use the Firestore doc of the last returned job as the cursor so the next
  // page starts from the right position even after client-side filtering.
  const lastPagedDoc =
    pagedJobs.length > 0
      ? (docsById.get(pagedJobs[pagedJobs.length - 1].id) ?? null)
      : null;

  return {
    jobs: pagedJobs,
    lastDoc: lastPagedDoc,
  };
}

export async function getRecruiterJobs(recruiterId: string): Promise<Job[]> {
  if (!firebaseConfigured) return [];
  const q = query(
    collection(db, "jobs"),
    where("recruiterId", "==", recruiterId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
}

export async function incrementJobView(jobId: string): Promise<void> {
  await updateDoc(doc(db, "jobs", jobId), { viewCount: increment(1) });
}

// ─── Job Posting with Credit Deduction (atomic) ─────────

export async function postJobWithCredit(
  recruiterId: string,
  jobData: Omit<Job, "id" | "createdAt" | "updatedAt" | "applicantCount" | "viewCount" | "status" | "expiresAt" | "isFeatured">
): Promise<string> {
  const recruiterRef = doc(db, "recruiterProfiles", recruiterId);
  const jobRef = doc(collection(db, "jobs"));

  await runTransaction(db, async (transaction) => {
    const recruiterSnap = await transaction.get(recruiterRef);
    const credits = recruiterSnap.data()?.jobPostCredits || 0;
    if (credits < 1) throw new Error("No credits remaining");

    transaction.update(recruiterRef, {
      jobPostCredits: increment(-1),
      totalCreditsUsed: increment(1),
    });

    transaction.set(jobRef, {
      ...jobData,
      status: "active" as const,
      applicantCount: 0,
      viewCount: 0,
      isFeatured: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    });
  });

  return jobRef.id;
}

// ─── Applications ────────────────────────────────────────

export async function applyToJob(data: {
  jobId: string;
  candidateId: string;
  recruiterId: string;
  candidateName: string;
  candidateEmail: string;
  resumeURL: string;
  coverLetter?: string;
}): Promise<string> {
  // Use a deterministic document ID so the duplicate check can run inside the
  // transaction via transaction.get() — this closes the race window where two
  // simultaneous submits could both pass a pre-transaction getDocs() check.
  const appId = `${data.jobId}_${data.candidateId}`;
  const appRef = doc(db, "applications", appId);
  const jobRef = doc(db, "jobs", data.jobId);

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(appRef);
    if (existing.exists()) throw new Error("You have already applied to this job");

    transaction.set(appRef, {
      ...data,
      status: "pending",
      statusHistory: [{ status: "pending", timestamp: Timestamp.now() }],
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(jobRef, { applicantCount: increment(1) });
  });

  await createNotification(
    data.recruiterId,
    "application_received",
    "New Application",
    `${data.candidateName} applied to your job posting`,
    `/recruiter/my-jobs/${data.jobId}/applicants`
  );

  return appId;
}

export async function hasApplied(jobId: string, candidateId: string): Promise<boolean> {
  if (!firebaseConfigured) return false;
  const snap = await getDoc(doc(db, "applications", `${jobId}_${candidateId}`));
  return snap.exists();
}

export async function getCandidateApplications(candidateId: string): Promise<Application[]> {
  const q = query(
    collection(db, "applications"),
    where("candidateId", "==", candidateId),
    orderBy("appliedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application));
}

export async function getJobApplications(jobId: string): Promise<Application[]> {
  const q = query(
    collection(db, "applications"),
    where("jobId", "==", jobId),
    orderBy("appliedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application));
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  candidateId: string,
  note?: string
): Promise<void> {
  const appRef = doc(db, "applications", applicationId);

  // Use a transaction so the statusHistory array is never overwritten by
  // concurrent updates (race condition in the previous non-atomic version).
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(appRef);
    if (!snap.exists()) throw new Error("Application not found");
    const existing = snap.data().statusHistory ?? [];
    transaction.update(appRef, {
      status,
      statusHistory: [
        ...existing,
        { status, timestamp: Timestamp.now(), ...(note ? { note } : {}) },
      ],
      updatedAt: serverTimestamp(),
    });
  });

  await createNotification(
    candidateId,
    "status_update",
    "Application Update",
    `Your application status changed to "${status}"`,
    "/candidate/applications"
  );
}

// ─── Notifications ───────────────────────────────────────

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    userId,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function getUserNotifications(userId: string, limitCount = 20): Promise<Notification[]> {
  if (!firebaseConfigured) return [];
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", notifId), { read: true });
}

// ─── Admin Helpers ───────────────────────────────────────
// These are capped to prevent accidental unbounded reads on large datasets.
// Move to paginated API routes backed by the Admin SDK for production scale.

export async function getAllUsers(cap = 200) {
  if (!firebaseConfigured) return [];
  const snap = await getDocs(
    query(collection(db, "users"), orderBy("createdAt", "desc"), limit(cap))
  );
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function getAllJobs(cap = 200) {
  if (!firebaseConfigured) return [];
  const snap = await getDocs(
    query(collection(db, "jobs"), orderBy("createdAt", "desc"), limit(cap))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
}

export async function getAllTransactions(cap = 200) {
  if (!firebaseConfigured) return [];
  const snap = await getDocs(
    query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(cap))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
