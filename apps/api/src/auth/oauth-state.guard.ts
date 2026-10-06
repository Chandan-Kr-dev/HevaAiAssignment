import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { OAUTH_STATE_COOKIE } from './google-auth.guard.js';

// Runs on the callback BEFORE GoogleAuthGuard: proves the request continues a
// login this browser started (CSRF protection for the OAuth flow).
@Injectable()
export class OAuthStateGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const expected: unknown = req.cookies?.[OAUTH_STATE_COOKIE];
    const actual: unknown = req.query.state;
    // Constant-time compare; any shape mismatch is a 400, never a pass.
    const valid =
      typeof expected === 'string' &&
      typeof actual === 'string' &&
      expected.length === actual.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
    // Single-use token: clear it whether the check passed or not.
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
    if (!valid) {
      throw new BadRequestException('Invalid OAuth state');
    }
    return true;
  }
}
