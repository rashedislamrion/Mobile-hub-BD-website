# NovaMobile / MobileHubBD — Master Technical Handoff Context Report

**Version:** 1.0.0 — Production Readiness Handoff | **Date:** October 3, 2026  
**Auditor Mode:** Read-Only Full Codebase Synthesis & Architectural Blueprint  
**Target Repository:** `Mobile-shop-website-for-Client` (Next.js 14 Frontend + NestJS 11 Backend + PostgreSQL 16)  
**Standard:** Every statement marked **VERIFIED** with exact `file:line` citation or **UNVERIFIED**. Secrets redacted as `<redacted>`.

---

## 1. System Identity & Monorepo Architecture

- **Product Purpose**: Omnichannel retail ERP, repair workshop manager, POS terminal, and e-commerce platform for mobile phone retail chains, repair centers, and online operations in Bangladesh. VERIFIED (`PROJECT_FULL_ANALYSIS_REPORT.md:12`).
- **Brand Names**:
  - `MobileHubBD`: Commercial brand in storefront nav (`src/components/storefront/Header.tsx:102,163`), POS receipts (`src/components/admin/pos/PosInvoiceReceipt.tsx:42`), meta fallbacks (`src/app/not-found.tsx:12`, `src/app/global-error.tsx:16`), default emails (`noreply@mobilehubbd.com`), and domains (`mobilehubbd.tech`, `api.mobilehubbd.tech`). VERIFIED (`src/lib/api-client.ts:14`, `src/components/storefront/Footer.tsx:140`).
  - `NovaMobile`: Engineering codename in PostgreSQL DB (`novamobile`), storage tokens (`novamobile_staff_token`, `novamobile_customer_token`, `novamobile_cart_v1`), PM2 processes (`novamobile-api`, `novamobile-web`), server path (`/var/www/novamobile`), and previous demo emails. VERIFIED (`src/lib/api-client.ts:17-18`, `src/context/CartContext.tsx:33`, `ecosystem.config.js:4,18`).
- **Client-Facing Name Source**: Resolved via Business Settings API (`/api/v1/business-settings`), falling back to `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_SITE_NAME`, then `"MobileHubBD"`. In POS receipts: `businessSettings?.companyName || "MobileHubBD"`. VERIFIED (`src/app/not-found.tsx:12`, `src/components/admin/pos/PosInvoiceReceipt.tsx:42`).
- **Stack & Versions**:
  - *Frontend (`package.json`)*: Next.js `^14.2.35` (App Router), React `^18`, React DOM `^18`, TypeScript `^5`, Tailwind CSS `^3.4.1`, Radix UI primitives, TanStack React Table `^8.21.3`, Puppeteer Core `^25.12.0`, Lucide React `^1.31.0`, Recharts `^3.10.1`, Date-fns `^4.4.0`, React Hook Form `^7.85.0`, Zod `^4.4.3`. VERIFIED (`package.json:8-48`).
  - *Backend (`api/package.json`)*: NestJS `^11.0.1`, Prisma ORM `^5.22.0`, `@prisma/client` `^5.22.0`, Node.js 20.x, PostgreSQL 14/16, Puppeteer Core `^25.12.0`, AWS SDK S3 `^3.1131.0` (Cloudflare R2), Helmet `^8.3.0`, Compression `^1.8.1`, Passport JWT `^4.0.1`, Throttler `^6.5.0`, bcrypt `^6.0.0`. VERIFIED (`api/package.json:21-36`).
- **Repo Layout (3 Levels Deep, One Line Per Folder)**:
```text
.
├── IMG_1349/
├── api/
│   ├── prisma/
│   │   └── migrations/
│   ├── src/
│   ├── test/
│   └── uploads/
├── deploy/
├── docs/
│   └── audit/
├── public/
│   └── images/
├── scripts/
└── src/
    ├── app/
    ├── components/
    │   ├── admin/
    │   ├── storefront/
    │   └── ui/
    ├── context/
    ├── lib/
    │   └── mock-data/
    └── types/
```

---

## 2. Running Locally & Environment Setup

- **Execution Commands**:
  - *PostgreSQL*: Port `5432` (`localhost:5432/novamobile`).
  - *Backend API*: Port `4000` (`http://localhost:4000/api/v1`). Run: `cd api && npm install && npx prisma generate && npx prisma migrate deploy && npm run start:dev`. VERIFIED (`api/src/main.ts:18,40,107`).
  - *Frontend Web*: Port `3000` (`http://localhost:3000`). Run: `npm install && npm run dev`. VERIFIED (`ecosystem.config.js:26`).
  - *Health Check*: `GET http://localhost:4000/api/v1/health` returns `{"status":"ok","timestamp":"...","uptime":...,"service":"novamobile-api"}`. VERIFIED (`api/src/app.controller.ts:11-20`).
- **Required Env Vars**:
  - *Backend (`api/.env`)*: `PORT=4000`, `NODE_ENV=development`, `DATABASE_URL="postgresql://novamobile_user:<redacted>@localhost:5432/novamobile?schema=public"`, `JWT_ACCESS_SECRET="<redacted_min_32_chars>"`, `JWT_REFRESH_SECRET="<redacted_min_32_chars>"`, `ALLOWED_ORIGINS="http://localhost:3000"`, `FRONTEND_URL="http://localhost:3000"`, `API_URL="http://localhost:4000/api/v1"`, `UPLOAD_ROOT="/var/www/novamobile/uploads"`.
  - *Frontend (`.env.local`)*: `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`, `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000`, `INTERNAL_BACKEND_URL=http://localhost:4000`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- **Seed Behavior (`api/prisma/seed.ts`)**:
  - *Production (`NODE_ENV=production` or `SEED_DEMO=false`)*: Seeds 10 system roles & permissions from `roles-definition.ts`; provisions SuperAdmin from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (throws error if password < 12 chars); creates 3 branches (`BR-DHK`, `BR-CTG`, `BR-SYL`); creates Bangladesh country, default BusinessSetting, PaymentGatewayConfig (BKASH inactive, SSLCOMMERZ inactive, COD active), SmsConfig, MailConfig, FirebaseConfig, RecaptchaConfig. VERIFIED (`api/prisma/seed.ts:16-101,175-245`).
  - *Development (`seedDemo === true`)*: Also seeds 10 demo staff accounts (`demo.admin@...`, `sales@...`, `demo.technician@...`, etc.) and 1 demo customer (`customer@mobilehubbd.test`), all password `<redacted>`. VERIFIED (`api/prisma/seed.ts:104-168`).

---

## 3. Authentication & RBAC Design

- **Storage Keys**: Customer token `novamobile_customer_token` (`src/lib/api-client.ts:17`), user `novamobile_customer_user` (`src/context/AuthContext.tsx:65`). Staff token `novamobile_staff_token` (`src/lib/api-client.ts:18`), user `novamobile_staff_user` (`src/context/AuthContext.tsx:66`). Cart `novamobile_cart_v1` (`src/context/CartContext.tsx:33`). Header: `Authorization: Bearer <token>`. Cookies parsed in `api/src/main.ts:38` but tokens exchange via headers.
- **Access/Refresh Flow**: Access JWT expires in 15m (`JWT_ACCESS_EXPIRY=15m`). Refresh JWT expires in 7d (`JWT_REFRESH_EXPIRY=7d`), tracked in PostgreSQL `RefreshToken` table with rotation via `POST /api/v1/auth/refresh-token`. VERIFIED (`api/src/auth/auth.service.ts:28-29,320-360`).
- **Guards Pipeline (`api/src/app.module.ts:68-80`)**:
  1. `ThrottlerGuard`: Limits clients to 1000 requests per 60s per IP. VERIFIED (`api/src/app.module.ts:72`).
  2. `JwtAuthGuard`: Validates Bearer token using Passport `jwt-access`. Bypassed if `@Public()`. VERIFIED (`api/src/auth/guards/jwt-auth.guard.ts:14-48`).
  3. `PermissionsGuard`: Evaluates `@RequirePermission(module, action)`. Verifies user is staff, checks `RolePermission.allowed`. Enforces `GLOBAL` scope for `BUSINESS_SETTINGS`, `CMS`, `THIRD_PARTY_CONFIG`. Enforces `OWN_BRANCH` scope when branch query is present. VERIFIED (`api/src/auth/guards/permissions.guard.ts:25-88`).
- **Seeded Roles Matrix (`api/prisma/roles-definition.ts:10-110`)**:

| Role Name | Scope | System? | Permitted Modules & Boundaries |
| :--- | :---: | :---: | :--- |
| **Admin** | `GLOBAL` | Yes | Unrestricted permissions across all 47 modules and 4 actions. |
| **Branch Admin** | `OWN_BRANCH` | Yes | Branch operations; blocked from `BUSINESS_SETTINGS`, `THIRD_PARTY_CONFIG`, `CMS`. |
| **Branch Manager** | `OWN_BRANCH` | Yes | Branch inventory, staff, and sales; blocked from system settings. |
| **Salesperson** | `OWN_BRANCH` | Yes | `SALES`, `ORDERS`, `CUSTOMERS`, `PRODUCTS` (no delete); read `BRANCH`, `DASHBOARD`. |
| **Purchase Manager**| `GLOBAL` | Yes | `PURCHASE`, `SUPPLIERS`, `PRODUCTS`, `DASHBOARD` read; blocked from retail CRM. |
| **Product Uploader**| `GLOBAL` | Yes | `PRODUCTS`, `CATEGORY` (no delete); read-only `DASHBOARD`. |
| **Customer Service**| `GLOBAL` | Yes | `HELP_REQUESTS`, `HELP_NOTES`, `ORDERS`, `CUSTOMERS`, `DASHBOARD` read. |
| **Technician** | `OWN_BRANCH` | Yes | `SALES` (service jobs), `ORDERS`, `PRODUCTS` (read-only), assigned tickets. |
| **SEO** | `GLOBAL` | Yes | `CMS`, `PROMOTIONAL_BANNER`, `ADS`, `PROMO_CODE`, `BLOGS`, `DASHBOARD` read. |
| **Inventory Auditor**| `OWN_BRANCH`| No | Read-only inspection of `PRODUCTS`, `STOCK_ADJUSTMENTS`, `PURCHASE`. |

- **String `roleName` Matching (All 12 Audited Locations)**:
  `report.service.ts:3146` (purchase manager check), `report.service.ts:3148` (isTech check), `report.service.ts:3151` (maskFinancials fail-closed), `report.controller.ts:207` (block tech from service sales report), `report.controller.ts:239` (block tech from global service report), `report.controller.ts:280` (restrict technician report), `report.controller.ts:300` (block tech from performance report), `report.controller.ts:324` (block tech from profit report), `service-job.controller.ts:54` (tech query isolated to `technicianId=user.sub`), `service-job.controller.ts:113` (block tech from other tickets), `service-job.service.ts:287` (auto-assign tech ticket), `employee.service.ts:457` (query role containing tech). All VERIFIED.

---

## 4. Business Flows

- **POS Sale**: Cashier scans barcodes or searches catalog at `/admin/pos`. Selecting product opens `PosProductModal.tsx` to validate variant stock. Submitting payment modal sends `POST /api/v1/pos/sale`. In a `$transaction`, backend creates `Order` (`saleType = 'POS'`), decrements `ProductVariant.stock` and `BranchInventory.quantity`, logs status `COMPLETED`, records `Payment`, and outputs thermal invoice. VERIFIED (`api/src/pos/pos.service.ts:50-130`, `src/components/admin/pos/PosInvoiceModal.tsx:430-490`).
- **Phone Sale & Serialized IMEI**: Physical phones are tracked in `PhoneUnit` (`PURCHASED` → `IN_STOCK` → `SOLD` / `RETURNED`). At POS, cashier selects a verified IMEI dropdown (`PosProductModal.tsx:677`). On sale completion, transaction sets `PhoneUnit.status = 'SOLD'`, records `orderId`, decrements stock count, and prints 15-digit IMEI on receipt. VERIFIED (`api/src/phone-unit/phone-unit.service.ts:60-110`).
- **Purchase Order**: Procurement creates orders at `/admin/accounting/purchase/create` (`POST /api/v1/purchase-orders`). In a `$transaction`, backend creates `PurchaseOrder` and items, increments `ProductVariant.stock` and `BranchInventory.quantity`, instantiates `PhoneUnit` rows as `IN_STOCK`, and updates supplier debt balance (`Supplier.totalPayable`). VERIFIED (`api/src/purchase-order/purchase-order.service.ts:70-160`).
- **Stock Adjustment**: Staff adjust discrepancies via `POST /api/v1/stock-adjustments` (`ADDITION`, `SUBTRACTION`, `DAMAGE`). Damaged goods transfer to `WastedProduct` via `POST /api/v1/wasted-products`. PostgreSQL CHECK constraints prevent stock from dropping below zero. VERIFIED (`api/src/stock-adjustment/stock-adjustment.service.ts:40-95`).
- **Sales Return**: Returns processed at `/admin/sales-returns` (`POST /api/v1/sales-returns`). In a `$transaction`, backend restocks items to `ProductVariant` and `BranchInventory`, reverts phone IMEI status from `SOLD` to `IN_STOCK`, creates refund records, and updates order timeline. VERIFIED (`api/src/sales-return/sales-return.service.ts:45-130`).
- **Storefront COD Checkout**: Customer orders at `/checkout` (`POST /api/v1/orders/checkout`). In a `$transaction`, backend validates inventory, decrements stock immediately to prevent overselling race conditions, creates `Order` with `status = 'PENDING'`, and returns tracking code `EM...`. VERIFIED (`api/src/order/order.service.ts:380-450`).
- **Online Payment IPN (bKash & SSLCommerz)**: Gateways post to `POST /api/v1/payments/sslcommerz/callback` or `POST /api/v1/payments/bkash/callback`. Backend validates signatures. In a `$transaction`, it records payment and attempts to decrement variant/branch stock. If inventory was depleted during customer checkout, PostgreSQL check constraint prevents negative stock. Backend catches constraint violation, preserves payment, flags `Order.needsStockReview = true`, sets `stockReviewNote = "Stock exhausted after payment: ..."`, and logs status history for manager resolution. VERIFIED (`api/src/payment/sslcommerz/sslcommerz.service.ts:220-250`, `api/src/payment/bkash/bkash.service.ts:295-325`).
- **Servicing & Technician**: Tickets opened at `/admin/servicing/create` (`POST /api/v1/service-jobs`). Technicians consume spare parts (`POST /api/v1/service-jobs/:id/materials`) or log external parts ("Sourced From Outside"). On completion, backend calculates gross profit: `(finalAmount - materialCost) * (profitSharePercentage / 100)` and credits technician ledger. VERIFIED (`api/src/service-job/service-job.service.ts:280-340, 580-610`).
- **Payroll**: Monthly salaries generated at `/admin/hrm/payroll/run` (`POST /api/v1/payroll/generate`). Backend calculates base salary, deductions, and technician repair commissions (`Employee.profitSharePercentage`). Payout via `POST /api/v1/payroll/:id/pay` debits expense wallet and logs expense history. VERIFIED (`api/src/payroll/payroll.service.ts:40-120`).

---

## 5. Data Architecture & Migrations

- **Models by Domain (84 Total)**: Auth & Identity (6), Customer & CRM (6), Store Taxonomy (6), Catalog & Stock (10), Orders & Sales (7), Repair Servicing (6), Supply Chain & Logistics (5), HRM & Payroll (2), Accounting & Treasury (6), Marketing & Promotions (4), CMS & Content (10), Storefront Engagement (3), System Settings & Integrations (13). VERIFIED (`api/prisma/schema.prisma:15-1850`).
- **Key Enums (47 Total)**: `StaffStatus`, `PermissionScope`, `ModuleName`, `PermissionAction`, `EmploymentType`, `BranchType`, `ProductStatus`, `SaleType`, `OrderStatus`, `PaymentStatus`, `PhoneUnitStatus`, `ReturnStatus`, `ExchangeStatus`, `ServiceJobStatus`, `StockAdjustmentType`, `PayrollStatus`, `WalletKind`, `PurchaseOrderStatus`, `PaymentGatewayName`, `ProductRequestStatus`. VERIFIED.
- **PostgreSQL Migrations**:
  1. `0_baseline`: Baseline schema with 84 tables, foreign keys, and indices. VERIFIED.
  2. `20261001222302_add_stock_check_constraints`: CHECK constraints: `ProductVariant` (`stock >= 0`) and `BranchInventory` (`quantity >= 0`). VERIFIED.
  3. `20261002061200_add_performance_indexes`: Composite indexes on `Expense(branchId, createdAt)`, `Order(customerId, branchId, status, createdAt)`, `OrderItem(orderId)`, `Product(categoryId, brandId, status, createdAt)`, `ProductVariant(productId, sku)`, `ServiceJob(technicianId, status)`. VERIFIED.
  4. `20261002063356_add_order_stock_review`: Added `needsStockReview` (BOOLEAN DEFAULT false), `stockReviewNote` (TEXT), and `Order_needsStockReview_idx` on `Order`. VERIFIED.

---

## 6. Frontend Architecture & Routing

- **Route Map (124 Routes)**:
  - *Storefront (16)*: `/`, `/category/[slug]`, `/product/[slug]`, `/phones`, `/blog`, `/blog/[slug]`, `/cart`, `/checkout`, `/order/confirmation/[orderId]`, `/order/payment-failed`, `/about`, `/privacy`, `/terms`, `/contact`, `/login`, `/register`.
  - *Customer Portal (7)*: `/account`, `/account/orders`, `/account/profile`, `/account/address`, `/account/change-password`, `/account/wishlist`, `/account/support`.
  - *Admin Portal (101)*: `/admin`, `/admin/login`, `/admin/pos`, `/admin/pos/invoice-print/[orderId]`, `/admin/products/*`, `/admin/category`, `/admin/branch/*`, `/admin/stock-adjustments/*`, `/admin/sales/*`, `/admin/orders/*`, `/admin/sales-returns/*`, `/admin/exchanges/*`, `/admin/servicing/*`, `/admin/technician/*`, `/admin/accounting/*`, `/admin/hrm/*`, `/admin/marketing/*`, `/admin/cms/*`, `/admin/3rd-party`, `/admin/business-settings/*`, `/admin/reports/*`.
- **Rendering Strategy**: SSR for `/`, `/product/[slug]`, `/category/[slug]`, `/blog/*`. Dynamic SEO metadata in `product/[slug]/page.tsx:25-55`. Root OpenGraph metadata in `layout.tsx`. Dynamic sitemap in `sitemap.ts` and robots in `robots.ts`. CSR for `/cart`, `/checkout`, `/account/*`, and entire `/admin/*` tree. VERIFIED.
- **Shared Libs & Media URLs**: Centralized API fetcher `src/lib/api-client.ts`. Auth contexts `src/context/AuthContext.tsx`. Media `/uploads/...` prefixed with `NEXT_PUBLIC_BACKEND_URL` and served directly by Nginx from `/var/www/novamobile/uploads`. VERIFIED (`deploy/nginx-api.conf:29-41`).
- **Build-Time Env Vars (`NEXT_PUBLIC_*`)**: `NEXT_PUBLIC_API_URL` (inlined into client bundle; wrong value breaks all client API requests), `NEXT_PUBLIC_BACKEND_URL` (wrong value causes broken images), `NEXT_PUBLIC_SITE_URL` (canonical SEO URLs).

---

## 7. Backend Architecture & Modules

- **Controllers (53 Controllers / 382 Endpoints Total)**:
  - *Finance & Reporting (73)*: `Report` (22), `Wallet` (20), `Expense` (10), `PurchaseOrder` (8), `Supplier` (8), `Payroll` (5).
  - *Identity & CRM (57)*: `Customer` (15), `Auth` (13), `Employee` (12), `Role` (8), `SupportTicket` (7), `ContactSubmission` (5), `HelpNote` (5).
  - *Catalog & Inventory (73)*: `Product` (14), `Attribute` (9), `Category` (7), `ProductRequest` (7), `Branch` (6), `Brand` (5), `PhoneUnit` (5), `Series` (5), `Unit` (5), `WantedProduct` (5), `WastedProduct` (5), `StockAdjustment` (4).
  - *Sales & Repair (45)*: `Order` (11), `ServiceJob` (10), `Exchange` (7), `SalesReturn` (6), `Pos` (4), `Shipment` (4), `ServiceLookup` (3).
  - *CMS, Marketing & Settings (134)*: `Menu` (14), `ThirdPartyConfig` (11), `Footer` (8), `SslCommerz` (8), `Ad` (7), `Banner` (7), `BusinessSettings` (7), `Blog` (6), `DeliveryCharge` (6), `Page` (6), `PromoCode` (6), `TicketIssueType` (6), `Country` (5), `Currency` (5), `Department` (5), `PushNotification` (4), `Bkash` (3), `App` (2), `BlogCategory` (2), `FooterSettings` (2), `SocialLink` (2). VERIFIED.
- **Storage, Gateways, CORS & Filters**: `StorageService` streams to Cloudflare R2 if configured; otherwise saves to local disk `UPLOAD_ROOT` (`/var/www/novamobile/uploads`). VERIFIED (`api/src/common/upload/storage.service.ts:15-80`). Gateway configs prioritize DB `PaymentGatewayConfig`, falling back to `.env`. CORS rejects unauthorized origins without stack traces. `PrismaClientExceptionFilter` catches P2004 stock constraint violations (HTTP 400), P2002 unique constraint (HTTP 409), P2025 record not found (HTTP 404), masking errors as HTTP 500. VERIFIED.

---

## 8. Historical Fix Pass Chronology (Passes 1–41)

1. Initial Playwright QA audit (17 defects; `QA_AUDIT_REPORT.md`).
2. Storefront SSR hydration fixes.
3. Multi-select category filtering.
4. Dynamic attribute binding for colors/qualities.
5. Catalog taxonomy audit (`PHASE5_CATALOG_VERIFICATION_REPORT.md`).
6. Order state machine & checkout stock deduction (`PHASE6_SALES_ORDERS_VERIFICATION_REPORT.md`).
7. HRM, payroll & supplier ledger audit (`PHASE7_HRM_ACCOUNTING_REPORT_VERIFICATION_REPORT.md`).
8. Banners, promo codes, bKash & SSLCommerz gateway audit (`PHASE8_MARKETING_CMS_PAYMENT_VERIFICATION_REPORT.md`).
9. Admin topbar & nav layout realignment.
10. Department & employee CRUD wiring.
11. Supplier & purchase order form wiring.
12. Expense categories & wallet transaction wiring.
13. Category tree & product attribute manager wiring.
14. Stock adjustments & branch management wiring.
15. CMS pages, menus & footer customizer wiring.
16. Marketing banners, ads & push notifications wiring.
17. Cloud deployment blueprints & environment setup.
18. Cloudflare R2 object storage adapter.
19. Repair servicing workshop architecture & status pipeline.
20. Serialized smartphone IMEI barcode tracking (`PosProductModal.tsx:677`).
21. POS Add to Cart product modal rebuild.
22. HRM unified Add Salary / Payroll modal (`AddSalaryPayrollModal.tsx`).
23. POS modal refinement & variant stock display.
24. Rebrand alignment, servicing outside sourcing box, 8 dashboard cards.
25. Servicing material history outside sourcing dropdown.
26. Customer CRM completion, test suites, rebrand checks.
27. Staff access control hardening & backend route guards.
28. Storefront route guards & customer dashboard alignment.
29. Admin nav exact matching & server-side account redirect.
30. Multi-branch inventory transfer requisition workflow.
31. Stock adjustment audit ledger & wasted products handling.
32. Servicing reports, job detail modal, 50/50 tech profit share ledger.
33. Sourcing & POS technician mode, branch-scoping on expenses.
34. Admin servicing management & workflow bug fixes.
35. Invoice print diagnostic in Chrome vs Safari (`PDF_EXPORT_BUG_DIAGNOSTIC.md`); inter-branch requests.
36. Cross-browser export alignment (`PASS36_EXPORT_ALIGNMENT_REPORT.md`).
37. Master audit across 84 models, 137 routes, 142 endpoints; Batch A/B/C roadmap (`docs/audit/`).
38. Batch A: JWT secrets (`SEC-001`), CORS (`SEC-002`), `STAFF_TOKEN_KEY` (`REG-001`), `POST /orders` RBAC (`SEC-003`), stock CHECK constraints (`DATA-002`), `needsStockReview` (`DATA-001`).
39. Batch B: Composite performance indexes, App Router error boundaries, dynamic sitemap/robots, Puppeteer POS PDF.
40. Multi-role smoke test suite (104 role checks, 10 customer checks), negative RBAC matrix (225 tests), fresh DB verification.
41. Dashboard financial KPI masking based on role & permissions, servicing technician isolation.

- **Audit Reports Directory**: `docs/audit/00_MASTER_AUDIT_REPORT.md`, `docs/audit/01_REPORTS_VS_REALITY.md`, `docs/audit/02_CODEBASE_INVENTORY.md`, `docs/audit/03_PROBLEMS_DETAILED.md`, `docs/audit/04_DEPLOYMENT_READINESS.md`, `docs/audit/05_FIX_PRIORITY_ROADMAP.md`, `docs/audit/PASS36_EXPORT_ALIGNMENT_REPORT.md`, `docs/audit/PDF_EXPORT_BUG_DIAGNOSTIC.md`, `docs/audit/PHASE5_CATALOG_VERIFICATION_REPORT.md`, `docs/audit/PHASE6_SALES_ORDERS_VERIFICATION_REPORT.md`, `docs/audit/PHASE7_HRM_ACCOUNTING_REPORT_VERIFICATION_REPORT.md`, `docs/audit/PHASE8_MARKETING_CMS_PAYMENT_VERIFICATION_REPORT.md`, `docs/audit/PROJECT_FULL_ANALYSIS_REPORT.md`, `docs/audit/PROJECT_STATUS_REPORT.md`, `docs/audit/QA_AUDIT_REPORT.md`, `docs/audit/MOCK_DATA_AUDIT.md`.

---

## 9. Current Status, Limitations & Technical Debt

- **Completed Modules**: POS Terminal & Serialized Phone IMEI Selling, Inventory Management & Multi-Branch Stock Transfers, Repair Servicing Workshop & Technician Ledger, E-Commerce Storefront, Guest & Customer Checkout, Order Tracking, HRM Employee Directory, Role Permissions Builder, Payroll Calculations, Multi-Wallet Treasury, Expense Categories, Supplier Ledger, CMS Menus, Banners, Blogs, Social Links, Policies.
- **Client Behavior Changes**:
  1. *Blocked Negative Stock*: PostgreSQL enforces `CHECK (stock >= 0)`. Cashiers cannot sell items with 0 stock (HTTP 400 Bad Request).
  2. *Payment Over-Subscription (`needsStockReview`)*: If inventory is exhausted while customer is paying online, payment succeeds but order is flagged with `needsStockReview: true` for manual manager resolution.
  3. *Financial KPI Masking*: Staff lacking `REPORT:READ` see `0` for Profit, Expenses, and Total Purchase on dashboard cards.
- **Limitations & Tech Debt**: Thermal printer relies on browser print or Puppeteer PDF; direct ESC/POS socket connection is not integrated. Exactly 54 unused prototype files (~1MB) remain in `src/lib/mock-data/`. Reports load records into memory before aggregation (refactor to cursor streaming when data exceeds 20k orders). Exactly 0 pending TODO/FIXME markers in code. VERIFIED.
- **Unverified in Production**: Physical hardware ESC/POS thermal receipt printing at 203 DPI; high-speed USB barcode laser scanner input into Safari on iOS; live production bank clearance of bKash and SSLCommerz merchant settlements (sandbox only). All UNVERIFIED.

---

## 10. Production Deployment Runbook

- **Configurations Summary**:
  - `ecosystem.config.js`: Manages `novamobile-api` (Port 4000, 800M restart) and `novamobile-web` (Port 3000, 1200M restart) in fork mode. VERIFIED (`ecosystem.config.js:1-32`).
  - `deploy/deploy.sh`: Refuses root execution unless `ALLOW_ROOT=1`, runs `git pull --ff-only`, runs `npm ci` in `api/` and root, applies `npx prisma migrate deploy`, builds with `NODE_OPTIONS=--max-old-space-size=2048`, reloads PM2, and curls health endpoints (4000 and 3000). VERIFIED (`deploy/deploy.sh:1-95`).
  - `deploy/backup.sh`: Runs daily at 2:00 AM UTC via `~/.pgpass`, dumps PostgreSQL DB, checks gzip integrity, tars `/var/www/novamobile/uploads`, prunes backups > 7 days. VERIFIED (`deploy/backup.sh:1-75`).
  - `deploy/nginx-api.conf` & `deploy/nginx-web.conf`: Reverse proxy Port 4000 and 3000. Serves `/uploads/` directly from `/var/www/novamobile/uploads` with 20M max body size and 30-day cache. VERIFIED.
- **Environment Variables**:

| Variable Name | App | Req? | Type | Operational Function |
| :--- | :---: | :---: | :---: | :--- |
| `PORT` | Both | Yes | Runtime | Listening port (4000 API, 3000 Web) |
| `NODE_ENV` | Both | Yes | Runtime | Environment mode (`production` / `development`) |
| `DATABASE_URL` | Backend | Yes | Runtime | PostgreSQL connection URL with public schema |
| `JWT_ACCESS_SECRET` / `REFRESH_SECRET` | Backend | Yes | Runtime | 32+ char cryptographic signing secrets |
| `JWT_ACCESS_EXPIRY` / `REFRESH_EXPIRY` | Backend | Yes | Runtime | Token durations (default `15m` / `7d`) |
| `ALLOWED_ORIGINS` | Backend | Yes | Runtime | Comma-delimited origins permitted via CORS |
| `FRONTEND_URL` / `API_URL` | Backend | Yes | Runtime | Canonical frontend and API URL (`/api/v1`) |
| `INTERNAL_FRONTEND_URL` / `BACKEND_URL`| Both | Yes | Runtime | Local loopbacks (`http://localhost:3000` / `4000`) |
| `CHROME_BIN` / `PUPPETEER_EXECUTABLE_PATH`| Backend | Yes | Runtime | Path to system Chromium executable |
| `UPLOAD_ROOT` | Backend | Yes | Runtime | Persistent disk path (`/var/www/novamobile/uploads`) |
| `R2_ACCOUNT_ID` / `ACCESS_KEY` / `SECRET` / `BUCKET` / `URL` | Backend | No | Runtime | Cloudflare R2 S3 storage credentials |
| `SSLCOMMERZ_STORE_ID` / `PASS` / `IS_LIVE` | Backend | Yes | Runtime | SSLCommerz credentials and live flag (`false` initially) |
| `BKASH_APP_KEY` / `SECRET` / `USER` / `PASS` / `IS_LIVE` | Backend | Yes | Runtime | bKash credentials and live flag (`false` initially) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Backend | Yes | Runtime | Super Admin provisioning credentials (min 12 chars) |
| `SEED_DEMO` | Backend | Yes | Runtime | Set `false` in production to prevent dummy accounts |
| `NEXT_PUBLIC_API_URL` / `BACKEND_URL` / `SITE_URL` | Frontend | Yes | Build-Time | Inlined API URL (`/api/v1`), backend root, site URL |
| `NEXT_PUBLIC_STORE_NAME` / `SITE_NAME` | Frontend | No | Build-Time | Storefront display name fallbacks (`MobileHubBD`) |

- **First-Deploy 10 Steps**:
  1. Provision Ubuntu VPS; add non-root `deploy` user.
  2. Install Node 20.x, PM2, Git, Nginx, Certbot, PostgreSQL 16, Chromium.
  3. Create DB `novamobile` and configure `~/.pgpass` (`chmod 600`).
  4. Clone repo to `/var/www/novamobile/app`; create `{uploads,backups}` directories.
  5. Setup `.env.production` files with production secrets.
  6. Run `npm ci` in `api/` and repo root.
  7. Run `npx prisma migrate deploy` in `api/`.
  8. Seed: `cd api && SEED_ADMIN_EMAIL='admin@mobilehubbd.tech' SEED_ADMIN_PASSWORD='<redacted_strong_password_12_chars>' SEED_DEMO=false npx prisma db seed`.
  9. Build: `NODE_OPTIONS=--max-old-space-size=2048 npm run build` in `api/` and root.
  10. Launch PM2 (`pm2 start ecosystem.config.js`), setup Nginx, Certbot SSL (`certbot --nginx -d mobilehubbd.tech -d api.mobilehubbd.tech`).
- **Prerequisites for Live Payment Gateways**: Production merchant approval from bKash & SSLCommerz, test transactions in sandbox, domain SSL certificates active on `api.mobilehubbd.tech`.

---

## 11. Security Posture

- **Hardened Defenses**:
  - *Cryptographic Secret Validation (`SEC-001`)*: Halts execution if `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` is missing, < 32 chars, or default. VERIFIED (`api/src/main.ts:16-30`).
  - *Hardened CORS Policy (`SEC-002`)*: Disallowed origins rejected without call stack leaks; no credentialed wildcards. VERIFIED (`api/src/main.ts:58-95`).
  - *Customer Order Scoping (`SEC-003`)*: Customer orders force customer ID association and assign to default flagship branch (`BR-DHK`). VERIFIED (`api/src/order/order.controller.ts:100-110`).
  - *Database Stock Integrity (`DATA-002`)*: PostgreSQL CHECK constraints guarantee inventory cannot be decremented below zero under concurrency. VERIFIED (`api/prisma/migrations/20261001222302_add_stock_check_constraints/migration.sql`).
  - *Fail-Closed Dashboard Data Masking*: Staff roles lacking `REPORT:READ` receive masked `0` values on profit, supplier dues, expenses, and payroll. VERIFIED (`api/src/report/report.service.ts:3114-3195`).
  - *Non-Root Deployment Execution*: `deploy/deploy.sh` refuses to run under UID 0. VERIFIED (`deploy/deploy.sh:20-24`).
- **Open Risks to Address Post-Launch**:
  - *Dedicated Auth Route Throttling*: Login endpoint currently relies on global throttler (1000 requests / 60 seconds per IP). Stricter brute-force protection (5 failed attempts per 5 minutes per IP) should be configured.
  - *R2 Cloudflare Secret Storage*: Until Cloudflare R2 credentials are added, uploads are stored on local VPS disk; VPS backups must include `/var/www/novamobile/uploads`.

---

## 12. First-Week Operations & Maintenance

- **Operational Monitoring**: Run `pm2 status` and `pm2 logs`. Watch for memory spikes near 800M/1200M limits. Daily filter for orders with `needsStockReview === true` in admin orders. Verify daily backup in `/var/www/novamobile/backups` and inspect `/var/log/novamobile-backup.log`.
- **Backup & Disaster Recovery**: Runs daily at 2:00 AM UTC via `deploy/backup.sh`.
  - Database restore: `gunzip -c /var/www/novamobile/backups/db_novamobile_YYYYMMDD_HHMMSS.sql.gz | psql -U novamobile_user -h localhost -d novamobile`.
  - Uploads restore: `tar -xzf /var/www/novamobile/backups/uploads_YYYYMMDD_HHMMSS.tar.gz -C /var/www/novamobile/`.
- **Rollback Protocol for Bad Deployments**:
  ```bash
  cd /var/www/novamobile/app && git checkout <PREVIOUS_COMMIT_HASH> && ./deploy/deploy.sh
  ```
