const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://talentwick.com";

const wrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#1e3a5f;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">TalentWick</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
              You're receiving this email because you have an account on
              <a href="${BASE_URL}" style="color:#1e3a5f;text-decoration:none;">TalentWick</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const btn = (text: string, href: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#1e3a5f;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">${text}</a>`;

const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${text}</h1>`;

const p = (text: string) =>
  `<p style="margin:12px 0 0;font-size:15px;color:#374151;line-height:1.6;">${text}</p>`;

// ── Welcome ───────────────────────────────────────────────────────────────────

export function welcomeEmail(displayName: string, role: "candidate" | "recruiter") {
  const dashboardPath = role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
  const body = `
    ${h1(`Welcome to TalentWick, ${displayName}!`)}
    ${p(role === "recruiter"
      ? "Your recruiter account is ready. Post your first job and start finding great candidates."
      : "Your candidate profile is ready. Start browsing thousands of jobs and apply in seconds."
    )}
    ${btn("Go to Dashboard", `${BASE_URL}${dashboardPath}`)}
  `;
  return { subject: "Welcome to TalentWick", html: wrapper(body) };
}

// ── Application received (to recruiter) ───────────────────────────────────────

export function applicationReceivedEmail(
  recruiterName: string,
  candidateName: string,
  jobTitle: string,
  jobId: string
) {
  const body = `
    ${h1("New Application Received")}
    ${p(`<strong>${candidateName}</strong> has applied for <strong>${jobTitle}</strong>.`)}
    ${p("Log in to review their profile, resume, and cover letter.")}
    ${btn("Review Application", `${BASE_URL}/recruiter/my-jobs/${jobId}/applicants`)}
  `;
  return {
    subject: `New application for ${jobTitle}`,
    html: wrapper(body),
  };
}

// ── Application status update (to candidate) ──────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  reviewed: "Your application has been reviewed",
  shortlisted: "You've been shortlisted! 🎉",
  interview: "You've been invited for an interview! 🎉",
  offered: "Congratulations — you've received an offer! 🎊",
  rejected: "Application update",
  withdrawn: "Application withdrawn",
};

const STATUS_MESSAGES: Record<string, string> = {
  reviewed: "The recruiter has reviewed your application. Stay tuned for further updates.",
  shortlisted: "Great news! You've been shortlisted for this role. The recruiter will be in touch soon.",
  interview: "The recruiter would like to schedule an interview with you. Check your messages for details.",
  offered: "You have received a job offer. Log in to view the full details.",
  rejected: "After careful consideration, the recruiter has decided to move forward with other candidates. Don't be discouraged — keep applying!",
  withdrawn: "Your application has been marked as withdrawn.",
};

export function applicationStatusEmail(
  candidateName: string,
  jobTitle: string,
  companyName: string,
  status: string
) {
  const label = STATUS_LABELS[status] || "Your application status has been updated";
  const message = STATUS_MESSAGES[status] || "Log in to view your latest application status.";
  const body = `
    ${h1(label)}
    ${p(`Role: <strong>${jobTitle}</strong> at <strong>${companyName}</strong>`)}
    ${p(message)}
    ${btn("View Application", `${BASE_URL}/candidate/applications`)}
  `;
  return { subject: `${label} — ${jobTitle}`, html: wrapper(body) };
}

// ── Credits added (to recruiter) ──────────────────────────────────────────────

export function creditsAddedEmail(
  recruiterName: string,
  credits: number,
  planName: string
) {
  const body = `
    ${h1("Job Posting Credits Added")}
    ${p(`Your account has been credited with <strong>${credits} job posting credit${credits > 1 ? "s" : ""}</strong> (${planName} plan).`)}
    ${p("You can start posting jobs right away.")}
    ${btn("Post a Job", `${BASE_URL}/recruiter/post-job`)}
  `;
  return {
    subject: `${credits} credit${credits > 1 ? "s" : ""} added to your TalentWick account`,
    html: wrapper(body),
  };
}
