// Test-environment bootstrap. Imported FIRST by webhook.e2e-spec.ts, before
// app.module.ts: ConfigModule.forRoot() captures env variables when the module
// decorator is evaluated (import time), so overrides assigned later (e.g. in
// beforeAll) are invisible to ConfigService. Setting them here wins.
import 'dotenv/config';

const devUrl = process.env.DATABASE_URL;
if (!devUrl) {
  throw new Error('DATABASE_URL must be set (apps/api/.env) for e2e tests');
}
// Same server, test database: .../heva -> .../heva_test.
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? devUrl.replace(/\/heva$/, '/heva_test');
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'dummy_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret';
