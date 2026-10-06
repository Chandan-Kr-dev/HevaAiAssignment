import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type Profile,
} from 'passport-google-oauth20';
import type { GoogleProfileData } from '../users/users.service.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') ?? '',
      scope: ['profile', 'email'],
      // Passport's built-in state store needs sessions; we do CSRF state
      // ourselves with the short-lived oauth_state cookie instead.
      state: false,
    });
  }

  // Return value becomes req.user for the callback handler.
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleProfileData {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Google account has no email address');
    }
    return {
      googleId: profile.id,
      email,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
  }
}
