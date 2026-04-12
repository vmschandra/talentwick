export interface ServiceStatus {
  configured: boolean;
  missing: string[];
}

export interface ConfigStatus {
  firebase: ServiceStatus;
  payments: ServiceStatus & { provider: string | null };
  email: ServiceStatus & { provider: string | null };
  isFirstRun: boolean;
}

function checkVars(vars: string[]): ServiceStatus {
  const missing = vars.filter((v) => !process.env[v]);
  return { configured: missing.length === 0, missing };
}

export function getConfigStatus(): ConfigStatus {
  const firebase = checkVars([
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  ]);

  const paymentProvider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || null;
  let paymentVars: string[] = [];
  if (paymentProvider === "stripe") {
    paymentVars = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"];
  } else if (paymentProvider === "razorpay") {
    paymentVars = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "NEXT_PUBLIC_RAZORPAY_KEY_ID"];
  } else if (paymentProvider === "paypal") {
    paymentVars = ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "NEXT_PUBLIC_PAYPAL_CLIENT_ID"];
  }
  const paymentCheck = paymentVars.length > 0 ? checkVars(paymentVars) : { configured: true, missing: [] };

  let emailProvider: string | null = null;
  let emailCheck: ServiceStatus = { configured: false, missing: [] };
  if (process.env.RESEND_API_KEY) {
    emailProvider = "resend";
    emailCheck = { configured: true, missing: [] };
  } else if (process.env.SENDGRID_API_KEY) {
    emailProvider = "sendgrid";
    emailCheck = { configured: true, missing: [] };
  } else if (process.env.SMTP_HOST) {
    emailProvider = "smtp";
    emailCheck = checkVars(["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"]);
  }

  return {
    firebase,
    payments: { ...paymentCheck, provider: paymentProvider || "manual" },
    email: { ...emailCheck, provider: emailProvider },
    isFirstRun: !firebase.configured,
  };
}
