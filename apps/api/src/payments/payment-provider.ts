export type CreateProviderOrderInput = {
  amountPaise: number;
  currency: string;
  receipt: string;
};

export type ProviderOrder = {
  providerOrderId: string;
};

// Abstract class (not interface) so it doubles as the Nest DI token: tests
// and future providers swap the implementation without touching callers.
export abstract class PaymentProvider {
  abstract createOrder(
    input: CreateProviderOrderInput,
  ): Promise<ProviderOrder>;
  abstract verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
  ): boolean;
}
