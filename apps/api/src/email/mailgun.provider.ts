import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './email-provider.js';

const REQUEST_TIMEOUT_MS = 10000;

@Injectable()
export class MailgunProvider extends EmailProvider {
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly baseUrl: string;
  private readonly from: string;

  constructor(config: ConfigService) {
    super();
    const apiKey = config.get<string>('MAILGUN_API_KEY') ?? '';
    const domain = config.get<string>('MAILGUN_DOMAIN') ?? '';
    // MAILGUN_API_BASE_URL is the established name in our .env files;
    // MAILGUN_API_URL is accepted as a fallback for the same value.
    const baseUrl =
      config.get<string>('MAILGUN_API_BASE_URL') ??
      config.get<string>('MAILGUN_API_URL') ??
      'https://api.mailgun.net';
    const from = config.get<string>('EMAIL_FROM') ?? '';
    if (!apiKey || !domain || !from) {
      throw new Error(
        'Missing Mailgun configuration: MAILGUN_API_KEY, MAILGUN_DOMAIN and EMAIL_FROM are required',
      );
    }
    this.apiKey = apiKey;
    this.domain = domain;
    this.baseUrl = baseUrl;
    this.from = from;
  }

  async send(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    const credentials = Buffer.from(`api:${this.apiKey}`).toString('base64');
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/v3/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          from: this.from,
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // Network/timeout failure: throw so BullMQ retries with backoff.
      // Never include credentials here; error messages stay generic.
      throw new Error(
        `Mailgun request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
    if (!res.ok) {
      // Sandbox domains only deliver to authorized recipients: a 403 here
      // usually means the recipient was never authorized in the dashboard.
      const responseText = await res.text();
      throw new Error(
        `Mailgun request failed with status ${res.status}: ${responseText}`,
      );
    }
  }
}
