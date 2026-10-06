import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export type GoogleProfileData = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Keyed on googleId so repeat logins update the same row instead of duplicating it.
  upsertFromGoogle(data: GoogleProfileData): Promise<User> {
    return this.prisma.user.upsert({
      where: { googleId: data.googleId },
      update: {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
      create: {
        googleId: data.googleId,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
