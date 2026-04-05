export const siteConfig = {
  name: "HireFlow",
  description: "Connect with top talent and find your dream job. HireFlow is the modern job portal that makes hiring simple.",
  url: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000",
  adminEmail: "admin@hireflow.com",
  maxResumeSize: 5 * 1024 * 1024,   // 5MB
  maxImageSize: 2 * 1024 * 1024,     // 2MB
  jobExpiryDays: 30,
  maxApplicationsPerDay: 50,
  allowedResumeTypes: ["application/pdf"],
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
};
