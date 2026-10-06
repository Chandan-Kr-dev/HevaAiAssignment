import { Module } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.js';
import { RazorpayProvider } from './razorpay.provider.js';

@Module({
  providers: [{ provide: PaymentProvider, useClass: RazorpayProvider }],
  exports: [PaymentProvider],
})
export class PaymentsModule {}
