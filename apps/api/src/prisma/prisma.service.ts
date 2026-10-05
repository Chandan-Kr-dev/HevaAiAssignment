import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Single shared PrismaClient for the API process. Other modules inject this
// instead of constructing their own client, so connection pooling stays sane.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    // Connect at boot so the first request never pays the connect cost.
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    // Works with app.enableShutdownHooks(): Nest drains, then we close the pool.
    await this.$disconnect();
  }
}
