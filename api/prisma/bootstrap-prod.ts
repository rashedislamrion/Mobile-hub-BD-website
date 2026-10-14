import {
  PrismaClient,
  ModuleName,
  PermissionAction,
  StaffStatus,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SEED_ROLES } from './roles-definition';

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
  // 1. Production environment gate
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(
      '[BOOTSTRAP FATAL] NODE_ENV must be set to "production" to run this command. Aborting.',
    );
  }

  console.log('----------------------------------------------------');
  console.log('Starting Production Bootstrap (Clean & Idempotent)...');
  console.log('----------------------------------------------------');

  // 2. Validate Super Admin credentials from Environment
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || '').trim();
  const adminPassword = (process.env.SEED_ADMIN_PASSWORD || '').trim();
  const adminName = (process.env.SEED_ADMIN_NAME || 'Super Admin').trim();
  const adminPhone = (process.env.SEED_ADMIN_PHONE || '01000000000').trim();

  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error(
      '[BOOTSTRAP FATAL] SEED_ADMIN_EMAIL is required and must be a valid email address.',
    );
  }

  if (!adminPassword) {
    throw new Error(
      '[BOOTSTRAP FATAL] SEED_ADMIN_PASSWORD is required in environment.',
    );
  }

  if (adminPassword.length < 14) {
    throw new Error(
      '[BOOTSTRAP FATAL] SEED_ADMIN_PASSWORD must be at least 14 characters long.',
    );
  }

  const lowerPass = adminPassword.toLowerCase();
  for (const forbidden of FORBIDDEN_PASSWORDS) {
    if (lowerPass.includes(forbidden.toLowerCase())) {
      throw new Error(
        `[BOOTSTRAP FATAL] SEED_ADMIN_PASSWORD cannot be or contain known weak/demo password patterns like "${forbidden}".`,
      );
    }
  }

  // 3. Roles & Permissions Catalog (Canonical Matrix)
  const createdRoles: Role[] = [];
  for (const r of SEED_ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { isSystem: r.isSystem, scope: r.scope, description: r.description },
      create: { name: r.name, isSystem: r.isSystem, scope: r.scope, description: r.description },
    });
    createdRoles.push(role);
  }

  const modules = Object.values(ModuleName);
  const actions = Object.values(PermissionAction);

  let permissionsCount = 0;
  for (const roleDef of SEED_ROLES) {
    const dbRole = createdRoles.find((r) => r.name === roleDef.name)!;
    for (const module of modules) {
      for (const action of actions) {
        const allowed = roleDef.isAllowed(module, action);
        await prisma.rolePermission.upsert({
          where: { roleId_module_action: { roleId: dbRole.id, module, action } },
          update: { allowed },
          create: { roleId: dbRole.id, module, action, allowed },
        });
        permissionsCount++;
      }
    }
  }
  console.log(`✓ Synchronized ${createdRoles.length} system roles and ${permissionsCount} permission matrix rules`);

  // 4. Super Administrator (Idempotent: Never overwrites existing password)
  const adminRole = createdRoles.find((r) => r.name === 'Admin')!;
  const existingAdmin = await prisma.staff.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    await prisma.staff.update({
      where: { id: existingAdmin.id },
      data: {
        roleId: adminRole.id,
        adminPanelAccess: true,
        status: StaffStatus.ACTIVE,
      },
    });
    console.log(`✓ Super Admin already exists (${adminEmail}). Existing password preserved; permissions verified.`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.staff.create({
      data: {
        employeeId: 'EMP-0001',
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        passwordHash,
        roleId: adminRole.id,
        branchId: null, // Full global all-branches scope
        adminPanelAccess: true,
        status: StaffStatus.ACTIVE,
      },
    });
    console.log(`✓ Super Admin created (${adminEmail}) with all-branches scope`);
  }

  // 5. Mandatory Reference Data
  // Country: Bangladesh (Required for store localized country lookup & customer addresses)
  await prisma.country.upsert({
    where: { name: 'Bangladesh' },
    update: {},
    create: { name: 'Bangladesh', code: 'BD', currency: 'BDT' },
  });
  console.log('✓ Mandatory Country reference initialized (Bangladesh / BDT)');

  // Payment Gateway Config: Cash on Delivery active by default so initial orders succeed.
  // Online gateways (bKash, SSLCommerz) initialized inactive with empty credentials.
  const gateways = [
    { gateway: 'COD' as const, title: 'Cash on Delivery', isActive: true },
    { gateway: 'BKASH' as const, title: 'bKash', isActive: false },
    { gateway: 'SSLCOMMERZ' as const, title: 'SSLCommerz', isActive: false },
  ];
  for (const gw of gateways) {
    await prisma.paymentGatewayConfig.upsert({
      where: { gateway: gw.gateway },
      update: {},
      create: {
        gateway: gw.gateway,
        title: gw.title,
        isActive: gw.isActive,
        credentials: {},
      },
    });
  }
  console.log('✓ Payment gateways initialized (COD active; online gateways inactive placeholders)');

  // Third-party placeholders: Empty structures so admin settings endpoints return clean state without 500
  const existingSms = await prisma.smsConfig.findFirst();
  if (!existingSms) {
    await prisma.smsConfig.create({ data: { provider: 'BulkSMSBD' } });
  }

  const existingMail = await prisma.mailConfig.findFirst();
  if (!existingMail) {
    await prisma.mailConfig.create({ data: {} });
  }

  const existingFirebase = await prisma.firebaseConfig.findFirst();
  if (!existingFirebase) {
    await prisma.firebaseConfig.create({ data: {} });
  }

  const existingRecaptcha = await prisma.recaptchaConfig.findFirst();
  if (!existingRecaptcha) {
    await prisma.recaptchaConfig.create({ data: {} });
  }
  console.log('✓ Third-party integration configurations initialized');

  // 6. Business Settings with EMPTY / Neutral values (No demo phone, address, or branches)
  const existingSettings = await prisma.businessSetting.findFirst();
  if (!existingSettings) {
    await prisma.businessSetting.create({
      data: {
        general: {
          storeName: 'MobileHubBD',
          email: '',
          phone: '',
          address: '',
          timeZone: 'UTC/GMT +06:00 - Asia/Dhaka',
          currency: 'BDT',
          defaultCurrency: 'BDT',
          currencyPosition: 'LEFT',
          businessModel: 'SINGLE_STORE',
          showDownloadAppNav: false,
          googlePlayStoreLink: '',
          appleStoreLink: '',
          showAdminFooter: true,
          hotlineNumber: '',
          footerText: '',
          paymentMethodsSetup: {
            codEnabled: true,
            onlinePaymentEnabled: false,
          },
        },
        branding: {
          primaryColor: '#10B981',
          logoUrl: '',
          logoRatio4x1Url: '',
          faviconUrl: '/favicon.ico',
          appLogoUrl: '',
          splashLogoUrl: '',
          footerLogoRatio4x1Url: '',
          footerQrCodeUrl: '',
        },
        currencyTax: {
          currencyCode: 'BDT',
          currencySymbol: '৳',
          symbolPosition: 'LEFT',
          taxPercentage: 0,
        },
        orderSettings: {
          allowGuestCheckout: true,
          freeDeliveryThreshold: 0,
          standardDeliveryCharge: 0,
          expressDeliveryCharge: 0,
          minOrderAmount: 0,
        },
        notifications: {
          email: false,
        },
      },
    });
    console.log('✓ Business settings created with clean neutral values (no dummy contact details)');
  } else {
    console.log('✓ Business settings already exist. Existing configuration preserved.');
  }

  // 8. Standard Service Lookups (Idempotent)
  const defaultDeviceTypes = [
    'Phone',
    'Tablet',
    'Laptop',
    'Smart Watch',
    'Desktop',
    'Audio & Accessories',
  ];
  for (const name of defaultDeviceTypes) {
    await prisma.deviceType.upsert({
      where: { name },
      create: { name, status: StaffStatus.ACTIVE },
      update: {},
    });
  }
  console.log(`✓ Seeded standard Device Types (${defaultDeviceTypes.length} types)`);

  console.log('----------------------------------------------------');
  console.log('Production bootstrap finished successfully!');
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
