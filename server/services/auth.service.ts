import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';

export class AuthService {
  async register(data: { email: string; username: string; password: string; displayName: string }) {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email này đã được sử dụng');
    }

    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictError('Tên người dùng này đã tồn tại');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await userRepository.create({
      email: data.email,
      username: data.username,
      passwordHash,
      displayName: data.displayName,
    });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Omit password hash
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  }

  async login(data: { identifier: string; password: string }) {
    // identifier can be email or username
    const user = data.identifier.includes('@')
      ? await userRepository.findByEmail(data.identifier)
      : await userRepository.findByUsername(data.identifier);

    if (!user) {
      throw new UnauthorizedError('Thông tin đăng nhập không chính xác');
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Thông tin đăng nhập không chính xác');
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await userRepository.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedError('Người dùng không tồn tại');
      }

      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const newAccessToken = signAccessToken(tokenPayload);
      const newRefreshToken = signRefreshToken(tokenPayload);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (_err) {
      throw new UnauthorizedError('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();
