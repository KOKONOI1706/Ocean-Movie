import { z } from 'zod';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const rawEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters').optional(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().optional(),
  GEMINI_API_KEY: z.string().optional().default(''),
  // Video aggregator: comma separated hostnames the scraper may fetch (empty = any public host)
  AGGREGATOR_ALLOWED_HOSTS: z.string().optional().default(''),
  // Video aggregator: JSON array of search source definitions (see server/aggregator/sources/registry.ts)
  AGGREGATOR_SOURCES: z.string().optional().default('[]'),
  // Metadata providers (optional; a provider without a key shows as "not configured")
  TMDB_API_TOKEN: z.string().optional().default(''),
  /** TMDB response language, e.g. en-US or vi-VN (overviews fall back to en-US when empty). */
  TMDB_LANGUAGE: z.string().optional().default('en-US'),
  OMDB_API_KEY: z.string().optional().default(''),
  /** true: resolve provider hosts via public DNS (for networks that block themoviedb.org). */
  METADATA_PUBLIC_DNS: z.enum(['true', 'false']).optional().default('false'),
});

const rawEnv = rawEnvSchema.parse(process.env);

if (rawEnv.NODE_ENV === 'production') {
  const missing: string[] = [];
  if (!rawEnv.JWT_SECRET) missing.push('JWT_SECRET');
  if (!rawEnv.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (!rawEnv.CORS_ORIGIN) missing.push('CORS_ORIGIN');
  if (missing.length > 0) {
    throw new Error(
      `Refusing to start in production: missing required env var(s): ${missing.join(', ')}. ` +
      `Generate strong secrets with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))" ` +
      `and set CORS_ORIGIN to your real site origin (e.g. https://bienphim.vn).`
    );
  }
}

// Development/test only: generate a random per-process secret when one isn't
// configured, so tokens are never signed with a value anyone could look up in
// source control. Restarting the dev server invalidates existing sessions —
// that's expected for a throwaway secret and never happens in production,
// where the check above requires a real JWT_SECRET/JWT_REFRESH_SECRET.
const ephemeralDevSecret = () => crypto.randomBytes(48).toString('hex');

export const env = {
  ...rawEnv,
  JWT_SECRET: rawEnv.JWT_SECRET ?? ephemeralDevSecret(),
  JWT_REFRESH_SECRET: rawEnv.JWT_REFRESH_SECRET ?? ephemeralDevSecret(),
  CORS_ORIGIN: rawEnv.CORS_ORIGIN ?? 'http://localhost:3000',
};
