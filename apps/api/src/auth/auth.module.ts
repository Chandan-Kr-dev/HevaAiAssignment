import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { GoogleAuthGuard } from './google-auth.guard.js';
import { GoogleStrategy } from './google.strategy.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { OAuthStateGuard } from './oauth-state.guard.js';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? '',
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [GoogleStrategy, GoogleAuthGuard, OAuthStateGuard, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
