# Detailed Problems, Security Vulnerabilities & Technical Debt

**Audit Date**: October 2, 2026  
**Auditor**: Antigravity AI Engine (Read-Only Deep Analysis Pass)  
**Target Repository**: `Mobile-shop-website`

---

## 1. Summary of Identified Issues by Severity

| Severity Level | Count | Action Timeline |
| :--- | :---: | :--- |
| 🔴 **BLOCKER** | **2** | Must fix before ANY public deployment |
| 🟠 **HIGH** | **7** | Must fix before client demo / UAT |
| 🟡 **MEDIUM** | **2** | Fix before production scale-up |
| 🟢 **LOW** | **2** | Post-launch maintenance & code cleanup |
| **TOTAL** | **13** | Distinct, actionable engineering items |

---

## 2. Exhaustive Issue Directory

---

### Issue ID: `SEC-001`
* **Severity**: 🔴 **BLOCKER**
* **Module**: Authentication & Security
* **Exact File & Lines**:
  * [`api/src/auth/strategies/jwt-access.strategy.ts:17`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/auth/strategies/jwt-access.strategy.ts#L17)
  * [`api/src/auth/strategies/jwt-refresh.strategy.ts:26`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/auth/strategies/jwt-refresh.strategy.ts#L26)
  * [`api/src/auth/auth.service.ts:498-504`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/auth/auth.service.ts#L498-L504)
* **What is Wrong**:
  JWT authentication strategies and signing services have hardcoded fallback string defaults:
  ```ts
  configService.get<string>('JWT_ACCESS_SECRET') || 'access-secret'
  configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret'
  ```
* **Why it Matters**:
  If the backend application is deployed to production and `JWT_ACCESS_SECRET` is accidentally omitted or misconfigured in `.env`, the server boots normally using the well-known public string `'access-secret'`. An external attacker can forge a valid JWT access token with `{ sub: "any-admin-id", userType: "STAFF", roleId: "admin-role-id" }` and gain full Super Admin privileges.
* **Suggested Fix**:
  In `main.ts` or `auth.service.ts`, validate on startup: if `process.env.NODE_ENV === 'production'` and `JWT_ACCESS_SECRET` is missing, empty, or equals `'access-secret'`, immediately throw a fatal error and halt bootstrap.
* **Effort**: **S (Small — 15 minutes)**

---

### Issue ID: `SEC-002`
* **Severity**: 🔴 **BLOCKER**
* **Module**: Security & CORS Policy
* **Exact File & Lines**:
  * [`api/src/main.ts:69-73`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/main.ts#L69-L73)
* **What is Wrong**:
  The CORS origin validation callback has a universal fallback:
  ```ts
  // Permissive fallback for demo environments
  callback(null, true);
  ```
  Combined with `credentials: true` on line 72.
* **Why it Matters**:
  Because the fallback always executes `callback(null, true)`, the API effectively permits cross-origin requests from **ANY web origin in the world** with credentials. If a logged-in staff member or customer visits a malicious website while their session is active, the malicious website can execute authenticated browser requests against the API.
* **Suggested Fix**:
  In `main.ts`, guard the fallback with `if (process.env.NODE_ENV !== 'production') callback(null, true); else callback(new Error('CORS origin not allowed by policy'));`.
* **Effort**: **S (Small — 15 minutes)**

---

### Issue ID: `SEC-003`
* **Severity**: 🟠 **HIGH**
* **Module**: Orders & Access Control
* **Exact File & Lines**:
  * [`api/src/order/order.controller.ts:100-103`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/order/order.controller.ts#L100-L103)
  * [`api/src/order/order.service.ts:257-260`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/order/order.service.ts#L257-L260)
* **What is Wrong**:
  The internal order creation endpoint `POST /orders` is protected only by the global `JwtAuthGuard` and lacks `@RequirePermission({ module: ModuleName.ORDERS, action: PermissionAction.CREATE })`. In `order.service.ts`, branch scope enforcement is wrapped in:
  ```ts
  if (user?.userType === 'STAFF') {
    await this.checkBranchScope(user, dto.branchId);
  }
  ```
* **Why it Matters**:
  If an authenticated customer (`userType === 'CUSTOMER'`) sends a crafted POST request to `/orders` (instead of `/orders/checkout`), the staff check is skipped and the internal staff order creation workflow executes, bypassing storefront checkout validation.
* **Suggested Fix**:
  Add `@RequirePermission({ module: ModuleName.ORDERS, action: PermissionAction.CREATE })` to `POST /orders` in `order.controller.ts`, or verify `user?.userType === 'STAFF'` at the start of `orderService.create()`.
* **Effort**: **S (Small — 20 minutes)**

---

### Issue ID: `REG-001`
* **Severity**: 🟠 **HIGH**
* **Module**: Admin ERP Forms & Token Isolation
* **Exact File & Lines**:
  * [`src/components/admin/EmployeeForm.tsx:250`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/components/admin/EmployeeForm.tsx#L250)
  * [`src/app/(admin)/admin/marketing/banners/create/page.tsx:61`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/marketing/banners/create/page.tsx#L61)
  * [`src/app/(admin)/admin/customers/create/page.tsx:82`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/customers/create/page.tsx#L82) & [`line 184`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/customers/create/page.tsx#L184)
  * [`src/app/(admin)/admin/customers/[id]/edit/page.tsx:116`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/customers/[id]/edit/page.tsx#L116)
* **What is Wrong**:
  These 4 admin forms use direct `fetch(...)` calls with `localStorage.getItem("token")` or `localStorage.getItem("accessToken")`. However, the application's isolated auth architecture stores staff tokens under `staff_access_token` (`STAFF_TOKEN_KEY`).
* **Why it Matters**:
  When a logged-in admin tries to upload a banner image, create an employee photo, or create a customer with an avatar, `localStorage.getItem("token")` returns `null`. The request sends `Authorization: Bearer null` or `Bearer `, resulting in an immediate **401 Unauthorized** error!
* **Suggested Fix**:
  Replace `localStorage.getItem("token")` with `getStaffToken()` imported from `@/lib/api-client`.
* **Effort**: **S (Small — 30 minutes)**

---

### Issue ID: `DATA-001`
* **Severity**: 🟠 **HIGH**
* **Module**: Payments & Stock Integrity
* **Exact File & Lines**:
  * [`api/src/payment/sslcommerz/sslcommerz.service.ts:138-146`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/payment/sslcommerz/sslcommerz.service.ts#L138-L146)
  * [`api/src/payment/bkash/bkash.service.ts:208-215`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/payment/bkash/bkash.service.ts#L208-L215)
* **What is Wrong**:
  For online payments (bKash, SSLCommerz), stock is not deducted at checkout initiation (to prevent inventory locking during payment drop-offs). When the payment success IPN webhook returns, the service executes:
  ```ts
  await tx.productVariant.update({
    where: { id: item.variantId },
    data: { stock: { decrement: item.quantity } },
  });
  ```
  without verifying that `variant.stock >= item.quantity`.
* **Why it Matters**:
  If the last unit of a product is sold in the POS counter while an online shopper is taking 5 minutes to complete their bKash/SSL payment, the webhook decrement will push variant stock into negative numbers (`stock = -1`).
* **Suggested Fix**:
  In IPN webhook transactions, perform an atomic conditional update: `where: { id: item.variantId, stock: { gte: item.quantity } }`. If stock is insufficient, flag the order as `NEEDS_REVIEW_STOCK_EXHAUSTED` and notify admin for refund/fulfillment.
* **Effort**: **M (Medium — 2 hours)**

---

### Issue ID: `DATA-002`
* **Severity**: 🟠 **HIGH**
* **Module**: Database Schema & Constraints
* **Exact File & Lines**:
  * [`api/prisma/schema.prisma:704`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/prisma/schema.prisma#L704) (`ProductVariant.stock`)
  * [`api/prisma/schema.prisma:729`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/prisma/schema.prisma#L729) (`BranchInventory.quantity`)
* **What is Wrong**:
  Database tables `"ProductVariant"` and `"BranchInventory"` have zero SQL CHECK constraints on stock values.
* **Why it Matters**:
  Application-level bugs or concurrent race conditions can cause integer inventory fields to store negative values, corrupting branch accounting and inventory valuation.
* **Suggested Fix**:
  Add a Prisma migration with raw SQL: `ALTER TABLE "ProductVariant" ADD CONSTRAINT chk_stock_non_neg CHECK (stock >= 0);` and `ALTER TABLE "BranchInventory" ADD CONSTRAINT chk_qty_non_neg CHECK (quantity >= 0);`.
* **Effort**: **S (Small — 30 minutes)**

---

### Issue ID: `PERF-001`
* **Severity**: 🟠 **HIGH**
* **Module**: Database Scalability & Performance
* **Exact File & Lines**:
  * [`api/prisma/schema.prisma:640-720`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/prisma/schema.prisma#L640-L720) (`Product`, `ProductVariant`, `Order`, `OrderItem`, `Customer`, `ServiceJob`, `Expense`)
* **What is Wrong**:
  Critical query filter columns lack PostgreSQL B-Tree indexes:
  * `Product`: No index on `categoryId`, `brandId`, `status`, `isPhone`, `createdAt`
  * `ProductVariant`: No index on `productId`, `sku`
  * `Order`: No index on `customerId`, `branchId`, `status`, `createdAt`
  * `OrderItem`: No index on `orderId`, `productVariantId`
  * `Customer`: No index on `phone`, `email`
* **Why it Matters**:
  As the client's catalog scales towards 18,000+ items and order history accumulates, every category page browse, storefront search, and admin order list will trigger sequential full-table scans, causing database CPU spikes and slow page load times.
* **Suggested Fix**:
  Add `@@index([categoryId])`, `@@index([brandId])`, `@@index([status])`, and composite indexes to `api/prisma/schema.prisma`, then run `npx prisma migrate dev --name add_perf_indexes`.
* **Effort**: **M (Medium — 1.5 hours)**

---

### Issue ID: `UX-001`
* **Severity**: 🟠 **HIGH**
* **Module**: Storefront User Experience & Error Handling
* **Exact File & Lines**:
  * Root Next.js App Router: [`src/app/not-found.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/not-found.tsx) (MISSING)
  * Root Next.js App Router: [`src/app/error.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/error.tsx) (MISSING)
* **What is Wrong**:
  There are no custom 404 (`not-found.tsx`) or 500 error boundary (`error.tsx`) files anywhere in `src/app/`.
* **Why it Matters**:
  If a customer types an invalid URL or encounters an unexpected network/client error, Next.js displays an unbranded raw default error page.
* **Suggested Fix**:
  Create `src/app/not-found.tsx` with a branded 404 illustration, quick search bar, and "Back to Home" button. Create `src/app/error.tsx` with retry capability.
* **Effort**: **S (Small — 45 minutes)**

---

### Issue ID: `DATA-003`
* **Severity**: 🟠 **HIGH**
* **Module**: Database Sanity & Client Demo Readiness
* **Exact File & Lines**:
  * Database records documented in [`MOCK_DATA_AUDIT.md:10-25`](file:///Users/rashedislam/Desktop/Mobile-shop-website/MOCK_DATA_AUDIT.md#L10-L25)
* **What is Wrong**:
  The local database contains 64 mock/test products (out of 74 total), 1,124 synthetic test customers (out of 1,130 total), 145 automated test orders, and 10 synthetic phone units created by previous test suites.
* **Why it Matters**:
  If the current database is deployed or shared with the client for live inspection, the client will immediately see junk data like `"Test Product 1787..."` and synthetic customers.
* **Suggested Fix**:
  Provide an automated database cleanup script (`scripts/clean-test-data.ts`) to purge records where names or emails match automated test patterns, or execute a fresh seed on the production database.
* **Effort**: **M (Medium — 1 hour)**

---

### Issue ID: `DEBT-001`
* **Severity**: 🟡 **MEDIUM**
* **Module**: Codebase Maintainability & Dead Code
* **Exact File & Lines**:
  * Folder [`src/lib/mock-data/`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/lib/mock-data) (54 files, ~1MB)
* **What is Wrong**:
  54 legacy mock data files created during early UI prototyping remain in the codebase. Only `admin-nav.ts` and type definitions in `stock-adjustments.ts` are actually imported.
* **Why it Matters**:
  Creates confusion for future developers, bloats repository size, and triggers false positives during code searches.
* **Suggested Fix**:
  Move `adminNavConfig` to `src/config/admin-nav.ts`, extract needed types to `src/types/`, and delete the `src/lib/mock-data/` directory.
* **Effort**: **S (Small — 45 minutes)**

---

### Issue ID: `ARCH-001`
* **Severity**: 🟡 **MEDIUM**
* **Module**: Infrastructure & Storage Architecture
* **Exact File & Lines**:
  * [`api/src/common/upload/multer.config.ts:19-21`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/common/upload/multer.config.ts#L19-L21)
  * [`api/src/common/upload/storage.service.ts:48-51`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/common/upload/storage.service.ts#L48-L51)
* **What is Wrong**:
  File uploads default to local filesystem storage (`process.env.UPLOAD_ROOT || join(process.cwd(), 'uploads')`). Cloudflare R2 object storage code exists but is inactive because R2 credentials are not set in `.env`.
* **Why it Matters**:
  If backend is deployed to an ephemeral container platform (Render free/starter, Railway without volume, or Heroku), all uploaded product pictures and avatars are permanently lost upon container restart or redeployment.
* **Suggested Fix**:
  Deploy backend to a persistent VPS (DigitalOcean / AWS EC2 with persistent disk) OR configure Cloudflare R2 bucket credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) in production environment.
* **Effort**: **M (Medium — 1.5 hours)**

---

### Issue ID: `LINT-001`
* **Severity**: 🟢 **LOW**
* **Module**: Code Quality & Static Analysis
* **Exact File & Lines**:
  * Backend: 508 errors / 48 warnings across `api/src/**/*.ts`
  * Frontend: [`src/components/storefront/Footer.tsx:143`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/components/storefront/Footer.tsx#L143) (unescaped apostrophe)
* **What is Wrong**:
  Extensive use of `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unsafe-*` in NestJS controllers and services.
* **Why it Matters**:
  Reduces TypeScript type safety guarantees, though builds currently compile successfully (`next build` and `nest build` both exit with 0 errors).
* **Suggested Fix**:
  Replace `any` parameters in controllers with strongly-typed Prisma DTOs and auto-fix formatting issues.
* **Effort**: **L (Large — 4-6 hours)**

---

### Issue ID: `SEED-001`
* **Severity**: 🟢 **LOW**
* **Module**: Seed Scripts & Data Population
* **Exact File & Lines**:
  * [`api/prisma/seed.ts:1-231`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/prisma/seed.ts#L1-L231)
* **What is Wrong**:
  `seed.ts` is fully idempotent and seeds system roles, staff, branches, and settings, but contains **0 product, category, brand, or banner seeds**.
* **Why it Matters**:
  Running `npx prisma db seed` on a clean production database leaves the storefront empty with no items to display.
* **Suggested Fix**:
  Add an optional demo catalog seeder script (`api/prisma/seed-demo-catalog.ts`) that populates 10 categories, 15 real products, and 3 promotional banners.
* **Effort**: **M (Medium — 2 hours)**
