/**
 * Create a staff account, or change an existing account's role.
 *
 * Usage:
 *   pnpm admin:create --email admin@bienphim.vn --password 'a-long-password' [--username admin] [--role CURATOR|ADMIN|SUPER_ADMIN]
 *   pnpm admin:create --email admin@bienphim.vn --role SUPER_ADMIN     # existing account: role only, password kept
 *
 * Passing --password for an existing account resets its password. Role changes
 * made here take effect in the admin API within a minute (role cache TTL).
 *
 * Writes to the database in DATABASE_URL (.env), so point it at the database
 * the app actually uses (local Postgres or Supabase).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { parseArgs } from 'node:util';
import 'dotenv/config';
import { STAFF_ROLES, isRole } from '../shared/roles.js';

const prisma = new PrismaClient();

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      password: { type: 'string' },
      username: { type: 'string' },
      role: { type: 'string', default: 'ADMIN' },
    },
  });

  const email = values.email?.trim().toLowerCase();
  const password = values.password;
  const role = values.role!.toUpperCase();

  if (!email || !email.includes('@')) throw new Error('--email is required');
  if (password !== undefined && password.length < 8) throw new Error('--password must be at least 8 characters');
  if (!isRole(role) || !STAFF_ROLES.includes(role)) throw new Error(`--role must be one of ${STAFF_ROLES.join(', ')}`);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    await prisma.user.update({ where: { email }, data: { role, passwordHash } });
    console.log(`Updated ${email} (username "${existing.username}"): role ${role}${passwordHash ? ', password reset' : ''}.`);
    return;
  }

  if (!password) throw new Error('--password is required for a new account');
  const passwordHash = await bcrypt.hash(password, 10);

  const username = values.username?.trim() || email.split('@')[0];
  if (await prisma.user.findUnique({ where: { username } })) {
    throw new Error(`Username "${username}" is taken; pass --username`);
  }
  await prisma.user.create({
    data: { email, username, displayName: 'Quản trị viên', passwordHash, role },
  });
  console.log(`Created ${role} ${email} (username "${username}").`);
}

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
