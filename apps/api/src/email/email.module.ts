import { Module } from '@nestjs/common';
import { EmailProvider } from './email-provider.js';
import { MailgunProvider } from './mailgun.provider.js';

@Module({
  providers: [{ provide: EmailProvider, useClass: MailgunProvider }],
  exports: [EmailProvider],
})
export class EmailModule {}
