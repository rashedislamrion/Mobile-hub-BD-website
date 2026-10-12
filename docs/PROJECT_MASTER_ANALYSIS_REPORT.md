# MobileHubBD / NovaMobile — Master System Architecture & Technical Handoff Report

> **Target Audience:** Incoming Engineers, AI Agents, Technical Auditors, and DevOps Leads  
> **Repository:** `Mobile-shop-website` (Next.js 14 App Router Frontend + NestJS 11 Backend + PostgreSQL 16 DB + Prisma ORM)  
> **Report Version:** 2.0.0 (Comprehensive Post-Pass 44 Handoff)  
> **Date:** October 8, 2026  
> **Authoritative Scope:** Full Monorepo Architecture, Historical Reports Synthesis, Upload Pipeline, Complete API Flow, Route Mapping, and Current Operational Status.

---

## 1. Executive Summary & System Identity

### 1.1 Product Purpose & Domain
MobileHubBD (engineering codename: `novamobile`) is an omnichannel retail ERP, repair servicing workshop manager, POS terminal, and consumer e-commerce platform built specifically for mobile phone retail chains, gadget outlets, and smartphone repair centers in Bangladesh.

### 1.2 Branding & Commercial Identity
- **Commercial Front-Facing Brand:** `MobileHubBD`
  - Displayed on storefront header, footer, POS invoice receipts, customer order emails, and meta titles.
  - Official contact details:
    - **Phone:** `01602670922` (International: `+8801602670922`, WhatsApp: `8801602670922`)
    - **Email:** `mobilehubbd2@gmail.com`
    - **Physical Address:** `2/13 Eastern Plaza Shopping Complex, Hatirpool, Dhaka 1205`
    - **Website:** `https://mobilehubbd.tech`
- **Internal / Infrastructure Codename:** `NovaMobile`
  - Used in PostgreSQL database name (`novamobile`), storage keys (`novamobile_staff_token`, `novamobile_customer_token`), PM2 daemon processes (`novamobile-api`, `novamobile-web`), and server deployment path (`/var/www/novamobile`).

### 1.3 Tech Stack & Core Dependencies
- **Frontend Web (`/`):**
  - **Framework:** Next.js `14.2.35` (App Router, Server Components + Client Components)
  - **Runtime & Language:** Node.js 20.x, React 18, TypeScript 5
  - **Styling:** Tailwind CSS 3.4.1, Lucide React icons, Radix UI primitives
  - **State & Tables:** React Hook Form 7.85, Zod 4.4, TanStack React Table 8.21.3, Recharts 3.10
  - **PDF Export:** Browser Print CSS + Puppeteer Core 25.12 for thermal receipt generation
- **Backend API (`/api`):**
  - **Framework:** NestJS 11.0.1 (Express platform)
  - **Database & ORM:** PostgreSQL 16, Prisma ORM 5.22.0
  - **Authentication:** Passport JWT, bcrypt password hashing, Refresh Token rotation in DB
  - **Storage:** Dual-engine (`StorageService`) supporting local disk storage (`/uploads`) and Cloudflare R2 (AWS S3 SDK)
  - **Security:** Helmet, CORS origin whitelisting, Throttler rate limiting, BigInt/Decimal JSON serialization

---

## 2. Synthesis of All Historical Analysis & Audit Reports

The repository contains numerous audit reports created across various development phases. Below is the master synthesis reconciling what was claimed versus actual codebase reality:

| Historical Report File | Primary Objective | Audited Findings & Code Reality | Current Resolution Status |
| :--- | :--- | :--- | :--- |
| **`QA_AUDIT_REPORT.md`** | Initial Playwright QA audit covering 17 UI & state defects | Identified 17 initial defects in category filtering, cart updates, and broken form links. | ✅ **Resolved** in Fix Passes 1–10. |
| **`PHASE5_CATALOG_VERIFICATION_REPORT.md`** | Taxonomy, categories, attributes, and brand hierarchy | Confirmed dynamic attributes (colors, storage), multi-select category filters, and product variant relationships. | ✅ **Verified & Active** in `api/src/product`. |
| **`PHASE6_SALES_ORDERS_VERIFICATION_REPORT.md`** | Order state machine, stock deduction, and status transitions | Audited `ALLOWED_TRANSITIONS` map; verified atomic stock deduction via `$transaction`. | ✅ **Verified & Active** in `api/src/order`. |
| **`PHASE7_HRM_ACCOUNTING_REPORT_VERIFICATION_REPORT.md`** | HRM, payroll, technician profit share, and expense wallets | Audited technician 50/50 profit ledger, payroll calculation, and branch-scoped expenses. | ✅ **Verified & Active** in `api/src/service-job` & `payroll`. |
| **`PHASE8_MARKETING_CMS_PAYMENT_VERIFICATION_REPORT.md`** | Marketing banners, promo codes, bKash & SSLCommerz gateways | Audited promo code validation, gateway callbacks, and footer/menu CMS management. | ✅ **Verified & Active** in `api/src/payment`. |
| **`MOCK_DATA_AUDIT.md`** | Audit of synthetic database test rows vs production clean data | Found 1,124 synthetic customer rows and 64 test product rows created during automated stress testing. | ✅ **Resolved** in Pass 42: dead mock files purged from `src/lib/mock-data/`. |
| **`PDF_EXPORT_BUG_DIAGNOSTIC.md`** | Diagnostic on POS invoice layout clipping in Chrome vs Safari | Diagnosed dotted line strike-through and badge clipping on WebKit/Safari. | ✅ **Resolved** in Pass 35 & 36. |
| **`PASS36_EXPORT_ALIGNMENT_REPORT.md`** | Cross-browser invoice export fix implementation | Replaced CSS `translateY` and text-decoration dots with flex-sibling borders. | ✅ **Verified & Active** in `PosInvoiceModal.tsx`. |
| **`docs/audit/00_MASTER_AUDIT_REPORT.md`** through **`05_FIX_PRIORITY_ROADMAP.md`** | Pre-deployment comprehensive audit across 84 models and 137 routes | Divided required remediation into Batch A (Security/Data Integrity), Batch B (Demo Readiness), Batch C (Debt). | ✅ **All Batches Completed** in Passes 38–42. |
| **`docs/HANDOFF_CONTEXT.md`** | Technical handoff blueprint | Full verified file-by-file citations for all 84 models and 53 controllers. | ✅ **Core Reference Document**. |

---

## 3. End-to-End File Upload Architecture & Storage Engine

One of the most critical subsystems is the file upload and media resolution pipeline. Here is exactly where and how files are handled from frontend form to persistent storage.

```mermaid
graph TD
    A[Frontend Admin / Client Form] -->|multipart/form-data| B[NestJS Controller Endpoint]
    B -->|FileInterceptor / FilesInterceptor| C[Multer Config: sanitize & validate]
    C -->|Stores Temp File| D[Local /uploads/{subfolder}]
    B -->|Calls resolveUploadedFile| E[StorageService.uploadFile]
    E -->|Is R2 Configured?| F{R2 Credentials in .env?}
    F -->|Yes| G[AWS S3 SDK: PutObject to Cloudflare R2]
    G -->|Returns CDN URL| H[Save https://... in PostgreSQL DB]
    F -->|No| I[Retains local path /uploads/{subfolder}/{file}]
    I -->|Returns Local Path| H
    H -->|Served to Storefront| J[api-client: getImageUrl]
    J -->|Production Nginx| K[Nginx /uploads/ alias direct disk cache]
```

### 3.1 Upload Pipeline Architecture
1. **Multer Interceptor Configuration (`api/src/common/upload/multer.config.ts`):**
   - **Allowed Mime Types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`, `application/pdf`.
   - **File Size Limit:** 5MB max per file (`MAX_FILE_SIZE = 5 * 1024 * 1024`).
   - **Security Sanitization:**
     - Subfolders are strictly sanitized using regex `replace(/[^a-zA-Z0-9_-]/g, '')` to completely block directory traversal attacks.
     - Filenames are randomized using UUIDs: `${crypto.randomUUID()}-${safeBaseName}${ext}` to prevent filename collisions and execution exploits.
2. **Dual-Mode Storage Service (`api/src/common/upload/storage.service.ts`):**
   - **Mode A (Cloudflare R2 Object Storage):**
     - Initialized if `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` are set in `api/.env`.
     - Automatically streams the file buffer to Cloudflare R2 using `@aws-sdk/client-s3`.
     - Unlinks the local temp disk file after successful S3 `PutObjectCommand`.
     - Returns public CDN URL (`https://<public-url>/<subfolder>/<filename>`).
   - **Mode B (Persistent Local Disk Storage):**
     - If R2 credentials are unset, falls back gracefully to `UPLOAD_ROOT` (`/var/www/novamobile/uploads` or `./uploads`).
     - Returns `/uploads/<subfolder>/<filename>`.
3. **Serving Uploaded Assets:**
   - **Local Dev:** `main.ts:54` serves `/uploads/` via `app.useStaticAssets(uploadDir, { prefix: '/uploads/' })`.
   - **Production VPS:** Nginx reverse proxy bypasses Node.js entirely for media files. `deploy/nginx-api.conf` serves `/uploads/` directly from `/var/www/novamobile/uploads/` with 30-day client caching.
   - **Frontend URL Resolution (`src/lib/api-client.ts:159-168`):**
     - Function `getImageUrl(path)` handles all paths:
       - If full URL (`http://` or `https://`): returns as-is.
       - If relative `/uploads/...`: prepends `NEXT_PUBLIC_BACKEND_URL` (`http://localhost:4000` or production domain).
       - If `placehold.co`: replaces with local SVG placeholder `/images/placeholder.png`.

### 3.2 Inventory of Upload Endpoints & Subfolders

| Entity | Endpoint & Method | Multer Interceptor | Target Subfolder | File Key |
| :--- | :--- | :--- | :--- | :--- |
| **Product Images** | `POST /api/v1/products` & `PATCH .../:id` | `FilesInterceptor('images', 10)` | `products` | `images` (Up to 10 photos) |
| **Banners** | `POST /api/v1/banners` & `PATCH .../:id` | `FileInterceptor('image')` | `banners` | `image` |
| **Brands** | `POST /api/v1/brands` & `PATCH .../:id` | `FileInterceptor('logo')` | `brands` | `logo` |
| **Categories** | `POST /api/v1/categories` & `PATCH .../:id` | `FileInterceptor('image')` | `categories` | `image` |
| **Blogs** | `POST /api/v1/blogs` & `PATCH .../:id` | `FileInterceptor('image')` | `blogs` | `image` |
| **Promotional Ads** | `POST /api/v1/ads` & `PATCH .../:id` | `FileFieldsInterceptor` | `ads` | `desktopImage`, `mobileImage` |
| **Staff & Technician** | `POST /api/v1/employees` | `FileFieldsInterceptor` | `employees` | `photo`, `nidDocumentUrl` |
| **Customer Profile** | `POST /api/v1/customers` | `FileInterceptor('image')` | `customers` | `image` |
| **Purchase Invoices** | `POST /api/v1/purchase-orders` | `FileInterceptor('document')` | `purchase-documents`| `document` |
| **Expense Receipts** | `POST /api/v1/expenses` | `FileInterceptor('attachment')` | `expenses` | `attachment` |
| **Site Branding/Logo** | `POST /api/v1/business-settings/upload` | `FileInterceptor('file')` | `settings` | `file` (Logo, Favicon) |

---

## 4. Core API Architecture & Key Business Flows

The backend exposes 53 controllers and 382 endpoints. Below are the critical business workflows implemented:

### 4.1 Authentication & RBAC System
- **Dual Identity Pools:**
  - `Customer` (Storefront shoppers) stored in table `Customer`. Token key: `novamobile_customer_token`.
  - `Staff` (Admin, Manager, Cashier, Technician) stored in table `Staff`. Token key: `novamobile_staff_token`.
- **JWT Lifecycles:**
  - Access Token: 15 minutes (`JWT_ACCESS_EXPIRY=15m`).
  - Refresh Token: 7 days (`JWT_REFRESH_EXPIRY=7d`), tracked in table `RefreshToken` with database rotation.
- **Role Permission Guard (`PermissionsGuard`):**
  - Evaluates `@RequirePermission(ModuleName, PermissionAction)`.
  - Enforces `PermissionScope`:
    - `GLOBAL`: Unrestricted across all branches.
    - `OWN_BRANCH`: Automatically limits query filters to `user.branchId`.
  - Financial Data Masking: Staff without `REPORT:READ` permissions receive `0` on sensitive financial metrics (profit, expenses, supplier dues).

### 4.2 POS Terminal & Serialized IMEI Tracking
- **Sale Execution (`POST /api/v1/pos/sale`):**
  - Handled in an atomic `prisma.$transaction`.
  - Validates stock for each item:
    - Accessories / Standard Products: Decrements `ProductVariant.stock` and `BranchInventory.quantity`.
    - Physical Smartphones: The cashier selects a specific 15-digit IMEI from `PhoneUnit` dropdown. Transaction updates `PhoneUnit.status = 'SOLD'` and attaches `orderId`.
  - Generates thermal POS invoice receipt with barcode and breakdown.

### 4.3 E-Commerce Storefront COD & Online Payments
- **Guest / Customer Checkout (`POST /api/v1/orders/checkout`):**
  - Atomic `$transaction` decrements stock immediately to prevent overselling race conditions.
  - Generates `Order` with `status = 'PENDING'` and tracking code `EM...`.
- **Online Payment IPN Callbacks (`/payments/sslcommerz/callback` & `/payments/bkash/callback`):**
  - Gateway IPN posts status to backend callback. Backend verifies gateway signature.
  - If inventory was exhausted during payment, PostgreSQL `CHECK (stock >= 0)` constraint prevents negative stock.
  - Backend catches constraint violation, logs payment, flags `Order.needsStockReview = true`, and notifies store manager.

### 4.4 Repair Servicing & Technician 50/50 Profit Sharing
- **Service Job Pipeline (`/api/v1/service-jobs`):**
  - Status progression: `RECEIVED` → `DIAGNOSING` → `PENDING_APPROVAL` → `APPROVED` → `REPAIRING` → `COMPLETED` → `DELIVERED`.
  - Technicians can consume internal workshop spare parts (`POST /service-jobs/:id/materials`) or log external parts ("Sourced From Outside").
  - On job completion, backend calculates:
    $$\text{Technician Commission} = (\text{Customer Charge} - \text{Material Cost}) \times \frac{\text{Profit Share \%}}{100}$$
  - The calculated share is automatically credited to the technician's ledger and payroll commission summary.

### 4.5 Multi-Branch Stock Requisition & Transfer
- **Requisition Flow (`/api/v1/product-requests`):**
  - Branch Manager requests stock from Flagship (`BR-DHK`) or Warehouse (`BR-SYL`).
  - Status: `PENDING` → `APPROVED` → `DISPATCHED` → `RECEIVED`.
  - Dispatched status decrements source branch inventory; Received status increments target branch inventory.

---

## 5. Route Mapping & Controller Catalog

### 5.1 Storefront & Customer Portal (23 Routes)
- **Storefront:**
  - `/` — Homepage (Hero carousel, featured categories, flash deals, new arrivals)
  - `/category/[slug]` — Multi-faceted filter catalog (Brand, Color, Price range, In-stock)
  - `/product/[slug]` — Product detail page (Dynamic variants, IMEI specs, Call/WhatsApp order, warranty info)
  - `/phones` — Dedicated smartphone showcase
  - `/cart` & `/checkout` — Cart drawer, delivery charge calculation (Dhaka ৳60 / Outside ৳120), guest checkout
  - `/order/confirmation/[orderId]` & `/order/payment-failed` — Payment outcome screens
  - `/blog` & `/blog/[slug]` — Tech news and repair tips
  - `/about`, `/contact`, `/privacy`, `/terms` — Informational CMS pages
- **Customer Account Portal:**
  - `/login` & `/register` — Customer authentication
  - `/account` — Profile overview
  - `/account/orders` — Order history and live shipment tracking
  - `/account/profile`, `/account/address`, `/account/change-password`, `/account/wishlist`, `/account/support`

### 5.2 Admin Portal (101 Routes across 14 Sections)
- **POS & Sales:** `/admin/pos`, `/admin/pos/invoice-print/[orderId]`, `/admin/orders`, `/admin/sales/*`, `/admin/sales-returns/*`, `/admin/exchanges/*`
- **Catalog Management:** `/admin/products`, `/admin/products/create`, `/admin/products/bulk`, `/admin/products/attributes`, `/admin/products/brands`, `/admin/products/series`, `/admin/products/units`, `/admin/category`
- **Inventory & IMEI:** `/admin/stock-adjustments/*`, `/admin/products/wanted`, `/admin/products/wasted`, `/admin/branch/product-requests/*`
- **Repair Servicing:** `/admin/servicing`, `/admin/servicing/create`, `/admin/technician`, `/admin/technician/servicing-report`
- **Accounting & Procurement:** `/admin/accounting/purchase/*`, `/admin/accounting/suppliers`, `/admin/accounting/expense/*`, `/admin/accounting/wallet/*`
- **HRM & Payroll:** `/admin/hrm/departments`, `/admin/hrm/employees`, `/admin/hrm/payroll`, `/admin/hrm/roles-permissions`, `/admin/hrm/technicians`
- **Marketing & CMS:** `/admin/marketing/banners`, `/admin/marketing/ads`, `/admin/marketing/blogs`, `/admin/marketing/promo-code`, `/admin/marketing/push-notification`, `/admin/cms/*`
- **Business Settings & Integrations:** `/admin/business-settings/*`, `/admin/3rd-party`
- **Reports:** `/admin/reports/summary`, `/admin/reports/pos-sales`, `/admin/reports/service-sales`, `/admin/reports/product-stock`, `/admin/reports/expense`, `/admin/reports/purchase`, `/admin/reports/transactions`

---

## 6. Chronological Log of Fix Passes (Pass 1 through Pass 44)

The project underwent 44 structured iterative development and hardening passes:

- **Passes 1–10:** Storefront hydration fixes, category multi-select filters, attribute bindings, initial schema stabilization.
- **Passes 11–18:** HRM CRUD, supplier ledgers, multi-wallet treasury, Cloudflare R2 storage integration.
- **Passes 19–26:** Serialized smartphone IMEI barcode tracking (`PhoneUnit`), POS Add-to-Cart variant modal, unified payroll modal (`AddSalaryPayrollModal.tsx`), Customer CRM.
- **Passes 27–33:** Route guards, branch-scoped expenses, multi-branch stock requisitions, 50/50 technician profit ledger.
- **Passes 34–36:** Cross-browser thermal print alignment (Safari vs Chrome), flex-sibling dotted lines on POS receipt.
- **Passes 37–41 (Batch A & B Audit Execution):**
  - `SEC-001`: Runtime enforcement of 32+ char cryptographic JWT secrets.
  - `SEC-002`: Strict CORS origin validation without stack trace leakage.
  - `REG-001`: Form image uploads unified to `STAFF_TOKEN_KEY`.
  - `DATA-002`: PostgreSQL `CHECK (stock >= 0)` non-negative constraints.
  - Composite high-traffic database performance indexes.
  - Root `not-found.tsx`, `error.tsx`, `global-error.tsx`, `sitemap.ts`, `robots.ts`.
  - Multi-role smoke test suite (104 role checks, 225 negative RBAC tests).
  - Financial KPI masking on dashboard cards.
- **Pass 42:** Purged 54 dead mock data files from `src/lib/mock-data/` (~1MB) and handled empty UI states.
- **Pass 43:** Restored the `"Select Your Role"` UX dropdown on `/admin/login` while preserving server-side RBAC validation.
- **Pass 44:**
  - Centralized official store details into `src/config/contact.ts` and `api/src/common/constants/contact.ts`.
  - Replaced all customer-facing dummy phone numbers (`01700000000`) across product and checkout pages.
  - Hardened database seed script (`seed.ts`) to require `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (min 12 chars) in production while gating demo accounts behind `SEED_DEMO=true`.

---

## 7. Developer & DevOps Runbook

### 7.1 Running Locally
1. **Prerequisites:** Node.js 20.x, PostgreSQL 16 (running on port 5432).
2. **Start Backend API (Port 4000):**
   ```bash
   cd api
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run start:dev
   ```
3. **Start Frontend Web (Port 3000):**
   ```bash
   npm install
   npm run dev
   ```
4. **Access Credentials:**
   - **Admin Login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
   - **Super Admin:** Configured via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (minimum 14 characters, non-demo) during `npm run bootstrap:prod`.

### 7.2 Zero-Downtime VPS Deployment Runbook
The deployment architecture is fully scripted in `deploy/deploy.sh` and root `deploy.sh`.
- **Target VPS Layout:**
  - Code Directory: `/var/www/novamobile/app`
  - Uploads Directory (Persistent): `/var/www/novamobile/uploads`
  - Backups Directory: `/var/www/novamobile/backups`
- **Execution Safeguards:**
  - Script refuses to run as root (`UID 0`) unless `ALLOW_ROOT=1` is passed.
  - Strictly uses `npm ci` (never modifies `package-lock.json`).
  - Applies non-destructive migrations via `npx prisma migrate deploy`.
  - Sets `NODE_OPTIONS="--max-old-space-size=2048"` to prevent VPS OOM during Next.js builds.
  - Automatically verifies health endpoints on ports 4000 and 3000 after PM2 atomic reload.
- **Deployment Command:**
  ```bash
  cd /var/www/novamobile/app
  ./deploy/deploy.sh
  ```

---

## 8. Summary for Incoming Agents

1. **Do not create mock data files:** Always consume the real NestJS API endpoints. All entities have full CRUD backend backing.
2. **Do not modify RBAC or Auth rules lightly:** The permissions system is strictly role-scoped via `@RequirePermission`.
3. **Image uploads must use `resolveUploadedFile` / `resolveUploadedFiles`:** Any new upload feature must pass through `createMulterConfig` in `multer.config.ts` to respect Cloudflare R2 and local disk fallback.
4. **Contact details must be imported from `src/config/contact.ts`:** Never hardcode store phone numbers, emails, or addresses.
5. **Always verify builds before pushing:** Both `cd api && npm run build` and root `npm run build` must complete with 0 errors.
