import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

const EFFECTIVE_DATE = "April 15, 2025";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {/* Header */}
      <div className="mb-10 border-b pb-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          TalentWick (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your personal
          information. This Privacy Policy explains how we collect, use, store, and share your
          data when you use the TalentWick platform (&quot;Platform&quot;). By using the Platform you
          agree to the practices described in this Policy.
        </p>
      </div>

      <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">1. Information We Collect</h2>
          <p className="font-medium text-foreground/70">Information you provide directly:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>Account details: name, email address, password (stored in hashed form)</li>
            <li>Candidate profile: headline, summary, skills, work history, education, expected salary, preferred job type, and open-to-work status</li>
            <li>Resume and documents: PDF resume and any files you upload</li>
            <li>Recruiter/company profile: company name, industry, size, website, description, and your designation</li>
            <li>Communications: messages you send through the in-platform messaging system</li>
            <li>Payment information: billing details processed through our payment provider (we do not store raw card numbers)</li>
          </ul>
          <p className="mt-4 font-medium text-foreground/70">Information collected automatically:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>Usage data: pages visited, features used, search queries, and interaction logs</li>
            <li>Device and browser information: IP address, browser type, operating system, and device identifiers</li>
            <li>Session data: authentication tokens stored in secure, HTTP-only cookies</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>Create and manage your account and authenticate you securely</li>
            <li>Match candidates with relevant job opportunities based on skills, location, and preferences</li>
            <li>Display candidate profiles and resumes to recruiters when an application is submitted</li>
            <li>Enable direct messaging between candidates and recruiters</li>
            <li>Send transactional notifications (application updates, new messages, credit alerts)</li>
            <li>Process payments and manage job-posting credits</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Improve and develop Platform features using aggregated, anonymised analytics</li>
            <li>Comply with applicable legal obligations</li>
          </ul>
          <p className="mt-3">
            We do <strong className="text-foreground">not</strong> sell, rent, or trade your personal
            information to third parties for marketing or advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">3. How We Share Your Information</h2>
          <p className="font-medium text-foreground/70">With recruiters and employers:</p>
          <p className="mt-1.5">
            When you apply for a job, your profile, resume, and cover letter are shared with the
            hiring company for the sole purpose of evaluating your application. Your contact
            details are only shared with a recruiter when you initiate a message or application.
          </p>
          <p className="mt-4 font-medium text-foreground/70">With service providers:</p>
          <p className="mt-1.5">
            We share data with trusted third-party providers that help us operate the Platform,
            including cloud infrastructure (Google Firebase / Google Cloud), payment processing,
            and email delivery. These providers are bound by confidentiality obligations and may
            only use your data to perform services on our behalf.
          </p>
          <p className="mt-4 font-medium text-foreground/70">For legal reasons:</p>
          <p className="mt-1.5">
            We may disclose your information if required to do so by law, court order, or
            governmental authority, or if we believe disclosure is necessary to protect the rights,
            safety, or property of TalentWick, our users, or the public.
          </p>
          <p className="mt-4 font-medium text-foreground/70">Business transfers:</p>
          <p className="mt-1.5">
            In the event of a merger, acquisition, or sale of TalentWick, your data may be
            transferred to the successor entity. We will notify you before your data is transferred
            and subject to a different privacy policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">4. Data Storage and Security</h2>
          <p>
            Your data is stored on Google Firebase (Google Cloud infrastructure), with servers
            located in geographically distributed data centres. We implement industry-standard
            security measures including:
          </p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>Encryption in transit (TLS/HTTPS) for all data exchanged with the Platform</li>
            <li>Encryption at rest for stored data via Google Cloud&apos;s default encryption</li>
            <li>Firebase Security Rules that enforce server-side access control on all database reads and writes</li>
            <li>Least-privilege service account permissions for all backend operations</li>
          </ul>
          <p className="mt-3">
            No security measure is 100% foolproof. In the event of a data breach that is likely
            to result in a risk to your rights and freedoms, we will notify you in accordance with
            applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">5. Cookies and Session Tokens</h2>
          <p>
            We use session cookies solely to maintain your authenticated state. These are strictly
            necessary and do not track your browsing activity across other websites.
          </p>
          <p className="mt-3">
            We do <strong className="text-foreground">not</strong> use advertising cookies,
            third-party analytics pixels, or behavioural tracking technologies. You can disable
            cookies in your browser settings, but doing so will prevent you from staying logged in.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">6. Candidate Profile Visibility</h2>
          <p>
            When your profile is set to <strong className="text-foreground">&quot;Open to Work&quot;</strong>,
            it becomes discoverable to registered recruiters using the Browse Candidates feature.
            Recruiters can see your name, headline, skills, location, experience summary, and
            preferred job type. Your full resume is only accessible to a recruiter when you
            explicitly submit an application or share it via message.
          </p>
          <p className="mt-3">
            You can update your &quot;Open to Work&quot; status or remove your profile from recruiter search
            at any time through your profile settings.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">7. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to
            provide our services. When you delete your account:
          </p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>Your profile and personal information are permanently deleted within 30 days</li>
            <li>Uploaded files (resumes, images) are removed from storage within 30 days</li>
            <li>Transaction records may be retained for up to 7 years to comply with financial and tax regulations</li>
            <li>Anonymised aggregate analytics data may be retained indefinitely</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">8. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li><strong className="text-foreground">Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong className="text-foreground">Rectification</strong> — correct inaccurate or incomplete data</li>
            <li><strong className="text-foreground">Erasure</strong> — request deletion of your personal data</li>
            <li><strong className="text-foreground">Portability</strong> — receive your data in a structured, machine-readable format</li>
            <li><strong className="text-foreground">Objection</strong> — object to processing of your data for certain purposes</li>
            <li><strong className="text-foreground">Withdrawal of consent</strong> — where processing is based on consent, withdraw it at any time</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{" "}
            <a href={`mailto:${siteConfig.adminEmail}`} className="text-primary hover:underline">
              {siteConfig.adminEmail}
            </a>
            . We will respond within 30 days. We may need to verify your identity before
            fulfilling your request.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">9. Children&apos;s Privacy</h2>
          <p>
            TalentWick is not directed at persons under the age of 16. We do not knowingly
            collect or process personal data from anyone under 16. If you believe we have
            inadvertently collected such data, please contact us immediately and we will delete
            it promptly.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">10. International Data Transfers</h2>
          <p>
            TalentWick operates globally and your data may be stored or processed in countries
            other than your own. We rely on Google Cloud&apos;s standard contractual clauses and
            other lawful transfer mechanisms to ensure adequate protection of your data when it
            is transferred internationally.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make significant changes
            we will update the effective date above and notify you via email at least 14 days
            before the changes take effect. We encourage you to review this Policy periodically.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">12. Contact Us</h2>
          <p>
            For privacy-related questions, data requests, or concerns about how we handle your
            personal information, please contact:
          </p>
          <div className="mt-3 rounded-md border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">TalentWick — Privacy Team</p>
            <p className="mt-0.5">
              Email:{" "}
              <a href={`mailto:${siteConfig.adminEmail}`} className="text-primary hover:underline">
                {siteConfig.adminEmail}
              </a>
            </p>
          </div>
        </section>

      </div>

      {/* Related links */}
      <div className="mt-12 border-t pt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        <Link href="/refund" className="text-primary hover:underline">Refund Policy</Link>
        <Link href="/about" className="text-primary hover:underline">About TalentWick</Link>
      </div>
    </div>
  );
}
