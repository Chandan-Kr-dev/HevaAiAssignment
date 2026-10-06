import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PaymentProvider } from '../payments/payment-provider.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailJobQueue } from '../queue/email-job-queue.js';

export type WebhookOutcome =
  | { result: 'processed'; orderId: string; becamePaid: boolean }
  | { result: 'duplicate' }
  | { result: 'ignored' }
  | { result: 'unmatched' }
  | { result: 'amount_mismatch' };

// Safe navigation over the untrusted webhook JSON without `any`.
function getPath(root: unknown, path: string[]): unknown {
  let current = root;
  for (const key of path) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function getString(root: unknown, path: string[]): string | undefined {
  const value = getPath(root, path);
  return typeof value === 'string' ? value : undefined;
}

function getNumber(root: unknown, path: string[]): number | undefined {
  const value = getPath(root, path);
  return typeof value === 'number' ? value : undefined;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentProvider,
    private readonly emailQueue: EmailJobQueue,
  ) {}

  async handle(
    rawBody: Buffer,
    signature: string | undefined,
    eventId: string | undefined,
  ): Promise<WebhookOutcome> {
    // Gate 1: authenticate BEFORE touching the database or trusting any byte.
    if (!signature || !eventId) {
      this.logger.warn('Rejected webhook: missing signature or event id');
      throw new BadRequestException('Missing webhook signature or event id');
    }
    if (!this.payments.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn(`Rejected webhook with invalid signature eventId=${eventId}`);
      throw new BadRequestException('Invalid signature');
    }
    // Gate 2: parse only after the signature proves these exact bytes are Razorpay's.
    let body: unknown;
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      this.logger.warn(`Rejected webhook with unparsable JSON eventId=${eventId}`);
      throw new BadRequestException('Invalid JSON payload');
    }
    const eventType = getString(body, ['event']);
    if (!eventType) {
      throw new BadRequestException('Missing event type');
    }

    const outcome = await this.prisma.$transaction((tx) =>
      this.processEvent(tx, eventId, eventType, body),
    );

    // Post-commit only: enqueueing inside the tx could run the worker before
    // the PAID row is visible (or after a rollback).
    if (outcome.result === 'processed' && outcome.becamePaid) {
      await this.emailQueue.enqueueOrderConfirmation(outcome.orderId);
    }
    return outcome;
  }

  private async processEvent(
    tx: Prisma.TransactionClient,
    eventId: string,
    eventType: string,
    body: unknown,
  ): Promise<WebhookOutcome> {
    // Re-serialized for STORAGE only; the signature was already verified
    // against the untouched raw bytes, so formatting drift is harmless here.
    const payloadJson = JSON.stringify(body);
    // Raw INSERT (not Prisma create): ON CONFLICT DO NOTHING gives an
    // affected-row count, and a failed statement would abort the whole tx, so
    // try/catch on unique violations is deliberately NOT used here.
    const inserted = await tx.$executeRaw`
      INSERT INTO webhook_events (id, provider, provider_event_id, event_type, payload, status, received_at)
      VALUES (gen_random_uuid(), 'razorpay', ${eventId}, ${eventType}, ${payloadJson}::jsonb, 'IGNORED', now())
      ON CONFLICT (provider, provider_event_id) DO NOTHING`;
    if (inserted === 0) {
      const existing = await tx.webhookEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: 'razorpay',
            providerEventId: eventId,
          },
        },
      });
      if (existing && existing.status !== 'UNMATCHED') {
        this.logger.log(`Duplicate webhook event ignored eventId=${eventId}`);
        return { result: 'duplicate' };
      }
      // UNMATCHED retry: Razorpay re-delivers an event we could not match
      // earlier (order created after the first delivery); process it now.
      this.logger.log(`Retrying previously unmatched event eventId=${eventId}`);
    }

    let providerOrderId: string | undefined;
    let amount: number | undefined;
    let isPaidEvent: boolean;
    if (eventType === 'payment.captured') {
      providerOrderId = getString(body, ['payload', 'payment', 'entity', 'order_id']);
      amount = getNumber(body, ['payload', 'payment', 'entity', 'amount']);
      isPaidEvent = true;
    } else if (eventType === 'order.paid') {
      providerOrderId = getString(body, ['payload', 'order', 'entity', 'id']);
      amount = getNumber(body, ['payload', 'order', 'entity', 'amount_paid']);
      isPaidEvent = true;
    } else if (eventType === 'payment.failed') {
      providerOrderId = getString(body, ['payload', 'payment', 'entity', 'order_id']);
      isPaidEvent = false;
    } else {
      this.logger.log(`Ignoring unsupported event type eventId=${eventId} eventType=${eventType}`);
      return { result: 'ignored' };
    }

    const eventKey = {
      provider_providerEventId: {
        provider: 'razorpay',
        providerEventId: eventId,
      },
    };
    const markEvent = (status: 'PROCESSED' | 'UNMATCHED' | 'IGNORED'): Promise<unknown> =>
      tx.webhookEvent.update({
        where: eventKey,
        data: {
          status,
          processedAt: status === 'UNMATCHED' ? undefined : new Date(),
        },
      });

    if (!providerOrderId) {
      // No order reference to match on: record and let Razorpay retry later.
      await markEvent('UNMATCHED');
      this.logger.warn(`Unmatched webhook event (no order reference) eventId=${eventId}`);
      return { result: 'unmatched' };
    }
    const order = await tx.order.findFirst({
      where: { razorpayOrderId: providerOrderId },
    });
    if (!order) {
      // Commit the UNMATCHED row (never throw inside the tx, or it rolls back).
      await markEvent('UNMATCHED');
      this.logger.warn(`Unmatched webhook event (unknown order) eventId=${eventId}`);
      return { result: 'unmatched' };
    }

    if (isPaidEvent) {
      // Amounts are cross-checked, never trusted: a mismatch means the money
      // does not correspond to our order, so the order stays untouched.
      if (amount === undefined || amount !== order.amountPaise) {
        await markEvent('IGNORED');
        this.logger.error(
          `Amount mismatch eventId=${eventId} orderId=${order.id}`,
        );
        return { result: 'amount_mismatch' };
      }
      // Conditional update: PAID is terminal, so repeats/out-of-order events
      // change nothing; FAILED may become PAID on customer retry.
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: { in: ['PENDING', 'FAILED'] } },
        data: { status: 'PAID', paidAt: new Date() },
      });
      const becamePaid = updated.count === 1;
      await markEvent('PROCESSED');
      this.logger.log(
        `Processed paid event eventId=${eventId} orderId=${order.id} becamePaid=${becamePaid}`,
      );
      return { result: 'processed', orderId: order.id, becamePaid };
    }

    // payment.failed: only PENDING may fail; a PAID order is never reverted.
    await tx.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: { status: 'FAILED' },
    });
    await markEvent('PROCESSED');
    this.logger.log(`Processed failed event eventId=${eventId} orderId=${order.id}`);
    return { result: 'processed', orderId: order.id, becamePaid: false };
  }
}
