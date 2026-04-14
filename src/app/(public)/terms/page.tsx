export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TalentWick, you agree to be bound by these Terms of Service. If you do not agree to
            these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">2. Use of the Platform</h2>
          <p>
            TalentWick provides a job-matching platform connecting candidates and recruiters. You agree to use the
            platform only for lawful purposes and in accordance with these terms. You are responsible for maintaining
            the confidentiality of your account credentials.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">3. User Accounts</h2>
          <p>
            You must provide accurate and complete information when creating an account. You are solely responsible for
            all activity that occurs under your account. Notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">4. Job Postings and Applications</h2>
          <p>
            Recruiters are responsible for the accuracy of job postings. Candidates are responsible for the accuracy
            of their applications and profile information. TalentWick does not guarantee employment outcomes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">5. Payments and Credits</h2>
          <p>
            Job posting credits are non-refundable once used. Unused credits may be subject to expiration as outlined
            in the applicable plan. All prices are listed in USD unless otherwise stated.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">6. Prohibited Conduct</h2>
          <p>You agree not to: post false or misleading job listings; scrape or harvest data from the platform;
            attempt to gain unauthorized access to any part of the platform; use the platform to send spam or
            unsolicited communications; or violate any applicable laws or regulations.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">7. Intellectual Property</h2>
          <p>
            All content, features, and functionality of TalentWick are owned by TalentWick and are protected by
            applicable intellectual property laws. You retain ownership of content you submit to the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
          <p>
            TalentWick is provided &quot;as is&quot; without warranties of any kind. To the fullest extent permitted by law,
            TalentWick shall not be liable for any indirect, incidental, or consequential damages arising from your
            use of the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the platform after changes
            constitutes acceptance of the updated terms. We will notify users of material changes via email.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">10. Contact</h2>
          <p>
            For questions about these Terms of Service, please contact us through the platform.
          </p>
        </section>
      </div>
    </div>
  );
}
