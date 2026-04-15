import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Refund Policy" };

const EFFECTIVE_DATE = "April 15, 2025";

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {/* Header */}
      <div className="mb-10 border-b pb-8">
        <h1 className="text-4xl font-bold tracking-tight">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          TalentWick operates on a credit-based system for job postings. This Refund Policy
          explains when credits or payments are eligible for a refund. Please read it carefully
          before purchasing credits. By completing a purchase you agree to this Policy.
        </p>
      </div>

      <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">1. How Credits Work</h2>
          <p>
            Credits are a prepaid currency used exclusively to publish job listings on TalentWick.
            One credit is consumed when a job posting transitions from draft to &quot;Active&quot; status and
            becomes publicly visible to candidates. Credits do not expire as long as your account
            remains in good standing.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">2. Non-Refundable Credits</h2>
          <p>
            Credits that have already been <strong className="text-foreground">consumed to publish a job listing</strong> are
            non-refundable. This applies regardless of:
          </p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>The number of applications received during the listing period</li>
            <li>Whether the position was filled, cancelled, or put on hold after publication</li>
            <li>The listing being closed, paused, or expired before the 30-day period ends</li>
            <li>Voluntary removal of the listing by the recruiter</li>
          </ul>
          <p className="mt-3">
            Credits are debited at the point of publication because server costs, search indexing,
            and candidate visibility are incurred from that moment.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">3. Refunds for Unused Credits</h2>
          <p>
            You may request a refund for <strong className="text-foreground">unused credits</strong> (credits
            that have not been applied to any published job listing) within{" "}
            <strong className="text-foreground">14 days</strong> of the original purchase date.
          </p>
          <p className="mt-3">
            To be eligible, your refund request must:
          </p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>Be submitted within 14 calendar days of the purchase date</li>
            <li>Be for credits that have not been partially or fully consumed</li>
            <li>Be made by the account holder who completed the original purchase</li>
          </ul>
          <p className="mt-3">
            Approved refunds are processed to the original payment method and typically appear
            within 5–10 business days, depending on your bank or card issuer.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">4. Partial Refunds</h2>
          <p>
            If you purchased a credit bundle and have used some but not all credits within the
            14-day window, we will issue a pro-rata refund for the unused portion only. Consumed
            credits are not refundable under any circumstances.
          </p>
          <p className="mt-3">
            Example: You purchased a 5-credit bundle and published 2 job listings within the
            14-day window. You may request a refund for the remaining 3 unused credits.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">5. Technical Errors and Duplicate Charges</h2>
          <p>
            If you were charged in error due to a technical fault on TalentWick&apos;s side — for
            example, a duplicate charge, a failed transaction that was still billed, or a system
            error that consumed credits without publishing a listing — you are entitled to a full
            refund of the affected amount. Please report these issues as soon as possible and
            within 30 days of the transaction date.
          </p>
          <p className="mt-3">
            We take billing accuracy seriously and will investigate all reported discrepancies
            promptly.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">6. Account Closure</h2>
          <p>
            If you choose to close your TalentWick recruiter account, you may request a refund
            for any <strong className="text-foreground">unused credits</strong> remaining on your
            account at the time of closure, regardless of the 14-day window, provided the
            account closure is voluntary. Accounts closed due to violations of our{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
            are not eligible for refunds.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">7. Candidate Accounts</h2>
          <p>
            TalentWick is free for job seekers. There are no charges to candidates, and
            therefore no refund policy applies to candidate accounts.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">8. Disputed Charges (Chargebacks)</h2>
          <p>
            We encourage you to contact us directly before initiating a chargeback with your bank
            or card issuer. Chargebacks that are later found to be unjustified may result in
            suspension of your TalentWick account. We are committed to resolving billing disputes
            fairly and quickly.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">9. How to Request a Refund</h2>
          <p>
            To request a refund, email us at{" "}
            <a href={`mailto:${siteConfig.adminEmail}`} className="text-primary hover:underline">
              {siteConfig.adminEmail}
            </a>{" "}
            with the subject line <strong className="text-foreground">&quot;Refund Request&quot;</strong> and
            include:
          </p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>Your registered email address</li>
            <li>The purchase date and amount</li>
            <li>The number of unused credits you are requesting a refund for</li>
            <li>A brief reason for the refund request</li>
          </ul>
          <p className="mt-3">
            We aim to respond to all refund requests within <strong className="text-foreground">2 business days</strong>.
            Approved refunds are processed within <strong className="text-foreground">5–10 business days</strong>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">10. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy at any time. Changes will be posted with an updated
            effective date. Material changes will be communicated to active users via email at
            least 14 days before taking effect. Credits purchased before a policy change are
            subject to the policy in effect at the time of purchase.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">11. Contact Us</h2>
          <p>
            For refund requests or billing questions:
          </p>
          <div className="mt-3 rounded-md border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">TalentWick — Billing Support</p>
            <p className="mt-0.5">
              Email:{" "}
              <a href={`mailto:${siteConfig.adminEmail}`} className="text-primary hover:underline">
                {siteConfig.adminEmail}
              </a>
            </p>
            <p className="mt-0.5 text-muted-foreground">Response time: within 2 business days</p>
          </div>
        </section>

      </div>

      {/* Related links */}
      <div className="mt-12 border-t pt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        <Link href="/about" className="text-primary hover:underline">About TalentWick</Link>
      </div>
    </div>
  );
}
