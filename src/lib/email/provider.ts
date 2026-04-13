interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(_payload: EmailPayload): Promise<void> {
  // No email provider configured. Wire up Resend, SendGrid, or SMTP
  // via the RESEND_API_KEY / SENDGRID_API_KEY / SMTP_* env vars.
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Welcome to TalentWick!",
    html: `<h1>Welcome, ${name}!</h1><p>Your TalentWick account is ready. Complete your profile to get started.</p>`,
  });
}

export async function sendApplicationConfirmation(
  email: string,
  candidateName: string,
  jobTitle: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Application Submitted — ${jobTitle}`,
    html: `<p>Hi ${candidateName},</p><p>Your application for <strong>${jobTitle}</strong> has been submitted successfully.</p>`,
  });
}

export async function sendNewApplicantAlert(
  recruiterEmail: string,
  candidateName: string,
  jobTitle: string
): Promise<void> {
  await sendEmail({
    to: recruiterEmail,
    subject: `New Applicant for ${jobTitle}`,
    html: `<p>${candidateName} has applied to your job posting: <strong>${jobTitle}</strong>.</p>`,
  });
}

export async function sendStatusChangeEmail(
  email: string,
  candidateName: string,
  jobTitle: string,
  newStatus: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Application Update — ${jobTitle}`,
    html: `<p>Hi ${candidateName},</p><p>Your application for <strong>${jobTitle}</strong> has been updated to: <strong>${newStatus}</strong>.</p>`,
  });
}
