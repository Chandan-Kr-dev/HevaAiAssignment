// Outbound port for sending emails. The Mailgun implementation lives behind
// this token so tests (and future providers) swap it without touching callers.
export abstract class EmailProvider {
  abstract send(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void>;
}
