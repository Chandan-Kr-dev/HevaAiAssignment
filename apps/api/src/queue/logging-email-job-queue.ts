import { Injectable, Logger } from '@nestjs/common';
import { EmailJobQueue } from './email-job-queue.js';

// Temporary stand-in until BullMQ is wired: logs instead of enqueueing so a
// confirmation can never silently disappear during development.
@Injectable()
export class LoggingEmailJobQueue extends EmailJobQueue {
  private readonly logger = new Logger(LoggingEmailJobQueue.name);

  async enqueueOrderConfirmation(orderId: string): Promise<void> {
    this.logger.log(
      `enqueueOrderConfirmation orderId=${orderId} (stub: queue not wired yet)`,
    );
  }
}
