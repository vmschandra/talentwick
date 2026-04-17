declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeInstance {
    checkout(options: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_modal" }): Promise<void>;
  }

  export interface LoadOptions {
    mode: "sandbox" | "production";
  }

  export function load(options: LoadOptions): Promise<CashfreeInstance>;
}
