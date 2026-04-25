export const siteConfig = {
  name: "TalentWick",
  description: "Connect with top talent and find your dream job. TalentWick is the modern job portal that makes hiring simple.",
  url: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000",
  adminEmail: "talentwick@gmail.com",
  maxResumeSize: 5 * 1024 * 1024,   // 5MB
  maxImageSize: 2 * 1024 * 1024,     // 2MB
  jobExpiryDays: 30,
  maxApplicationsPerDay: 50,
  allowedResumeTypes: ["application/pdf"],
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
};
