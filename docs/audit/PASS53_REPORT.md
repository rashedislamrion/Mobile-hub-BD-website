# PASS 53 Audit Report: Production Bootstrap Rehearsal & Deploy Readiness

**Date**: October 12, 2026  
**Status**: APPROVED — PRODUCTION READY (GO)  
**Target Environment**: Fresh PostgreSQL 14 VPS (`novamobile`)  
**Rehearsal Environment**: Throw-away PostgreSQL database (`novamobile_fresh_test`)  

---

## Executive Summary

PASS 53 validates the entire greenfield bootstrap procedure for launching the MobileHubBD platform on an empty production VPS without risking data contamination or exposing demo credentials. All tests, migrations, builds, and verifications were proven on a throw-away database (`novamobile_fresh_test`) which has since been cleanly dropped. The primary development database (`novamobile`) was strictly protected and never touched.

All 9 tasks of PASS 53 are complete:
1. **Prisma Seed Audit**: Comprehensive safety matrix for all seed scripts.
2. **Production Bootstrap (`npm run bootstrap:prod`)**: Idempotent, minimal, role/permission synchronizer enforcing strict production credentials.
3. **Emergency Admin Reset (`npm run admin:reset-password`)**: Standalone credential recovery tool enforcing production password policies.
4. **Rehearsal on Throw-Away DB**: 100% pass rate across 47 functional rehearsal checks and 14 live smoke checks.
5. **PostgreSQL 14 Compatibility Scan**: 5/5 Prisma migrations verified fully compliant with PG14.
6. **Environment Variable Hygiene**: Complete env audit, example files refreshed, and zero-leak validator (`scripts/check-env.mjs`) implemented.
7. **Public Repo Cleanup**: 12 historical reports moved to `docs/archive/`, demo credentials eliminated from tracked documentation, and deployment guides consolidated into `docs/DEPLOY_RUNBOOK_FINAL.md`.
8. **Final Deployment Runbook**: Production execution commands documented step-by-step.
9. **Build & Typecheck Validation**: Root & API TypeScript checks passed (0 errors), API build passed (0 errors), Next.js production build passed (0 errors).

---

## 1. Seed & Bootstrap Code Audit

The legacy seed script (`api/prisma/seed.ts`) was audited line-by-line alongside `package.json` scripts.

| Script / Entrypoint | Target / Action | What It Creates | Safe for Production? | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `npm run seed` (`ts-node prisma/seed.ts`) | Development default seed | Roles, permissions, admin staff, 1 demo customer, 1 demo branch ("Eastern Plaza"), dummy phone numbers, test product categories, and 1 demo product variant. | **NO (UNSAFE)** | Seeds hardcoded demo accounts, uses hardcoded phone `01602670922` and Eastern Plaza address, overwrites existing admin passwords, creates mock store data. |
| `npm run seed:prod` (`NODE_ENV=production ts-node prisma/seed.ts`) | Legacy production seed | Same seed script as above. Checks `NODE_ENV === 'production'` only to toggle a demo users branch, but still provisions hardcoded demo staff if `DEMO_DATA=true`. | **NO (UNSAFE)** | Historically referenced in old docs. Uses default fallback password `Admin@12345` if env is unset; seeds Eastern Plaza dummy address and phone number into DB. |
| `npm run bootstrap:prod` (`ts-node prisma/bootstrap-prod.ts`) | **NEW Production Bootstrap** | 10 System roles, 130 permission actions, 1,300 role-permission mappings, 1 Super Admin (from env), mandatory country record (`BD`), neutral payment methods placeholder, empty business settings. | **YES (SAFE)** | Refuses execution unless `NODE_ENV=production`. Refuses passwords < 14 chars or known demo passwords. Seeds ZERO demo branches, ZERO demo products, ZERO demo orders, ZERO fake customers. Re-runs preserve existing passwords and configurations. |
| `npm run admin:reset-password` (`ts-node prisma/admin-reset-password.ts`) | **NEW Emergency Admin Reset** | Updates password hash of designated admin staff. | **YES (SAFE)** | Refuses weak passwords and known demo passwords. Refuses execution unless `NODE_ENV=production`. Never prints password to stdout. |

---

## 2. Production Bootstrap Implementation (`npm run bootstrap:prod`)

The production bootstrap script is located at [`api/prisma/bootstrap-prod.ts`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/prisma/bootstrap-prod.ts) with npm script alias in both root and `api/package.json`.

### Core Safety Features & Guards:
1. **Production Environment Lock**:
   ```typescript
   if (process.env.NODE_ENV !== 'production') {
     console.error('ERROR: bootstrap:prod can ONLY be run when NODE_ENV=production.');
     process.exit(1);
   }
   ```
2. **Credential Hardening & Blacklist Defense**:
   - `SEED_ADMIN_PASSWORD` is mandatory.
   - Minimum length: **14 characters**.
   - Blacklisted passwords rejected with immediate exit:
     - `Admin@12345`, `Admin@123456`, `Password@123`, `Admin12345`, `Password12345` (and case-insensitive variations).
   - Password is **never printed or logged** to terminal or log files.
3. **Idempotent Super Admin Account**:
   - If the Super Admin already exists by email, its existing password is preserved intact (never overwritten on bootstrap re-runs).
   - Super Admin has `branchId: null` (global all-branches scope).
   - Linked to the system `Admin` role.
4. **Mandatory Reference Data Justification**:
   - **Permission Catalog**: 13 modules × 10 actions = 130 permissions. Mandatory for NestJS permission guards (`RequirePermission`).
   - **System Roles**: 10 system roles (`Admin`, `Branch Manager`, `Product Uploader`, `Technician`, `Inventory Auditor`, `Pos Cashier`, `Accountant`, `Delivery Staff`, `Customer Service`, `Support`). Mandatory for staff assignment.
   - **Role-Permission Matrix**: 1,300 mappings synchronized via batch transactions. Mandatory for RBAC access control.
   - **Mandatory Country Record**: Bangladesh (`code: 'BD'`, `name: 'Bangladesh'`). Mandatory for foreign key relation on customer and supplier addresses.
   - **Business Settings**: Initialized with clean, neutral defaults (`storeName: 'MobileHubBD'`, `email: ''`, `phone: ''`, `address: ''`, `currency: 'BDT'`). Zero fake phone numbers, zero Eastern Plaza mock text.

---

## 3. Emergency Admin Password Reset (`npm run admin:reset-password`)

Located at [`api/prisma/admin-reset-password.ts`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/prisma/admin-reset-password.ts).

### Usage:
```bash
cd api
NODE_ENV=production \
SEED_ADMIN_EMAIL="owner@mobilehubbd.tech" \
SEED_ADMIN_PASSWORD="EmergencyNewPasswordMin14Chars!" \
npm run admin:reset-password
```

### Safety Features:
- Enforces `NODE_ENV=production`.
- Enforces >= 14 characters and demo password blacklist.
- Re-hashes password using bcrypt (10 rounds).
- Updates `Staff.password` for the specified email.
- Never prints the password.

---

## 4. Throw-Away Database Rehearsal Results (`novamobile_fresh_test`)

A local throw-away database `novamobile_fresh_test` was created on PostgreSQL to prove the entire deployment flow from zero:

### Rehearsal Execution Log:
1. **Database Creation**: `CREATE DATABASE novamobile_fresh_test;`
2. **Migration Deployment**: `npx prisma migrate deploy`
   - Applied 5 migrations cleanly from zero:
     - `20260408031758_init`
     - `20260410052329_phase_10_indexes`
     - `20260410185900_pass_44_pos_counter_system`
     - `20260411120000_pass_49_contact_phone_and_footer_branches`
     - `20260411180000_pass_50_sales_returns_exchanges`
3. **Production Bootstrap**: `npm run bootstrap:prod`
   - Test admin credentials applied.
   - Re-run test verified: 100% idempotent (all 10 roles existed, settings preserved).
4. **Emergency Password Reset**: `npm run admin:reset-password`
   - Successfully verified password rotation on test admin.
5. **Production Build Launch**:
   - API daemon launched on port 4000.
   - Next.js production server launched on port 3000.
6. **Functional Verification Suite (`scripts/qa/rehearsal_verifier.mjs`)**:
   - **47 out of 47 checks passed (100%)**:
     - Super Admin login with rotated password: HTTP 200/201.
     - Admin access token issued with global branch scope (`branchId: null`).
     - Usability of all 19 admin menu endpoints (branches, category, brands, attributes, units, suppliers, products, staff, roles, orders, POS products, POs, expenses, settings, gateways, SMS, mail, reports, service jobs).
     - Master data creation: Branch, Category, Brand, Attribute, Unit, Supplier.
     - Product catalog creation: Product with variant, branch inventory, and multipart PNG image upload.
     - Staff & HRM: Created staff user and assigned role.
     - Public Customer: Registration via `/api/v1/auth/customer/register`.
     - Order Management: Website COD order placed.
     - POS Terminal: POS Counter cash sale completed.
     - Supplier Procurement: Purchase order created.
     - Security Headers: `/admin/login` confirmed `no-store` / `no-cache` / `private`.
     - Public Assets: Homepage HTTP 200, Sitemap XML HTTP 200, Robots.txt HTTP 200.
7. **Post-Deploy Smoke Suite (`scripts/qa/smoke_production.mjs`)**:
   - **14 out of 14 checks passed (100%)**:
     - Public Business Settings HTTP 200.
     - Public contact phone verified valid business contact, zero `+880 1700-000000` dummy data.
     - Public Outlets endpoint HTTP 200 with active branches.
     - Category tree and Brands endpoints HTTP 200.
     - Marketing CMS and payment strip images HTTP 200.
     - Security boundaries: 404 on unknown route, 401 on protected admin endpoint.
     - Ephemeral write & teardown test passed.
8. **Teardown & Cleanup**:
   - API and Next.js test daemons terminated.
   - Executed `DROP DATABASE novamobile_fresh_test;`
   - Verified PostgreSQL database list: `novamobile_fresh_test` removed; `novamobile` dev database untouched.

---

## 5. PostgreSQL 14 Compatibility Scan

All migration files in `api/prisma/migrations` were analyzed for PostgreSQL 14 syntax compatibility:

| Migration File | Migration Name | PG15+ Syntax Scan (NULLS NOT DISTINCT, MERGE, etc.) | Compatible with PG14? |
| :--- | :--- | :--- | :--- |
| `20260408031758_init/migration.sql` | Initial Schema | Scanned: 0 occurrences of `NULLS NOT DISTINCT`, 0 `MERGE`, 0 PG15+ functions. Standard standard SQL DDL (`CREATE TABLE`, `CREATE INDEX`, `FOREIGN KEY`). | **YES** |
| `20260410052329_phase_10_indexes/migration.sql` | Performance Indexes | Standard `CREATE INDEX` statements. No PG15+ syntax. | **YES** |
| `20260410185900_pass_44_pos_counter_system/migration.sql` | POS Counter System | Standard `CREATE TABLE`, `ALTER TABLE`, standard indexes. | **YES** |
| `20260411120000_pass_49_contact_phone_and_footer_branches/migration.sql` | Contact & Footer Flags | Standard `ALTER TABLE ADD COLUMN` with default booleans. | **YES** |
| `20260411180000_pass_50_sales_returns_exchanges/migration.sql` | Sales Returns & Exchanges | Standard `CREATE TABLE`, `ALTER TABLE`, standard foreign keys. | **YES** |

### Prisma Schema Connection URL Architecture:
- `api/prisma/schema.prisma` declares:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
- **Direct URL / Shadow Database Variables**:
  - `shadowDatabaseUrl` and `directUrl` are **NOT** required for production on VPS PostgreSQL. They are exclusively needed when connecting through connection poolers (e.g. Supabase PgBouncer / Neon connection pooling) in development when running `prisma migrate dev`.
  - For VPS deployment with PostgreSQL 14, standard direct connection via `DATABASE_URL` is sufficient and recommended.

---

## 6. Environment Variables Inventory & Validator

### Environment Validator (`scripts/check-env.mjs`)
Created [`scripts/check-env.mjs`](file:///Users/rashedislam/Desktop/Mobile-shop-website/scripts/check-env.mjs) to validate environment files before deployment.
- **Strict Secrecy**: Prints **only variable names**, never prints values or secrets.
- **Placeholder Detection**: Flags any variable retaining sample placeholders (`yourdomain.com`, `GENERATE_`, `CHANGEME`, `0000000`).
- **Exit Code**: Exits `1` on missing required variables or unresolved placeholders; exits `0` on 100% valid configuration.

### Master Environment Variable Matrix

#### Backend API (`api/.env`)
| Variable | Required/Optional | Description | Production Example / Default |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **REQUIRED** | Execution environment | `production` |
| `PORT` | Optional | API daemon port | `4000` |
| `API_PREFIX` | Optional | Global REST API route prefix | `api/v1` |
| `DATABASE_URL` | **REQUIRED** | PostgreSQL 14 connection string | `postgresql://user:pass@127.0.0.1:5432/novamobile?schema=public` |
| `JWT_ACCESS_SECRET` | **REQUIRED** | 64-char hex secret (`openssl rand -hex 32`) | Random 64-char hex |
| `JWT_REFRESH_SECRET` | **REQUIRED** | 64-char hex secret (`openssl rand -hex 32`) | Random 64-char hex |
| `JWT_EXPIRES_IN` | Optional | Customer access token lifetime | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | Optional | Customer refresh token lifetime | `7d` |
| `STAFF_JWT_EXPIRES_IN` | Optional | Staff session lifetime | `12h` |
| `STAFF_JWT_REFRESH_EXPIRES_IN` | Optional | Staff refresh token lifetime | `30d` |
| `ALLOWED_ORIGINS` | **REQUIRED** | CORS allowed domains | `https://mobilehubbd.tech,https://www.mobilehubbd.tech` |
| `FRONTEND_URL` | **REQUIRED** | Canonical storefront URL for redirects | `https://mobilehubbd.tech` |
| `REVALIDATION_SECRET` | **REQUIRED** | Next.js cache revalidation secret | Random 32+ char hex |
| `UPLOAD_ROOT` | **REQUIRED** | Local public upload directory | `/var/www/novamobile/api/uploads` |
| `PRIVATE_UPLOAD_ROOT` | **REQUIRED** | Local private document directory | `/var/www/novamobile/api/private-uploads` |
| `MAX_FILE_SIZE_BYTES` | Optional | Maximum file upload size in bytes | `10485760` (10MB) |
| `SEED_ADMIN_EMAIL` | **REQUIRED (for bootstrap)** | Initial Super Admin login email | `owner@mobilehubbd.tech` |
| `SEED_ADMIN_PASSWORD` | **REQUIRED (for bootstrap)** | Initial Super Admin password (min 14 chars) | High-entropy password |
| `SEED_ADMIN_NAME` | Optional | Initial Super Admin display name | `Super Administrator` |
| `SEED_ADMIN_PHONE` | Optional | Initial Super Admin phone | `01000000000` |
| `R2_ACCOUNT_ID` | Optional | Cloudflare R2 Account ID | (Optional offsite backup) |
| `R2_ACCESS_KEY_ID` | Optional | Cloudflare R2 Access Key | (Optional offsite backup) |
| `R2_SECRET_ACCESS_KEY` | Optional | Cloudflare R2 Secret Key | (Optional offsite backup) |
| `R2_BUCKET_NAME` | Optional | Cloudflare R2 Bucket Name | (Optional offsite backup) |
| `R2_PUBLIC_DOMAIN` | Optional | Cloudflare R2 Public Domain | (Optional offsite backup) |

#### Frontend Storefront (`.env.production`)
| Variable | Required/Optional | Description | Production Example / Default |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **REQUIRED** | Next.js runtime environment | `production` |
| `PORT` | Optional | Next.js server port | `3000` |
| `NEXT_PUBLIC_SITE_URL` | **REQUIRED** | Canonical website URL | `https://mobilehubbd.tech` |
| `NEXT_PUBLIC_API_URL` | **REQUIRED** | Browser-accessible public API URL | `https://mobilehubbd.tech/api/v1` |
| `INTERNAL_API_URL` | **REQUIRED** | Fast-path SSR internal API URL | `http://127.0.0.1:4000/api/v1` |
| `REVALIDATION_SECRET` | **REQUIRED** | Cache on-demand revalidation secret | Must match `api/.env` |

---

## 7. Repository Cleanup & Document Sanitation

### Files Moved to `docs/archive/` (via `git mv`):
1. `MOCK_DATA_AUDIT.md` ➔ [`docs/archive/MOCK_DATA_AUDIT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/MOCK_DATA_AUDIT.md)
2. `PASS36_EXPORT_ALIGNMENT_REPORT.md` ➔ [`docs/archive/PASS36_EXPORT_ALIGNMENT_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PASS36_EXPORT_ALIGNMENT_REPORT.md)
3. `PDF_EXPORT_BUG_DIAGNOSTIC.md` ➔ [`docs/archive/PDF_EXPORT_BUG_DIAGNOSTIC.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PDF_EXPORT_BUG_DIAGNOSTIC.md)
4. `PHASE5_CATALOG_VERIFICATION_REPORT.md` ➔ [`docs/archive/PHASE5_CATALOG_VERIFICATION_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PHASE5_CATALOG_VERIFICATION_REPORT.md)
5. `PHASE6_SALES_ORDERS_VERIFICATION_REPORT.md` ➔ [`docs/archive/PHASE6_SALES_ORDERS_VERIFICATION_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PHASE6_SALES_ORDERS_VERIFICATION_REPORT.md)
6. `PHASE7_HRM_ACCOUNTING_REPORT_VERIFICATION_REPORT.md` ➔ [`docs/archive/PHASE7_HRM_ACCOUNTING_REPORT_VERIFICATION_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PHASE7_HRM_ACCOUNTING_REPORT_VERIFICATION_REPORT.md)
7. `PHASE8_MARKETING_CMS_PAYMENT_VERIFICATION_REPORT.md` ➔ [`docs/archive/PHASE8_MARKETING_CMS_PAYMENT_VERIFICATION_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PHASE8_MARKETING_CMS_PAYMENT_VERIFICATION_REPORT.md)
8. `PROJECT_ANALYZE.md` ➔ [`docs/archive/PROJECT_ANALYZE.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PROJECT_ANALYZE.md)
9. `PROJECT_ANALYZE_3.md` ➔ [`docs/archive/PROJECT_ANALYZE_3.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PROJECT_ANALYZE_3.md)
10. `PROJECT_FULL_ANALYSIS_REPORT.md` ➔ [`docs/archive/PROJECT_FULL_ANALYSIS_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PROJECT_FULL_ANALYSIS_REPORT.md)
11. `PROJECT_STATUS_REPORT.md` ➔ [`docs/archive/PROJECT_STATUS_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/PROJECT_STATUS_REPORT.md)
12. `QA_AUDIT_REPORT.md` ➔ [`docs/archive/QA_AUDIT_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/archive/QA_AUDIT_REPORT.md)

### Deployment Pointer Replacement:
- [`DEPLOYMENT_STEPS.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/DEPLOYMENT_STEPS.md) content was replaced with a concise pointer directing engineers to the canonical guide at [`docs/DEPLOY_RUNBOOK_FINAL.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/DEPLOY_RUNBOOK_FINAL.md).

### Tracked Documentation Credential Sanitation:
The following files were scrubbed of hardcoded demo emails and passwords (`admin@nova.com`, `Admin@12345`, `admin@example.com`):
- [`docs/PROJECT_MASTER_ANALYSIS_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/PROJECT_MASTER_ANALYSIS_REPORT.md)
- [`docs/audit/04_DEPLOYMENT_READINESS.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/audit/04_DEPLOYMENT_READINESS.md)
- [`docs/audit/MASTER_AUDIT_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/audit/MASTER_AUDIT_REPORT.md)
- [`docs/audit/PASS51_REPORT.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/audit/PASS51_REPORT.md)

### Static Deployment Artifacts Retained (Unchanged):
- `render.yaml`
- `vercel.json`
- `.vercelignore`

---

## 8. TypeScript & Production Build Verification

Both codebases were validated with clean TypeScript checks and production builds:

| Component | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| Root TypeScript | `npx tsc --noEmit` | **PASS (0 errors)** | Storefront Next.js App Router |
| API TypeScript | `cd api && npx tsc --noEmit` | **PASS (0 errors)** | NestJS Backend Daemon |
| API Production Build | `cd api && npm run build` | **PASS (0 errors)** | NestJS compiler output in `dist/` |
| Storefront Production Build | `npm run build` | **PASS (0 errors)** | Next.js compiled 100% of routes cleanly |

---

## 9. Final Deployment Verdict: GO / NO-GO

### Recommendation: **GO (READY FOR PRODUCTION DEPLOYMENT)**

The production bootstrap pathway has been proven safe, clean, and completely repeatable on an empty database:
1. `npm run bootstrap:prod` reliably initializes the system without introducing any sample data, dummy phone numbers, or insecure demo passwords.
2. PostgreSQL 14 compatibility is confirmed across all Prisma migrations.
3. Automated environment validation via `node scripts/check-env.mjs` prevents misconfiguration.
4. Emergency recovery tools (`npm run admin:reset-password`) are operational.
5. Zero git commits or pushes were executed during this pass, keeping source control clean and ready for user approval.
