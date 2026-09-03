import { prisma } from '../config/prisma.js';

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { preference: true },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { preference: true },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: { preference: true },
    });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
    displayName: string;
    avatarUrl?: string;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        preference: {
          create: {},
        },
      },
      include: { preference: true },
    });
  }

  async update(id: string, data: { displayName?: string; avatarUrl?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      include: { preference: true },
    });
  }

  async updatePreferences(
    userId: string,
    preferences: {
      favoriteGenres?: string[];
      favoriteMoods?: string[];
      favoriteLanguages?: string[];
      preferredRuntime?: string;
      preferredContentTypes?: string[];
      preferredProviders?: string[];
    }
  ) {
    return prisma.userPreference.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences,
      },
    });
  }
}

export const userRepository = new UserRepository();
