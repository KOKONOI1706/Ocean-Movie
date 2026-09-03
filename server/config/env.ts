import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().default('bien_phim_default_jwt_secret_2026'),
  JWT_REFRESH_SECRET: z.string().default('bien_phim_default_refresh_jwt_secret_2026'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  GEMINI_API_KEY: z.string().optional().default(''),
});

export const env = envSchema.parse(process.env);
