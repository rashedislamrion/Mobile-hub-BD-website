import { PrismaClient, StaffStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const FORBIDDEN_PASSWORDS = [
  'admin@12345',
  'admin@123456',
  'admin@1234',
  'admin12345',
  'password123',
  '12345678901234',
  'admin@12345678',
  'password12345',
  'superadmin123',
  'admin12345678',
  'novamobile12345',
  'mobilehub12345',
];

async function main() {
  console.log('----------------------------------------------------');
  console.log('Emergency Administrator Password Reset Tool');
  console.log('----------------------------------------------------');

  const email = (
    process.env.ADMIN_EMAIL ||
    process.env.SEED_ADMIN_EMAIL ||
    ''
  ).trim();

  const newPassword = (
    process.env.NEW_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    process.env.SEED_ADMIN_PASSWORD ||
    ''
  ).trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      '[RESET FATAL] Target administrator email must be provided via ADMIN_EMAIL or SEED_ADMIN_EMAIL.',
    );
  }

  if (!newPassword) {
    throw new Error(
      '[RESET FATAL] New password must be provided via NEW_PASSWORD or ADMIN_PASSWORD or SEED_ADMIN_PASSWORD.',
    );
  }

  if (newPassword.length < 14) {
    throw new Error(
      '[RESET FATAL] New password must be at least 14 characters long.',
    );
  }

  const lowerPass = newPassword.toLowerCase();
  for (const forbidden of FORBIDDEN_PASSWORDS) {
    if (lowerPass.includes(forbidden.toLowerCase())) {
      throw new Error(
        `[RESET FATAL] New password cannot be or contain known weak/demo password patterns like "${forbidden}".`,
      );
    }
  }

  const staff = await prisma.staff.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!staff) {
    throw new Error(`[RESET FATAL] No staff member found with email: ${email}`);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.staff.update({
    where: { id: staff.id },
    data: {
      passwordHash,
      status: StaffStatus.ACTIVE,
      adminPanelAccess: true,
    },
  });

  console.log(`✓ Password successfully reset for staff: ${email} (Role: ${staff.role?.name || 'Staff'}, Status: ACTIVE)`);
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
