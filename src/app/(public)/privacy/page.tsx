export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            We collect information you provide directly, including name, email address, phone number, resume, work
            history, and other profile information. We also collect usage data such as pages visited, search queries,
            and interaction logs to improve our service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>We use your information to: operate and improve the TalentWick platform; match candidates with relevant
            job opportunities; send transactional and product notifications; process payments; and comply with legal
            obligations. We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">3. Information Sharing</h2>
          <p>
            When you apply for a job, your profile and resume are shared with the recruiting company. Recruiters can
            view your public profile information. We may share data with service providers who assist in operating
            our platform, subject to confidentiality obligations.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using Firebase (Google Cloud infrastructure). We implement
            industry-standard security measures including encryption in transit and at rest. No method of transmission
            over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">5. Cookies and Tracking</h2>
          <p>
            We use session cookies to maintain your authentication state. We do not use tracking cookies for
            advertising purposes. You can disable cookies in your browser settings, but this may affect platform
            functionality.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">6. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data at any time through your account
            settings. You may request a copy of the data we hold about you. To delete your account and associated
            data, contact us through the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">7. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide our services. If you
            delete your account, we will remove your personal data within 30 days, except where retention is required
            by law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">8. Children&apos;s Privacy</h2>
          <p>
            TalentWick is not intended for users under the age of 16. We do not knowingly collect personal
            information from children. If we become aware of such collection, we will delete the data promptly.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant changes via email or
            a prominent notice on the platform. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">10. Contact</h2>
          <p>
            For privacy-related questions or requests, please contact us through the platform.
          </p>
        </section>
      </div>
    </div>
  );
}
