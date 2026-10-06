import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import {
  PaymentProvider,
  type CreateProviderOrderInput,
  type ProviderOrder,
} from './payment-provider.js';

@Injectable()
export class RazorpayProvider extends PaymentProvider {
  private readonly client: Razorpay;
  private readonly webhookSecret: string;

  constructor(config: ConfigService) {
    super();
    const keyId = config.get<string>('RAZORPAY_KEY_ID') ?? '';
    const keySecret = config.get<string>('RAZORPAY_KEY_SECRET') ?? '';
    const webhookSecret =
      config.get<string>('RAZORPAY_WEBHOOK_SECRET') ?? '';
    // Fail fast at boot: charging without credentials must never fail
    // silently later at checkout time.
    if (!keyId || !keySecret || !webhookSecret) {
      throw new Error(
        'Missing Razorpay configuration: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET are required',
      );
    }
    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    this.webhookSecret = webhookSecret;
  }

  async createOrder(
    input: CreateProviderOrderInput,
  ): Promise<ProviderOrder> {
    const order = await this.client.orders.create({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      notes: {},
    });
    return { providerOrderId: order.id };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest();
    const actual = Buffer.from(signature, 'hex');
    // timingSafeEqual throws on unequal lengths; reject those first.
    if (expected.length !== actual.length) {
      return false;
    }
    return timingSafeEqual(expected, actual);
  }
}
