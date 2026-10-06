import { describe, expect, it, vi } from 'vitest';
import { EmailProvider } from '../email/email-provider.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { EmailProcessor } from './email.processor.js';

const ORDER_ID = 'order-unit-1';

type FakePrisma = {
  order: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

class FakeEmailProvider extends EmailProvider {
  sent: Array<{ to: string; subject: string; text: string; html: string }> = [];

  async send(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    this.sent.push(input);
  }
}

function paidOrder(sentAt: Date | null) {
  return {
    id: ORDER_ID,
    status: 'PAID',
    amountPaise: 49900,
    confirmationEmailSentAt: sentAt,
    user: { email: 'buyer@example.com', name: 'Buyer' },
    product: { name: 'E2E Product' },
  };
}

function setup(sentAt: Date | null, status = 'PAID') {
  const prisma = {
    order: {
      findUnique: vi.fn(async () => ({ ...paidOrder(sentAt), status })),
      update: vi.fn(async () => ({})),
    },
  };
  const email = new FakeEmailProvider();
  // Plain-object Prisma double: no test DB needed for these unit cases.
  const processor = new EmailProcessor(
    prisma as unknown as PrismaService,
    email,
    // Config double: WEB_URL is only read to build the status-page CTA.
    {
      get: (key: string) =>
        key === 'WEB_URL' ? 'http://localhost:3001' : undefined,
    } as never,
  );
  return { prisma: prisma as unknown as FakePrisma, email, processor };
}

describe('EmailProcessor', () => {
  it('sends one email and sets confirmationEmailSentAt', async () => {
    const { prisma, email, processor } = setup(null);

    await processor.process({ data: { orderId: ORDER_ID } } as {
      data: { orderId: string };
    });

    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.to).toBe('buyer@example.com');
    // Modern template: card markup with a CTA back to the status page.
    expect(email.sent[0]?.html).toContain('Track your order');
    expect(email.sent[0]?.html).toContain(
      `http://localhost:3001/orders/${ORDER_ID}`,
    );
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: ORDER_ID },
      data: { confirmationEmailSentAt: expect.any(Date) },
    });
  });

  it('running process() a second time for the same order sends NO second email', async () => {
    const { email, processor } = setup(new Date());

    await processor.process({ data: { orderId: ORDER_ID } } as {
      data: { orderId: string };
    });

    expect(email.sent).toHaveLength(0);
  });

  it('provider throwing makes process() throw and does not set confirmationEmailSentAt', async () => {
    const { prisma, email, processor } = setup(null);
    email.send = async () => {
      throw new Error('Mailgun down');
    };

    await expect(
      processor.process({ data: { orderId: ORDER_ID } } as {
        data: { orderId: string };
      }),
    ).rejects.toThrow('Mailgun down');
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});
