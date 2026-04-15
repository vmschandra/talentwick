import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms of Service" };

const EFFECTIVE_DATE = "April 15, 2025";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {/* Header */}
      <div className="mb-10 border-b pb-8">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the TalentWick
          platform, website, and services (collectively, the &quot;Platform&quot;) operated by TalentWick
          (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By registering for or using the Platform you agree to these
          Terms. If you do not agree, do not access or use the Platform.
        </p>
      </div>

      <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">1. Eligibility</h2>
          <p>
            You must be at least 16 years of age to use TalentWick. By creating an account you
            represent that you meet this requirement and that all information you provide is
            accurate, current, and complete. TalentWick is intended for professional employment
            purposes only.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">2. Account Registration and Security</h2>
          <p>
            You must register for an account to access most features of the Platform. You are
            responsible for maintaining the confidentiality of your login credentials and for all
            activity that occurs under your account. You agree to notify us immediately at{" "}
            <a href={`mailto:${siteConfig.adminEmail}`} className="text-primary hover:underline">
              {siteConfig.adminEmail}
            </a>{" "}
            of any suspected unauthorised access to your account. TalentWick is not liable for
            any loss arising from your failure to protect your credentials.
          </p>
          <p className="mt-3">
            You may not create more than one account per individual or organisation without our
            prior written consent, and you may not transfer your account to another party.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">3. Candidate Accounts</h2>
          <p>
            Candidates may create a profile, upload a resume, browse job listings, and apply for
            positions at no charge. By submitting an application you authorise TalentWick to share
            your profile, resume, and application materials with the relevant recruiting company
            solely for the purpose of evaluating your candidacy.
          </p>
          <p className="mt-3">
            You are responsible for the accuracy of your profile and application information.
            Misrepresenting your qualifications, experience, or identity may result in immediate
            account termination.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">4. Recruiter Accounts and Job Postings</h2>
          <p>
            Recruiters must represent a legitimate business and may post job opportunities using a
            credit-based system. Credits are purchased in advance. Each job posting consumes one
            credit at the time of publication. Recruiters are solely responsible for the content
            and accuracy of their job listings.
          </p>
          <p className="mt-3">
            Job postings must describe genuine, currently available positions. You may not post
            listings that are misleading, discriminatory, illegal, or designed to collect candidate
            data without legitimate hiring intent. TalentWick reserves the right to remove any
            posting that violates these Terms without notice or refund.
          </p>
          <p className="mt-3">
            Job postings are active for 30 days from publication unless removed earlier. Expired
            listings are archived and no longer visible to candidates.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">5. Credits and Payments</h2>
          <p>
            Credits are purchased through the Platform and deducted when a job listing is
            published. All payments are processed securely. Prices are listed in United States
            dollars (USD) unless stated otherwise.
          </p>
          <p className="mt-3">
            Credits do not expire as long as your account remains active. Credits are
            non-transferable between accounts. Please refer to our{" "}
            <Link href="/refund" className="text-primary hover:underline">
              Refund Policy
            </Link>{" "}
            for details on unused credit refunds.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">6. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>Post false, misleading, or fraudulent job listings or profile information</li>
            <li>Scrape, crawl, or systematically extract data from the Platform</li>
            <li>Attempt to gain unauthorised access to any part of the Platform or its infrastructure</li>
            <li>Use the Platform to send spam, bulk unsolicited messages, or phishing communications</li>
            <li>Harass, threaten, or discriminate against other users</li>
            <li>Upload or transmit malware, viruses, or any malicious code</li>
            <li>Use automated tools to create accounts, post jobs, or submit applications</li>
            <li>Circumvent or disable any security or access control feature of the Platform</li>
            <li>Violate any applicable local, national, or international law or regulation</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">7. Content Ownership and Licence</h2>
          <p>
            You retain ownership of all content you submit to the Platform, including your
            profile, resume, job listings, and messages. By submitting content, you grant
            TalentWick a worldwide, non-exclusive, royalty-free licence to store, display,
            and transmit that content solely as required to operate the Platform and deliver our
            services to you.
          </p>
          <p className="mt-3">
            All other content on the Platform — including our logo, design, copy, and software —
            is owned by TalentWick and protected by applicable intellectual property laws. You may
            not reproduce, distribute, or create derivative works without our express written
            permission.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">8. Privacy</h2>
          <p>
            Your use of the Platform is also governed by our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference. By using TalentWick you consent
            to the data practices described in that Policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">9. Third-Party Services</h2>
          <p>
            The Platform integrates with third-party services for authentication, file storage, and
            payment processing. Your use of those services is subject to their respective terms
            and privacy policies. TalentWick is not responsible for the practices or content of
            any third-party service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">10. Disclaimers</h2>
          <p>
            THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
            EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, OR NON-INFRINGEMENT. TALENTWICK DOES NOT WARRANT THAT THE PLATFORM WILL BE
            UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES.
          </p>
          <p className="mt-3">
            TalentWick does not guarantee employment outcomes. We are a platform facilitating
            connections between candidates and employers — the hiring decision rests entirely with
            the employer.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">11. Limitation of Liability</h2>
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, TALENTWICK AND ITS OFFICERS, DIRECTORS,
            EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR
            GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM, EVEN IF
            ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
          <p className="mt-3">
            IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU PAID TO TALENTWICK
            IN THE TWELVE MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless TalentWick and its affiliates, officers,
            directors, employees, and agents from any claims, damages, losses, or expenses
            (including reasonable legal fees) arising from your use of the Platform, your violation
            of these Terms, or your infringement of any third-party right.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">13. Termination</h2>
          <p>
            You may close your account at any time by contacting us. We reserve the right to
            suspend or terminate your account immediately and without notice if we believe you have
            violated these Terms, engaged in fraudulent activity, or pose a risk to the Platform
            or other users. Upon termination, your right to use the Platform ceases and we may
            delete your data in accordance with our Privacy Policy and applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">14. Modifications to the Terms</h2>
          <p>
            We may update these Terms at any time. When we make material changes we will update
            the effective date above and notify you via the email address associated with your
            account. Your continued use of the Platform after the updated Terms take effect
            constitutes your acceptance of those changes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">15. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by and construed in accordance with applicable law. Any
            dispute arising from these Terms or your use of the Platform shall first be submitted
            to good-faith negotiation. If unresolved within 30 days, disputes shall be resolved
            by binding arbitration or the courts of competent jurisdiction, as applicable.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">16. Contact Us</h2>
          <p>
            For questions about these Terms of Service, please contact us at:
          </p>
          <div className="mt-3 rounded-md border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">TalentWick</p>
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
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        <Link href="/refund" className="text-primary hover:underline">Refund Policy</Link>
        <Link href="/about" className="text-primary hover:underline">About TalentWick</Link>
      </div>
    </div>
  );
}
