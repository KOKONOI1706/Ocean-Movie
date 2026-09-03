import { userRepository } from '../repositories/user.repository.js';
import { NotFoundError } from '../utils/errors.js';

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    const user = await userRepository.update(userId, data);
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async getPreferences(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');
    return user.preference;
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
    return userRepository.updatePreferences(userId, preferences);
  }
}

export const userService = new UserService();
