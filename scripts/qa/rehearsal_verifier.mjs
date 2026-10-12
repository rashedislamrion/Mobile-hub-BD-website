#!/usr/bin/env node

/**
 * scripts/qa/rehearsal_verifier.mjs
 * Comprehensive rehearsal verifier on the fresh database (novamobile_fresh_test).
 * Tests all requirements of PASS 53 Task 4:
 * 1. Super Admin login with emergency reset password.
 * 2. Every admin menu item / endpoint usable.
 * 3. Create branch, category, brand, attribute, unit, supplier, product with variant & image.
 * 4. Create staff user with role.
 * 5. Customer registration via public auth.
 * 6. Place COD order.
 * 7. Place POS sale.
 * 8. Place Purchase order.
 * 9. Verify database business settings contain clean/neutral values.
 * 10. Verify /admin cache headers, sitemap, robots.txt.
 */

const API_BASE = 'http://localhost:4000/api/v1';
const STORE_BASE = 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(condition, message, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    failedTests++;
    const err = `  ✖ [FAIL] ${message}${detail ? ` -> ${detail}` : ''}`;
    console.error(err);
    failureDetails.push(err);
  }
}

async function api(endpoint, method = 'GET', body = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, data };
}

async function runRehearsal() {
  console.log('====================================================');
  console.log('PASS 53 — FRESH DATABASE REHEARSAL VERIFIER');
  console.log('Target API:', API_BASE);
  console.log('Target Store:', STORE_BASE);
  console.log('====================================================\n');

  // STEP 1: Super Admin Login
  console.log('--- Step 1: Super Admin Authentication ---');
  const loginRes = await api('/auth/staff/login', 'POST', {
    email: 'rehearsal.admin@mobilehubbd.test',
    password: 'EmergencyReset#987654321',
  });

  assert(loginRes.status === 200 || loginRes.status === 201, 'Super Admin login returns HTTP 200/201', `Status: ${loginRes.status}`);
  assert(Boolean(loginRes.data?.accessToken), 'Access token issued in response');
  assert(loginRes.data?.user?.role?.name === 'Admin', 'User role is Super Admin (Admin)');
  assert(loginRes.data?.user?.branchId === null, 'Super Admin branchId is null (global all-branches scope)');

  const token = loginRes.data?.accessToken;
  if (!token) {
    console.error('Fatal: Cannot proceed without Super Admin token.');
    process.exit(1);
  }

  // STEP 2: Every Admin Menu Item Usability
  console.log('\n--- Step 2: Admin Menu Items & Endpoints Usability ---');
  const endpointsToCheck = [
    ['/branches', 'Branch Management'],
    ['/category', 'Categories'],
    ['/brands', 'Brands'],
    ['/attributes', 'Attributes'],
    ['/units', 'Units'],
    ['/suppliers', 'Suppliers'],
    ['/products', 'Products Catalog'],
    ['/employees', 'Staff & HRM'],
    ['/roles', 'Roles & Permissions'],
    ['/orders', 'Orders & Invoices'],
    ['/pos/products', 'POS Terminal & Register'],
    ['/purchase-orders', 'Purchase Orders'],
    ['/expenses', 'Expense Accounts'],
    ['/business-settings', 'Business Settings'],
    ['/payment-gateways', 'Payment Gateway Settings'],
    ['/sms-config', 'SMS Configuration'],
    ['/mail-config', 'Mail Configuration'],
    ['/reports/dashboard', 'Sales & Financial Reports'],
    ['/service-jobs', 'Technician & Service Jobs'],
  ];

  for (const [ep, label] of endpointsToCheck) {
    const res = await api(ep, 'GET', null, token);
    assert(res.status === 200, `Admin endpoint ${label} (${ep}) returns HTTP 200`, `Status: ${res.status}`);
  }

  // STEP 3: Create Branch, Category, Brand, Attribute, Unit, Supplier
  console.log('\n--- Step 3: Master Data Creation Flow ---');
  
  // 3a. Branch
  const branchRes = await api('/branches', 'POST', {
    name: 'Dhanmondi Flagship',
    code: 'BR-DHA-' + Date.now().toString().slice(-4),
    type: 'OUTLET',
    address: 'Plot 12, Mirpur Road, Dhanmondi',
    city: 'Dhaka',
    phone: '01711000000',
  }, token);
  assert(branchRes.status === 201 || branchRes.status === 200, 'Create Branch returns 201/200', `Status: ${branchRes.status}`);
  const branchId = branchRes.data?.id;

  // 3b. Category
  const catSlug = 'smartphones-' + Date.now().toString().slice(-4);
  const catRes = await api('/category', 'POST', {
    name: 'Smartphones ' + Date.now().toString().slice(-4),
    slug: catSlug,
  }, token);
  assert(catRes.status === 201 || catRes.status === 200, 'Create Category returns 201/200', `Status: ${catRes.status}`);
  const categoryId = catRes.data?.id;

  // 3c. Brand
  const brandSlug = 'samsung-' + Date.now().toString().slice(-4);
  const brandRes = await api('/brands', 'POST', {
    name: 'Samsung ' + Date.now().toString().slice(-4),
    slug: brandSlug,
  }, token);
  assert(brandRes.status === 201 || brandRes.status === 200, 'Create Brand returns 201/200', `Status: ${brandRes.status}`);
  const brandId = brandRes.data?.id;

  // 3d. Attribute
  const attrRes = await api('/attributes', 'POST', {
    name: 'Storage ' + Date.now().toString().slice(-4),
  }, token);
  assert(attrRes.status === 201 || attrRes.status === 200, 'Create Attribute returns 201/200', `Status: ${attrRes.status}`);

  // 3e. Unit
  const unitRes = await api('/units', 'POST', {
    name: 'Piece ' + Date.now().toString().slice(-4),
    shortCode: 'PCS',
  }, token);
  assert(unitRes.status === 201 || unitRes.status === 200, 'Create Unit returns 201/200', `Status: ${unitRes.status}`);
  const unitId = unitRes.data?.id;

  // 3f. Supplier
  const supRes = await api('/suppliers', 'POST', {
    name: 'Apex Global Distribution ' + Date.now().toString().slice(-4),
    contactPerson: 'Kazi Rahim',
    phone: '01711222' + Date.now().toString().slice(-3),
    address: 'Motijheel C/A, Dhaka',
  }, token);
  assert(supRes.status === 201 || supRes.status === 200, 'Create Supplier returns 201/200', `Status: ${supRes.status}`);
  const supplierId = supRes.data?.id;

  // STEP 4: Create Product with Variant & Image
  console.log('\n--- Step 4: Product Catalog Creation ---');
  const sku = 'SAM-S24U-' + Date.now().toString().slice(-4);
  const formData = new FormData();
  formData.append('name', 'Samsung Galaxy S24 Ultra ' + Date.now().toString().slice(-4));
  formData.append('regularPrice', '135000');
  formData.append('buyingPrice', '110000');
  formData.append('categoryId', categoryId);
  formData.append('brandId', brandId);
  formData.append('unitId', unitId);
  formData.append('branchId', branchId);
  formData.append(
    'variants',
    JSON.stringify([
      {
        color: 'Titanium Gray',
        price: 135000,
        buyingPrice: 110000,
        stock: 25,
        sku,
      },
    ])
  );

  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const blob = new Blob([pngBytes], { type: 'image/png' });
  formData.append('images', blob, 's24ultra.png');

  const prodFetchRes = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const prodData = await prodFetchRes.json();
  const prodRes = { status: prodFetchRes.status, data: prodData };

  assert(
    prodRes.status === 201 || prodRes.status === 200,
    'Create Product with variant & image returns 201/200',
    `Status: ${prodRes.status}`
  );
  assert(
    Boolean(prodRes.data?.images && prodRes.data.images.length > 0),
    'Product image successfully uploaded and linked to product'
  );
  const productId = prodRes.data?.id;
  const variantId = prodRes.data?.variants?.[0]?.id;

  // STEP 5: Create Staff User with Role
  console.log('\n--- Step 5: Staff & Role Assignment ---');
  const rolesRes = await api('/roles', 'GET', null, token);
  const managerRole = rolesRes.data?.find?.((r) => r.name === 'Branch Manager') || rolesRes.data?.[1];

  const staffRes = await api('/employees', 'POST', {
    name: 'Dhanmondi Manager ' + Date.now().toString().slice(-4),
    email: 'dhanmondi.mgr.' + Date.now().toString().slice(-4) + '@mobilehubbd.test',
    phone: '01711' + Date.now().toString().slice(-6),
    roleId: managerRole?.id,
    branchId: branchId,
    password: 'StaffStrongPass#12345',
  }, token);
  assert(staffRes.status === 201 || staffRes.status === 200, 'Create Staff User returns 201/200', `Status: ${staffRes.status}`);

  // STEP 6: Customer Registration (Public API)
  console.log('\n--- Step 6: Public Customer Registration ---');
  const customerEmail = 'karim.' + Date.now().toString().slice(-4) + '@customer.test';
  const customerPhone = '01811' + Date.now().toString().slice(-6);
  const custRes = await api('/auth/customer/register', 'POST', {
    name: 'Karim Ahmed',
    email: customerEmail,
    phone: customerPhone,
    password: 'CustomerPass#123',
    confirmPassword: 'CustomerPass#123',
  });
  assert(custRes.status === 201 || custRes.status === 200, 'Public Customer Registration returns 201/200', `Status: ${custRes.status}`);
  const customerId = custRes.data?.user?.id;

  // STEP 7: Customer COD Order
  console.log('\n--- Step 7: Storefront COD Order Creation ---');
  const orderRes = await api('/orders', 'POST', {
    branchId,
    customerId,
    saleType: 'WEBSITE',
    paymentMethod: 'COD',
    shippingAddress: 'House 5, Road 27, Dhanmondi, Dhaka',
    items: [
      {
        productId,
        variantId,
        quantity: 1,
        unitPrice: 135000,
      },
    ],
  }, token);
  assert(orderRes.status === 201 || orderRes.status === 200, 'Create COD Order returns 201/200', `Status: ${orderRes.status}`);

  // STEP 8: POS Sale
  console.log('\n--- Step 8: POS Counter Sale ---');
  const posRes = await api('/pos/sales', 'POST', {
    branchId,
    saleType: 'POS',
    paymentMethod: 'CASH',
    paidAmount: 135000,
    items: [
      {
        productId,
        variantId,
        quantity: 1,
        unitPrice: 135000,
      },
    ],
  }, token);
  assert(posRes.status === 201 || posRes.status === 200, 'Create POS Sale returns 201/200', `Status: ${posRes.status}`);

  // STEP 9: Purchase Order
  console.log('\n--- Step 9: Supplier Purchase Order ---');
  const poRes = await api('/purchase-orders', 'POST', {
    supplierId,
    branchId,
    items: [
      {
        productId,
        variantId,
        quantityOrdered: 5,
        unitCost: 110000,
        sellingPrice: 135000,
      },
    ],
  }, token);
  assert(poRes.status === 201 || poRes.status === 200, 'Create Purchase Order returns 201/200', `Status: ${poRes.status}`);

  // STEP 10: Clean DB Settings Verification & Security Headers
  console.log('\n--- Step 10: Database Clean Settings Verification & Security Headers ---');
  const settingsRes = await api('/business-settings', 'GET', null, token);
  assert(settingsRes.status === 200, 'Get Business Settings returns HTTP 200', `Status: ${settingsRes.status}`);
  const generalSettings = settingsRes.data?.general || {};
  assert(generalSettings.email === '', 'Business settings email is clean/empty in DB');
  assert(generalSettings.phone === '', 'Business settings phone is clean/empty in DB');
  assert(generalSettings.address === '', 'Business settings address is clean/empty in DB');
  assert(!JSON.stringify(generalSettings).includes('Eastern Plaza'), 'Business settings contains NO hardcoded Eastern Plaza demo address');

  const homeRes = await fetch(`${STORE_BASE}/`);
  assert(homeRes.status === 200, 'Storefront homepage returns HTTP 200', `Status: ${homeRes.status}`);

  const adminHeaderRes = await fetch(`${STORE_BASE}/admin/login`);
  const cacheControl = adminHeaderRes.headers.get('cache-control') || '';
  assert(
    cacheControl.includes('no-store') || cacheControl.includes('private') || cacheControl.includes('no-cache'),
    'Admin login route has secure private / no-store / no-cache headers',
    `Cache-Control: ${cacheControl}`
  );

  const sitemapRes = await fetch(`${STORE_BASE}/sitemap.xml`);
  assert(sitemapRes.status === 200, 'Sitemap.xml returns HTTP 200', `Status: ${sitemapRes.status}`);
  const sitemapContent = await sitemapRes.text();
  assert(sitemapContent.includes('<?xml') || sitemapContent.includes('<urlset'), 'Sitemap returns valid XML document');

  const robotsRes = await fetch(`${STORE_BASE}/robots.txt`);
  assert(robotsRes.status === 200, 'Robots.txt returns HTTP 200', `Status: ${robotsRes.status}`);
  const robotsContent = await robotsRes.text();
  assert(robotsContent.includes('User-Agent:') || robotsContent.includes('User-agent:'), 'Robots.txt returns valid robots directive');

  console.log('\n====================================================');
  console.log(`REHEARSAL SUMMARY: ${passedTests}/${totalTests} CHECKS PASSED`);
  if (failedTests > 0) {
    console.error(`FAILED CHECKS (${failedTests}):`);
    for (const f of failureDetails) console.error(f);
    process.exit(1);
  } else {
    console.log('✓ ALL REHEARSAL SCENARIOS PASSED WITH 100% SUCCESS!');
    console.log('====================================================\n');
    process.exit(0);
  }
}

runRehearsal().catch((err) => {
  console.error('Fatal Rehearsal Exception:', err);
  process.exit(1);
});
