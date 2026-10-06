import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module.js';
import { QueueModule } from '../queue/queue.module.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';

@Module({
  imports: [PaymentsModule, QueueModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
