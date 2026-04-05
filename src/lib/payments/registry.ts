import { PaymentProvider } from "./types";
import { manualProvider } from "./providers/manual";

const providerName = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "manual";

let _provider: PaymentProvider | undefined;

export async function getPaymentProvider(): Promise<PaymentProvider> {
  if (_provider) return _provider;

  switch (providerName) {
    case "stripe": {
      const { stripeProvider } = await import("./providers/stripe");
      _provider = stripeProvider;
      break;
    }
    case "razorpay": {
      const { razorpayProvider } = await import("./providers/razorpay");
      _provider = razorpayProvider;
      break;
    }
    case "paypal": {
      const { paypalProvider } = await import("./providers/paypal");
      _provider = paypalProvider;
      break;
    }
    default:
      _provider = manualProvider;
  }

  return _provider;
}

export function getPaymentProviderName(): string {
  return providerName;
}

export function isManualMode(): boolean {
  return providerName === "manual" || !providerName;
}
