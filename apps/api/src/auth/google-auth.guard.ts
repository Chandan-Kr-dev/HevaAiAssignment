import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';

// Short-lived CSRF token for the OAuth flow (we run no session store, so we
// cannot use passport's built-in state handling).
export const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super();
  }

  getAuthenticateOptions(
    context: ExecutionContext,
  ): Record<string, unknown> | undefined {
    const req = context.switchToHttp().getRequest<Request>();
    // Only the flow START mints fresh state; the callback must echo Google's
    // state untouched or signature verification breaks.
    if (!req.path.endsWith('/auth/google')) {
      return undefined;
    }
    const state = randomBytes(32).toString('hex');
    const res = context.switchToHttp().getResponse<Response>();
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: OAUTH_STATE_MAX_AGE_MS,
      secure: isProd,
      path: '/',
    });
    return { state };
  }
}
