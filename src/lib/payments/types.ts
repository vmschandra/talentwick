export interface PaymentPlan {
  id: "starter" | "growth" | "enterprise";
  name: string;
  price: number;
  credits: number;
  currency: string;
}

export interface CreateCheckoutParams {
  plan: PaymentPlan;
  recruiterId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

export interface WebhookEvent {
  type: "payment.success" | "payment.failed";
  sessionId: string;
  recruiterId: string;
  plan: string;
  credits: number;
  amount: number;
  gatewayTransactionId: string;
  rawEvent: unknown;
}

export interface PaymentProvider {
  name: string;
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult>;
  verifyWebhookSignature(request: Request): Promise<WebhookEvent>;
  isConfigured(): boolean;
}
