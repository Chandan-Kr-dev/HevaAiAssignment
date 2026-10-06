import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AdminKeyGuard } from './admin-key.guard.js';

function contextWithHeader(value: string | undefined): ExecutionContext {
  const req = {
    headers: value === undefined ? {} : { 'x-admin-key': value },
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function guardWithKey(key: string | undefined): AdminKeyGuard {
  const config = {
    get: (name: string): string | undefined =>
      name === 'ADMIN_API_KEY' ? key : undefined,
  } as ConfigService;
  return new AdminKeyGuard(config);
}

describe('AdminKeyGuard', () => {
  it('allows a request with the valid key', () => {
    expect(
      guardWithKey('secret123').canActivate(contextWithHeader('secret123')),
    ).toBe(true);
  });

  it('rejects a wrong key with 401', () => {
    expect(() =>
      guardWithKey('secret123').canActivate(contextWithHeader('wrong')),
    ).toThrow(UnauthorizedException);
  });

  it('rejects a missing header with 401', () => {
    expect(() =>
      guardWithKey('secret123').canActivate(contextWithHeader(undefined)),
    ).toThrow(UnauthorizedException);
  });

  it('rejects everything when ADMIN_API_KEY is unset', () => {
    expect(() =>
      guardWithKey(undefined).canActivate(contextWithHeader('anything')),
    ).toThrow(UnauthorizedException);
    expect(() =>
      guardWithKey('').canActivate(contextWithHeader('')),
    ).toThrow(UnauthorizedException);
  });
});
