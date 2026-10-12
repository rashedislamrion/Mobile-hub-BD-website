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

async function main() {
  console.log('Starting mobilehubbd database seed...');

  // ==========================================
  // 1. Roles & Permissions (Canonical Shared Matrix)
  // ==========================================
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
  console.log(`✓ Seeded ${createdRoles.length} roles and ${permissionsCount} permission entries`);

  // ==========================================
  // 2. Super Admin Configuration
  // ==========================================
  const adminRole = createdRoles.find((r) => r.name === 'Admin')!;
  const isProduction = process.env.NODE_ENV === 'production';
  const seedDemo = isProduction
    ? process.env.SEED_DEMO === 'true'
    : process.env.SEED_DEMO !== 'false';

  let adminEmail = process.env.SEED_ADMIN_EMAIL;
  let adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (isProduction || !seedDemo) {
    if (!adminEmail || !adminPassword || adminPassword.length < 12) {
      throw new Error(
        '[SEED FATAL] In production mode, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (minimum 12 characters) must be configured in environment.',
      );
    }
  } else {
    adminEmail = adminEmail || 'admin@mobilehubbd.test';
    if (!adminPassword || adminPassword.length < 12) {
      throw new Error(
        '[SEED FATAL] SEED_ADMIN_PASSWORD (minimum 12 characters) must be configured in environment.',
      );
    }
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.staff.upsert({
    where: { email: adminEmail },
    update: { passwordHash, roleId: adminRole.id, adminPanelAccess: true, status: StaffStatus.ACTIVE },
    create: {
      employeeId: 'EMP-0001',
      name: 'Super Admin',
      email: adminEmail,
      phone: '01602670922',
      passwordHash,
      roleId: adminRole.id,
      adminPanelAccess: true,
      status: StaffStatus.ACTIVE,
    },
  });
  console.log(`✓ Super Admin provisioned (${adminEmail})`);

  // ==========================================
  // 3. Branches
  // ==========================================
  // In production (seedDemo === false), only BR-DHK (flagship) is created with official client details.
  const branches = seedDemo
    ? [
        {
          name: 'Dhaka Main (Flagship)',
          code: 'BR-DHK',
          type: 'FLAGSHIP' as const,
          address: '2/13 Eastern Plaza Shopping Complex, Hatirpool',
          city: 'Dhaka 1205',
          phone: '01602670922',
        },
        {
          name: 'Chittagong Outlet',
          code: 'BR-CTG',
          type: 'OUTLET' as const,
          address: 'GEC',
          city: 'Chittagong',
          phone: '01602670922',
        },
        {
          name: 'Sylhet Warehouse',
          code: 'BR-SYL',
          type: 'WAREHOUSE' as const,
          address: 'Zindabazar',
          city: 'Sylhet',
          phone: '01602670922',
        },
      ]
    : [
        {
          name: 'Dhaka Main (Flagship)',
          code: 'BR-DHK',
          type: 'FLAGSHIP' as const,
          address: '2/13 Eastern Plaza Shopping Complex, Hatirpool',
          city: 'Dhaka 1205',
          phone: '01602670922',
        },
      ];

  let branchCount = 0;
  let dhakaBranchId = '';
  for (const b of branches) {
    // @ts-ignore
    const createdBranch = await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name, address: b.address, city: b.city, phone: b.phone },
      create: b,
    });
    if (b.code === 'BR-DHK') dhakaBranchId = createdBranch.id;
    branchCount++;
  }
  console.log(`✓ Seeded ${branchCount} branch(es)`);

  // ==========================================
  // 4. Demo Accounts (Skipped in production unless SEED_DEMO=true)
  // ==========================================
  if (seedDemo) {
    console.log('Seeding demo accounts for QA and role testing...');
    const demoPasswordHash = await bcrypt.hash(adminPassword, 10);

    const demoRoles = [
      { email: 'demo.admin@mobilehubbd.test', role: 'Admin', name: 'Demo Global Admin', empId: 'DEMO-ADM-01', phone: '01602670901', branchId: null },
      { email: 'demo.branchadmin@mobilehubbd.test', role: 'Branch Admin', name: 'Dhaka Branch Admin', empId: 'DEMO-BADM-01', phone: '01602670902', branchId: dhakaBranchId },
      { email: 'demo.branchmanager@mobilehubbd.test', role: 'Branch Manager', name: 'Dhaka Branch Manager', empId: 'DEMO-BMGR-01', phone: '01602670903', branchId: dhakaBranchId },
      { email: 'sales@mobilehubbd.test', role: 'Salesperson', name: 'Counter Sales Staff', empId: 'DEMO-SALES-01', phone: '01602670904', branchId: dhakaBranchId },
      { email: 'demo.purchasemanager@mobilehubbd.test', role: 'Purchase Manager', name: 'Procurement Lead', empId: 'DEMO-PUR-01', phone: '01602670905', branchId: null },
      { email: 'demo.productuploader@mobilehubbd.test', role: 'Product Uploader', name: 'Catalog Manager', empId: 'DEMO-UPL-01', phone: '01602670906', branchId: null },
      { email: 'demo.customerservice@mobilehubbd.test', role: 'Customer Service', name: 'Customer Support Rep', empId: 'DEMO-CS-01', phone: '01602670907', branchId: null },
      { email: 'demo.technician@mobilehubbd.test', role: 'Technician', name: 'Senior Technician', empId: 'DEMO-TECH-01', phone: '01602670908', branchId: dhakaBranchId, profitSharePercentage: 50 },
      { email: 'demo.seo@mobilehubbd.test', role: 'SEO', name: 'Digital Marketer', empId: 'DEMO-SEO-01', phone: '01602670909', branchId: null },
      { email: 'demo.auditor@mobilehubbd.test', role: 'Inventory Auditor', name: 'Stock Auditor', empId: 'DEMO-AUD-01', phone: '01602670910', branchId: dhakaBranchId },
    ];

    for (const d of demoRoles) {
      const r = createdRoles.find((role) => role.name === d.role);
      if (r) {
        await prisma.staff.upsert({
          where: { email: d.email },
          update: {
            passwordHash: demoPasswordHash,
            roleId: r.id,
            branchId: d.branchId,
            adminPanelAccess: true,
            status: StaffStatus.ACTIVE,
            phone: d.phone,
            ...(d.profitSharePercentage ? { profitSharePercentage: d.profitSharePercentage } : {}),
          },
          create: {
            employeeId: d.empId,
            name: d.name,
            email: d.email,
            phone: d.phone,
            passwordHash: demoPasswordHash,
            roleId: r.id,
            branchId: d.branchId,
            adminPanelAccess: true,
            status: StaffStatus.ACTIVE,
            ...(d.profitSharePercentage ? { profitSharePercentage: d.profitSharePercentage } : {}),
          },
        });
      }
    }

    // Customer Account for testing customer 401/403 access
    await prisma.customer.upsert({
      where: { email: 'customer@mobilehubbd.test' },
      update: { passwordHash: demoPasswordHash, phone: '01602670999' },
      create: {
        name: 'Demo Customer',
        email: 'customer@mobilehubbd.test',
        phone: '01602670999',
        passwordHash: demoPasswordHash,
      },
    });

    console.log(`✓ Seeded ${demoRoles.length} demo staff roles and 1 demo customer`);
  } else {
    console.log('Skipping demo accounts (production mode: SEED_DEMO=false).');
  }

  // ==========================================
  // 5. System Defaults & Settings
  // ==========================================
  await prisma.country.upsert({
    where: { name: 'Bangladesh' },
    update: {},
    create: { name: 'Bangladesh', code: 'BD', currency: 'BDT' },
  });

  const existingSettings = await prisma.businessSetting.findFirst();
  if (!existingSettings) {
    await prisma.businessSetting.create({
      data: {
        general: {
          storeName: 'MobileHubBD',
          email: 'mobilehubbd2@gmail.com',
          phone: '01602670922',
          address: '2/13 Eastern Plaza Shopping Complex, Hatirpool, Dhaka 1205',
        },
        branding: { primaryColor: '#000000' },
        currencyTax: { currency: 'BDT' },
        orderSettings: { minOrder: 100 },
        notifications: { email: true },
      },
    });
  }

  const gateways = [
    { gateway: 'BKASH', title: 'bKash', isActive: false },
    { gateway: 'SSLCOMMERZ', title: 'SSLCommerz', isActive: false },
    { gateway: 'COD', title: 'Cash on Delivery', isActive: true },
  ] as const;
  for (const gw of gateways) {
    await prisma.paymentGatewayConfig.upsert({
      where: { gateway: gw.gateway },
      update: {
        ...(gw.gateway === 'COD' ? { isActive: true, title: gw.title } : {}),
      },
      create: {
        gateway: gw.gateway,
        isActive: gw.isActive,
        title: gw.title,
        credentials: {},
      },
    });
  }

  const existingSms = await prisma.smsConfig.findFirst();
  if (!existingSms) await prisma.smsConfig.create({ data: { provider: 'BulkSMSBD' } });

  const existingMail = await prisma.mailConfig.findFirst();
  if (!existingMail) await prisma.mailConfig.create({ data: {} });

  const existingFirebase = await prisma.firebaseConfig.findFirst();
  if (!existingFirebase) await prisma.firebaseConfig.create({ data: {} });

  const existingRecaptcha = await prisma.recaptchaConfig.findFirst();
  if (!existingRecaptcha) await prisma.recaptchaConfig.create({ data: {} });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
