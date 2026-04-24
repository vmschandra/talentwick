import { Resend } from "resend";

let _client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_client) _client = new Resend(process.env.RESEND_API_KEY);
  return _client;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "TalentWick <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const client = getClient();
  if (!client) {
    // Fallback: log to console when Resend is not configured.
    console.log(`[Email fallback] To: ${to} | Subject: ${subject}`);
    return;
  }
  const { error } = await client.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[Resend error]", error);
  }
}
