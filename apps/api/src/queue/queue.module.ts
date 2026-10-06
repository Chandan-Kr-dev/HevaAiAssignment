import { Module } from '@nestjs/common';
import { EmailJobQueue } from './email-job-queue.js';
import { LoggingEmailJobQueue } from './logging-email-job-queue.js';

@Module({
  providers: [{ provide: EmailJobQueue, useClass: LoggingEmailJobQueue }],
  exports: [EmailJobQueue],
})
export class QueueModule {}
