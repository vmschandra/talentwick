import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
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
import { db } from "./config";
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

// ─── Candidate Profile ───────────────────────────────────

export async function getCandidateProfile(uid: string): Promise<CandidateProfile | null> {
  const snap = await getDoc(doc(db, "candidateProfiles", uid));
  return snap.exists() ? (snap.data() as CandidateProfile) : null;
}

export async function saveCandidateProfile(uid: string, data: Partial<CandidateProfile>): Promise<void> {
  await setDoc(doc(db, "candidateProfiles", uid), { ...data, uid, updatedAt: serverTimestamp() }, { merge: true });
}

// ─── Recruiter Profile ───────────────────────────────────

export async function getRecruiterProfile(uid: string): Promise<RecruiterProfile | null> {
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
  const snap = await getDoc(doc(db, "jobs", jobId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Job : null;
}

export async function updateJob(jobId: string, data: Partial<Job>): Promise<void> {
  await updateDoc(doc(db, "jobs", jobId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteJob(jobId: string): Promise<void> {
  await deleteDoc(doc(db, "jobs", jobId));
}

export async function searchJobs(
  filters?: JobFilters,
  lastDoc?: DocumentSnapshot,
  pageSize = JOBS_PER_PAGE
): Promise<{ jobs: Job[]; lastDoc: DocumentSnapshot | null }> {
  const constraints: QueryConstraint[] = [
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(pageSize),
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
  let jobs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Job));

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

  return { jobs, lastDoc: snapshot.docs[snapshot.docs.length - 1] || null };
}

export async function getRecruiterJobs(recruiterId: string): Promise<Job[]> {
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
  // Check duplicate
  const existing = await getDocs(
    query(
      collection(db, "applications"),
      where("jobId", "==", data.jobId),
      where("candidateId", "==", data.candidateId)
    )
  );
  if (!existing.empty) throw new Error("You have already applied to this job");

  const docRef = await addDoc(collection(db, "applications"), {
    ...data,
    status: "pending",
    statusHistory: [{ status: "pending", timestamp: Timestamp.now() }],
    appliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "jobs", data.jobId), { applicantCount: increment(1) });
  await createNotification(data.recruiterId, "application_received", "New Application", `${data.candidateName} applied to your job posting`, `/recruiter/my-jobs/${data.jobId}/applicants`);

  return docRef.id;
}

export async function hasApplied(jobId: string, candidateId: string): Promise<boolean> {
  const q = query(
    collection(db, "applications"),
    where("jobId", "==", jobId),
    where("candidateId", "==", candidateId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
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
  await updateDoc(appRef, {
    status,
    statusHistory: [
      ...(await getDoc(appRef)).data()?.statusHistory || [],
      { status, timestamp: Timestamp.now(), note },
    ],
    updatedAt: serverTimestamp(),
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

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function getAllJobs() {
  const snap = await getDocs(query(collection(db, "jobs"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
}

export async function getAllTransactions() {
  const snap = await getDocs(query(collection(db, "transactions"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
