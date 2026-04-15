import { Timestamp } from "firebase/firestore";

// ─── User ────────────────────────────────────────────────
export type UserRole = "candidate" | "recruiter" | "admin";

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  onboardingComplete: boolean;
}

// ─── Candidate Profile ───────────────────────────────────
export interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
}

export interface CandidateProfile {
  uid: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  resumeURL?: string;
  resumeFileName?: string;
  location: string;
  preferredJobType: JobType;
  expectedSalary?: { min: number; max: number; currency: string };
  openToWork: boolean;
  profileCompleteness: number;
  profileViews?: number;
  updatedAt: Timestamp;
}

// ─── Recruiter Profile ───────────────────────────────────
export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";

export interface RecruiterProfile {
  uid: string;
  companyName: string;
  companyLogo?: string;
  companyWebsite?: string;
  companySize?: CompanySize;
  industry?: string;
  companyDescription?: string;
  location: string;
  designation?: string;
  employeeId?: string;
  workEmail?: string;
  jobPostCredits: number;
  totalCreditsUsed: number;
  totalSpent: number;
  updatedAt: Timestamp;
}

// ─── Job ─────────────────────────────────────────────────
export type JobType = "full-time" | "part-time" | "contract" | "internship";
export type WorkMode = "onsite" | "remote" | "hybrid";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";
export type JobStatus = "draft" | "active" | "paused" | "closed" | "expired";

export interface Salary {
  min: number;
  max: number;
  currency: string;
  period: "yearly" | "monthly" | "hourly";
}

export interface Job {
  id: string;
  recruiterId: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  location: string;
  jobType: JobType;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  salary?: Salary;
  benefits?: string[];
  applicationDeadline?: Timestamp;
  status: JobStatus;
  applicantCount: number;
  viewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  isFeatured: boolean;
}

// ─── Application ─────────────────────────────────────────
export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected"
  | "withdrawn";

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  timestamp: Timestamp;
  note?: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  recruiterId: string;
  candidateName: string;
  candidateEmail: string;
  resumeURL: string;
  coverLetter?: string;
  status: ApplicationStatus;
  statusHistory: StatusHistoryEntry[];
  appliedAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Transaction ─────────────────────────────────────────
export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export interface Transaction {
  id: string;
  recruiterId: string;
  gateway: string;
  gatewaySessionId: string;
  gatewayTransactionId: string;
  plan: "starter" | "growth" | "enterprise";
  amount: number;
  currency: string;
  credits: number;
  status: TransactionStatus;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

// ─── Notification ────────────────────────────────────────
export type NotificationType =
  | "application_received"
  | "status_update"
  | "credits_low"
  | "job_expiring"
  | "credits_added"
  | "welcome";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp;
}

// ─── Job Search Filters ──────────────────────────────────
export interface JobFilters {
  keyword?: string;
  location?: string;
  jobType?: JobType[];
  workMode?: WorkMode[];
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  postedWithin?: "24h" | "week" | "month";
}

export type SortOption = "newest" | "salary-high" | "salary-low" | "most-applicants";
