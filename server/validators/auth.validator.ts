import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  username: z.string().min(3, 'Tên người dùng tối thiểu 3 ký tự').regex(/^[a-zA-Z0-9_-]+$/, 'Chỉ chấp nhận chữ cái, số, gạch dưới'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  displayName: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự'),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập email hoặc tên người dùng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
});

export const updatePreferencesSchema = z.object({
  favoriteGenres: z.array(z.string()).optional(),
  favoriteMoods: z.array(z.string()).optional(),
  favoriteLanguages: z.array(z.string()).optional(),
  preferredRuntime: z.string().optional(),
  preferredContentTypes: z.array(z.string()).optional(),
  preferredProviders: z.array(z.string()).optional(),
});
