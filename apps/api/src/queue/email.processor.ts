import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import type { Prisma } from '@prisma/client';
import { EmailProvider } from '../email/email-provider.js';
import {
  orderConfirmedHtml,
  orderConfirmedSubject,
  orderConfirmedText,
} from '../email/order-confirmed.template.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Processor('email')
@Injectable()
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailProvider,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string }>): Promise<void> {
    const { orderId } = job.data;
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, product: true },
    });
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    // IDEMPOTENCY: a redelivered job for an already-mailed order is a no-op.
    if (order.confirmationEmailSentAt !== null) {
      this.logger.log(`Confirmation already sent orderId=${orderId}`);
      return;
    }
    if (order.status !== 'PAID') {
      throw new Error(`Order not paid: ${orderId}`);
    }
    const rupees = (order.amountPaise / 100).toFixed(2);
    // The CTA needs the public origin of the status page; WEB_URL is the
    // established browser-facing base (same value auth redirects use).
    const webUrl =
      this.config.get<string>('WEB_URL') ?? 'http://localhost:3001';
    const templateData = {
      customerName: order.user.name,
      productName: order.product.name,
      productImageUrl: order.product.imageUrl,
      amountInr: rupees,
      orderId: order.id,
      statusUrl: `${webUrl}/orders/${order.id}`,
    };
    const subject = orderConfirmedSubject();
    const text = orderConfirmedText(templateData);
    const html = orderConfirmedHtml(templateData);
    await this.email.send({
      to: order.user.email,
      subject,
      text,
      html,
    });
    await this.prisma.order.update({
      where: { id: order.id },
      data: { confirmationEmailSentAt: new Date() },
    });
    // At-least-once gap (accepted, documented): if the worker dies between the
    // send above and this stamp, the retry sends a second email. Fully closing
    // it needs provider-side idempotency, which Mailgun does not offer.
    this.logger.log(`Confirmation sent orderId=${orderId}`);
  }

  // Fires on EVERY failed attempt; only the terminal one is recorded, since
  // retries that eventually succeed need no trace. The job itself stays in
  // Redis (removeOnFail: false) regardless.
  @OnWorkerEvent('failed')
  async onFailed(job: Job<{ orderId: string }>, error: Error): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) {
      return;
    }
    this.logger.error(
      `Email job permanently failed jobId=${job.id} attemptsMade=${job.attemptsMade} reason=${error.message}`,
    );
    try {
      await this.prisma.failedJob.create({
        data: {
          queue: 'email',
          jobId: job.id ?? 'unknown',
          name: job.name,
          data: (job.data ?? {}) as Prisma.InputJsonValue,
          failedReason: error.message,
          attemptsMade: job.attemptsMade,
        },
      });
    } catch (dbError) {
      // Recording must never crash the worker; the failed job stays in Redis.
      this.logger.error(
        `Failed to record failed job jobId=${job.id}: ${dbError instanceof Error ? dbError.message : 'unknown error'}`,
      );
    }
  }
}
