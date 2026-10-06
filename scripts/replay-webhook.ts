// Replay a Razorpay-style webhook against the local API:
//
//   npx ts-node scripts/replay-webhook.ts --order <razorpay_order_id> --amount <paise> [--event payment.captured] [--event-id evt_...] [--times N] [--bad-signature]
//
// Examples:
//   npx ts-node scripts/replay-webhook.ts --order order_ABC123 --amount 199900
//   npx ts-node scripts/replay-webhook.ts --order order_ABC123 --amount 199900 --event-id evt_test_1 --times 2
//   npx ts-node scripts/replay-webhook.ts --order order_ABC123 --amount 199900 --bad-signature
//
// Reads RAZORPAY_WEBHOOK_SECRET from apps/api/.env (parsed by hand, so no
// dotenv install is needed at the repo root). Requires the API at
// http://localhost:4000. Uses Node's built-in fetch; no other dependencies.

// @ts-ignore: no @types/node at the repo root; ts-node compiles this file standalone
import { createHmac, randomBytes } from 'node:crypto';
// @ts-ignore: see above
import { existsSync, readFileSync } from 'node:fs';
// @ts-ignore: see above
import { join } from 'node:path';

// Ambient shims for the same reason: keep everything this file needs local
// instead of adding a tsconfig or @types at the repo root.
declare const process: { argv: string[]; cwd(): string; exit(code?: number): void };
declare const console: { log(...args: unknown[]): void };
declare const fetch: (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ status: number; text(): Promise<string> }>;

const API_BASE_URL = 'http://localhost:4000';

type Options = {
  order: string;
  amount: number;
  event: string;
  eventId: string;
  times: number;
  badSignature: boolean;
};

function loadSecret(): string {
  // Works no matter which repo subfolder the command runs from: prefer
  // <cwd>/apps/api/.env (repo root), then siblings of the cwd.
  const candidates = [
    join(process.cwd(), 'apps', 'api', '.env'),
    join(process.cwd(), '..', 'apps', 'api', '.env'),
    join(process.cwd(), '.env'),
  ];
  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('RAZORPAY_WEBHOOK_SECRET=')) {
        continue;
      }
      const value = trimmed.slice('RAZORPAY_WEBHOOK_SECRET='.length).trim();
      // Strip optional surrounding quotes (dotenv-compatible).
      return value.replace(/^['"]|['"]$/g, '');
    }
  }
  throw new Error(
    'RAZORPAY_WEBHOOK_SECRET not found (looked in apps/api/.env relative to cwd)',
  );
}

function randomSuffix(): string {
  return randomBytes(6).toString('hex');
}

function buildPayload(
  order: string,
  amount: number,
  event: string,
): Record<string, unknown> {
  const paymentEntity: Record<string, unknown> = {
    id: `pay_${randomSuffix()}`,
    order_id: order,
    amount,
  };
  const inner: Record<string, unknown> = { payment: { entity: paymentEntity } };
  if (event === 'order.paid') {
    inner['order'] = {
      entity: { id: order, amount_paid: amount, status: 'paid' },
    };
  }
  return { entity: 'event', event, payload: inner };
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
  };
  const order = get('--order');
  const amountRaw = get('--amount');
  if (!order || !amountRaw) {
    throw new Error(
      'Usage: replay-webhook.ts --order <razorpay_order_id> --amount <paise> [--event <type>] [--event-id <id>] [--times N] [--bad-signature]',
    );
  }
  const amount = Number(amountRaw);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('--amount must be a positive integer (paise)');
  }
  const event = get('--event') ?? 'payment.captured';
  if (
    event !== 'payment.captured' &&
    event !== 'order.paid' &&
    event !== 'payment.failed'
  ) {
    throw new Error('--event must be payment.captured, order.paid or payment.failed');
  }
  const times = Number(get('--times') ?? '1');
  if (!Number.isInteger(times) || times <= 0) {
    throw new Error('--times must be a positive integer');
  }
  // One event id for the whole run: replays with --times N stay identical so
  // the second delivery exercises the duplicate path.
  return {
    order,
    amount,
    event,
    eventId: get('--event-id') ?? `evt_${randomSuffix()}`,
    times,
    badSignature: argv.includes('--bad-signature'),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const secret = loadSecret();
  const payload = buildPayload(args.order, args.amount, args.event);
  // Stringify ONCE: the HMAC must cover the exact bytes Razorpay would send.
  // Building the signature and the request body from two separate
  // serializations could differ (whitespace, key order) and break verification.
  // The server guards the same way: it verifies req.rawBody, never re-serialized JSON.
  const body = JSON.stringify(payload);
  let signature = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  if (args.badSignature) {
    const last = signature[signature.length - 1];
    signature = signature.slice(0, -1) + (last === 'a' ? 'b' : 'a');
  }
  for (let i = 1; i <= args.times; i += 1) {
    const res = await fetch(`${API_BASE_URL}/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': args.eventId,
      },
      body,
    });
    const text = await res.text();
    console.log(`#${i} -> ${res.status} ${text}`);
  }
}

main().catch((error: unknown) => {
  console.log(
    `replay failed: ${error instanceof Error ? error.message : 'unknown error'}`,
  );
  process.exit(1);
});
