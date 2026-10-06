import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { EmailModule } from '../email/email.module.js';
import { BullmqEmailJobQueue } from './bullmq-email-job-queue.js';
import { EmailProcessor } from './email.processor.js';
import { EmailJobQueue } from './email-job-queue.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // BullMQ 6 treats ioredis as an optional peer that cannot be loaded
        // implicitly under native ESM: pass an already-constructed client.
        // maxRetriesPerRequest: null is mandatory for BullMQ's blocking calls.
        const connection = new Redis(
          config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
          { maxRetriesPerRequest: null },
        );
        return { connection };
      },
    }),
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        // removeOnFail false so failed jobs stay in Redis for inspection.
        removeOnFail: false,
      },
    }),
    EmailModule,
  ],
  providers: [
    { provide: EmailJobQueue, useClass: BullmqEmailJobQueue },
    EmailProcessor,
  ],
  exports: [EmailJobQueue],
})
export class QueueModule {}
