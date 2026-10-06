import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  ServiceUnavailableException,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { WebhooksService } from './webhooks.service.js';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  // PUBLIC: Razorpay cannot present our session cookie. Authentication is the
  // HMAC signature over the raw body, checked inside the service.
  @Post('razorpay')
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string | undefined,
    @Headers('x-razorpay-event-id') eventId: string | undefined,
  ): Promise<{ received: boolean; result: string }> {
    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Missing request body');
    }
    const outcome = await this.webhooks.handle(rawBody, signature, eventId);
    if (outcome.result === 'unmatched') {
      // Order not visible yet (created after delivery started): 503 tells
      // Razorpay to retry later; the UNMATCHED row is already committed.
      throw new ServiceUnavailableException('Order not found yet, will retry');
    }
    return { received: true, result: outcome.result };
  }
}
