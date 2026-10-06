import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

// Single shared secret for the ops endpoints. Compared in constant time;
// an unset ADMIN_API_KEY rejects everything rather than opening access.
@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = this.config.get<string>('ADMIN_API_KEY') ?? '';
    const actual: unknown = req.headers['x-admin-key'];
    if (
      expected.length === 0 ||
      typeof actual !== 'string' ||
      expected.length !== actual.length
    ) {
      throw new UnauthorizedException();
    }
    // Equal lengths guaranteed above, so timingSafeEqual cannot throw.
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
