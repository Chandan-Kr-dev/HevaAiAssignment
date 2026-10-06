import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
// MUST stay the first import: sets test env before app.module.ts evaluates
// ConfigModule.forRoot() (which captures env at import time).
import './test-env.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { EmailJobQueue } from './../src/queue/email-job-queue.js';

// NOTE: this repo runs e2e suites with vitest (not jest): `npm run test:e2e`
// uses vitest.config.e2e.ts. supertest + @nestjs/testing cover the rest.

const TEST_WEBHOOK_SECRET = 'test_secret';
const ORDER_REF = 'order_test_1';
const ORDER_AMOUNT = 49900;

function sign(body: string): string {
  return createHmac('sha256', TEST_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('hex');
}

function capturedPayload(orderRef: string, amount: number): string {
  return JSON.stringify({
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: { entity: { id: 'pay_test1', order_id: orderRef, amount } },
    },
  });
}

function orderPaidPayload(orderRef: string, amount: number): string {
  return JSON.stringify({
    entity: 'event',
    event: 'order.paid',
    payload: {
      payment: { entity: { id: 'pay_test1', order_id: orderRef, amount } },
      order: { entity: { id: orderRef, amount_paid: amount, status: 'paid' } },
    },
  });
}

function failedPayload(orderRef: string): string {
  return JSON.stringify({
    entity: 'event',
    event: 'payment.failed',
    payload: { payment: { entity: { id: 'pay_test1', order_id: orderRef } } },
  });
}

describe('Webhooks (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let queue: { enqueueOrderConfirmation: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    // test-env.ts (imported first) already pointed DATABASE_URL at heva_test
    // and set dummy Razorpay creds; migrate the test schema up to date.
    execSync('npx prisma migrate deploy', {
      env: { ...process.env },
      stdio: 'pipe',
    });

    queue = {
      enqueueOrderConfirmation: vi.fn(async () => undefined),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailJobQueue)
      .useValue(queue)
      .compile();

    // rawBody MUST be enabled here too: without the exact request bytes the
    // HMAC check can never pass and every test would 400.
    app = moduleFixture.createNestApplication({ rawBody: true });
    await app.init();
    prisma = app.get(PrismaService);
  }, 120000);

  beforeEach(async () => {
    // FK-safe wipe, then one user, one product, one PENDING order.
    await prisma.webhookEvent.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    const user = await prisma.user.create({
      data: {
        googleId: 'e2e-google-id',
        email: 'e2e@example.com',
        name: 'E2E User',
      },
    });
    const product = await prisma.product.create({
      data: {
        slug: 'e2e-product',
        name: 'E2E Product',
        description: 'Seeded for webhook e2e tests.',
        pricePaise: ORDER_AMOUNT,
        imageUrl: 'https://picsum.photos/seed/e2e-product/800/800',
      },
    });
    await prisma.order.create({
      data: {
        userId: user.id,
        productId: product.id,
        amountPaise: ORDER_AMOUNT,
        currency: 'INR',
        status: 'PENDING',
        razorpayOrderId: ORDER_REF,
      },
    });
    queue.enqueueOrderConfirmation.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  function postWebhook(eventId: string, body: string, signature: string) {
    // The SAME string is signed and sent: the HMAC covers exact bytes.
    return request(app.getHttpServer())
      .post('/webhooks/razorpay')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', eventId)
      .send(body);
  }

  async function orderStatus(): Promise<string> {
    const order = await prisma.order.findFirstOrThrow({
      where: { razorpayOrderId: ORDER_REF },
    });
    return order.status;
  }

  it('valid signature marks the order paid', async () => {
    const body = capturedPayload(ORDER_REF, ORDER_AMOUNT);
    const res = await postWebhook('evt_e2e_1', body, sign(body)).expect(200);

    expect(res.body).toEqual({ received: true, result: 'processed' });
    const order = await prisma.order.findFirstOrThrow({
      where: { razorpayOrderId: ORDER_REF },
    });
    expect(order.status).toBe('PAID');
    expect(order.paidAt).not.toBeNull();
    const events = await prisma.webhookEvent.findMany();
    expect(events).toHaveLength(1);
    expect(events[0]?.status).toBe('PROCESSED');
    expect(queue.enqueueOrderConfirmation).toHaveBeenCalledTimes(1);
    expect(queue.enqueueOrderConfirmation).toHaveBeenCalledWith(order.id);
  });

  it('invalid signature is rejected and changes nothing', async () => {
    const body = capturedPayload(ORDER_REF, ORDER_AMOUNT);
    await postWebhook('evt_e2e_2', body, '0'.repeat(64)).expect(400);

    expect(await orderStatus()).toBe('PENDING');
    expect(await prisma.webhookEvent.count()).toBe(0);
    expect(queue.enqueueOrderConfirmation).not.toHaveBeenCalled();
  });

  it('same event delivered twice results in one state change and one enqueued job', async () => {
    const body = capturedPayload(ORDER_REF, ORDER_AMOUNT);
    const sig = sign(body);
    await postWebhook('evt_e2e_3', body, sig).expect(200);
    const second = await postWebhook('evt_e2e_3', body, sig).expect(200);

    expect(second.body).toEqual({ received: true, result: 'duplicate' });
    expect(await orderStatus()).toBe('PAID');
    expect(await prisma.webhookEvent.count()).toBe(1);
    expect(queue.enqueueOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  it('unknown order returns 503 and stores an UNMATCHED event', async () => {
    const body = capturedPayload('order_unknown_9', ORDER_AMOUNT);
    const res = await postWebhook('evt_e2e_4', body, sign(body)).expect(503);

    expect(res.body.statusCode).toBe(503);
    const event = await prisma.webhookEvent.findFirstOrThrow({
      where: { providerEventId: 'evt_e2e_4' },
    });
    expect(event.status).toBe('UNMATCHED');
    expect(await orderStatus()).toBe('PENDING');
    expect(queue.enqueueOrderConfirmation).not.toHaveBeenCalled();
  });

  it('after the order gets its razorpay id, a retry of the same event succeeds', async () => {
    const body = capturedPayload('order_late_9', ORDER_AMOUNT);
    await postWebhook('evt_e2e_5', body, sign(body)).expect(503);

    // The order row lands after the first delivery (slow provider callback).
    const user = await prisma.user.findFirstOrThrow();
    const product = await prisma.product.findFirstOrThrow();
    const late = await prisma.order.create({
      data: {
        userId: user.id,
        productId: product.id,
        amountPaise: ORDER_AMOUNT,
        currency: 'INR',
        status: 'PENDING',
        razorpayOrderId: 'order_late_9',
      },
    });

    const retry = await postWebhook('evt_e2e_5', body, sign(body)).expect(200);
    expect(retry.body).toEqual({ received: true, result: 'processed' });
    const reloaded = await prisma.order.findUniqueOrThrow({
      where: { id: late.id },
    });
    expect(reloaded.status).toBe('PAID');
    expect(queue.enqueueOrderConfirmation).toHaveBeenCalledTimes(1);
    expect(queue.enqueueOrderConfirmation).toHaveBeenCalledWith(late.id);
  });

  it('payment.failed after PAID does not change status', async () => {
    const payBody = capturedPayload(ORDER_REF, ORDER_AMOUNT);
    await postWebhook('evt_e2e_6a', payBody, sign(payBody)).expect(200);
    expect(await orderStatus()).toBe('PAID');

    const failBody = failedPayload(ORDER_REF);
    const res = await postWebhook('evt_e2e_6b', failBody, sign(failBody)).expect(200);
    expect(res.body).toEqual({ received: true, result: 'processed' });
    expect(await orderStatus()).toBe('PAID');
    // Only the transition to PAID enqueues; the late failure must not.
    expect(queue.enqueueOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  it('a different event id (order.paid after payment.captured) does not enqueue a second job', async () => {
    const captured = capturedPayload(ORDER_REF, ORDER_AMOUNT);
    await postWebhook('evt_e2e_7a', captured, sign(captured)).expect(200);

    const paid = orderPaidPayload(ORDER_REF, ORDER_AMOUNT);
    const res = await postWebhook('evt_e2e_7b', paid, sign(paid)).expect(200);
    expect(res.body).toEqual({ received: true, result: 'processed' });
    expect(await orderStatus()).toBe('PAID');
    expect(queue.enqueueOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  it('amount mismatch is ignored', async () => {
    const body = capturedPayload(ORDER_REF, ORDER_AMOUNT + 1);
    const res = await postWebhook('evt_e2e_8', body, sign(body)).expect(200);

    expect(res.body).toEqual({ received: true, result: 'amount_mismatch' });
    expect(await orderStatus()).toBe('PENDING');
    const event = await prisma.webhookEvent.findFirstOrThrow({
      where: { providerEventId: 'evt_e2e_8' },
    });
    expect(event.status).toBe('IGNORED');
    expect(queue.enqueueOrderConfirmation).not.toHaveBeenCalled();
  });
});
