// Env vars every boot needs. Provider-specific keys (Google, Razorpay,
// Mailgun) are validated later by the modules that use them.
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'WEB_URL',
  'PORT',
] as const;

// Runs via ConfigModule.forRoot({ validate }): fail fast with one clear error
// instead of obscure runtime failures when required env vars are missing.
export function validate(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.length === 0;
  });
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
  return config;
}
