import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import type { GoogleProfileData } from '../users/users.service.js';
import { UsersService } from '../users/users.service.js';
import { CurrentUser, type CurrentUserData } from './current-user.decorator.js';
import { GoogleAuthGuard } from './google-auth.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { OAuthStateGuard } from './oauth-state.guard.js';

const SESSION_COOKIE = 'session';

// Parse JWT_EXPIRES_IN values like "60s", "30m", "12h", "1d" (or bare seconds)
// into milliseconds for the cookie maxAge.
function expiresInToMs(value: string): number {
  const match = /^(\d+)([smhd])?$/.exec(value.trim());
  if (!match) {
    return 24 * 60 * 60 * 1000;
  }
  const amount = Number(match[1]);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * (multipliers[match[2] ?? 's'] ?? 1000);
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private sessionCookieOptions(maxAge: number): CookieOptions {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge,
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {
    // Empty: the guard mints oauth_state and redirects to Google.
  }

  @Get('google/callback')
  @UseGuards(OAuthStateGuard, GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as GoogleProfileData | undefined;
    if (!profile?.googleId) {
      throw new UnauthorizedException('Google login failed');
    }
    const user = await this.users.upsertFromGoogle(profile);
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '1d';
    const maxAge = expiresInToMs(expiresIn);
    const token = await this.jwt.signAsync(
      { sub: user.id },
      { expiresIn: Math.floor(maxAge / 1000) },
    );
    res.cookie(SESSION_COOKIE, token, this.sessionCookieOptions(maxAge));
    // Fixed redirect target from config: never trust a client-supplied
    // return URL (open-redirect risk).
    const webUrl =
      this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';
    res.redirect(`${webUrl}/orders`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: CurrentUserData): CurrentUserData {
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { ok: boolean } {
    res.clearCookie(SESSION_COOKIE, this.sessionCookieOptions(0));
    return { ok: true };
  }
}
