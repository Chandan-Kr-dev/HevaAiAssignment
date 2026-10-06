import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type CurrentUserData = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

// Reads the user object JwtAuthGuard attached to the request.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user as CurrentUserData;
  },
);
