import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Populate req.cookies (plain, unsigned) for the session and oauth_state guards.
  app.use(cookieParser());
  const config = app.get(ConfigService);
  const webUrl = config.get<string>('WEB_URL') ?? 'http://localhost:3000';
  const port = Number(config.get<string>('PORT') ?? '4000');
  // Strip unknown props and coerce payloads on every request.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  // Browser frontend lives on WEB_URL and sends the session cookie.
  app.enableCors({ origin: webUrl, credentials: true });
  await app.listen(port);
}
await bootstrap();
