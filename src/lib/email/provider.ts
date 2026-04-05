interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  // No email provider configured — log to console
  console.log("[Email]", payload.to, payload.subject);
  console.log("[Email Body]", payload.html.slice(0, 200));
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
