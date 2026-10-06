import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { EmailJobQueue } from './email-job-queue.js';

@Injectable()
export class BullmqEmailJobQueue extends EmailJobQueue {
  constructor(@InjectQueue('email') private readonly queue: Queue) {
    super();
  }

  async enqueueOrderConfirmation(orderId: string): Promise<void> {
    // Deterministic jobId: adding the same job twice is ignored by BullMQ, a
    // second layer of de-duplication on top of the database check. (BullMQ
    // rejects custom job ids containing ':', so this uses a hyphen.)
    await this.queue.add(
      'send-order-confirmation',
      { orderId },
      { jobId: `email-${orderId}` },
    );
  }
}
