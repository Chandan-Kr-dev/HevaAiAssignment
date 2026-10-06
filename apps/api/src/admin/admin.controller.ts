import { Controller, Get, UseGuards } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminKeyGuard } from './admin-key.guard.js';

export type FailedJobDto = {
  id: string;
  jobId: string;
  name: string;
  data: Prisma.JsonValue;
  failedReason: string;
  attemptsMade: number;
  failedAt: Date;
};

@Controller('admin')
@UseGuards(AdminKeyGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('failed-jobs')
  async failedJobs(): Promise<FailedJobDto[]> {
    const rows = await this.prisma.failedJob.findMany({
      orderBy: { failedAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      name: row.name,
      data: row.data,
      failedReason: row.failedReason,
      attemptsMade: row.attemptsMade,
      failedAt: row.failedAt,
    }));
  }
}
