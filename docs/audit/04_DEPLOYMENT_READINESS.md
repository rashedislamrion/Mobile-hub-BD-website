# NovaMobile / MobileHubBD — Deployment Readiness Assessment
**Audit Date:** October 2, 2026  
**Auditor Mode:** Read-Only Audit & Deployment Pre-Flight  
**Status:** **YES-WITH-FIXES** (Production code compiles cleanly; critical configuration, security, and data remediation required prior to live customer traffic)

---

## 1. Executive Build & Compilation Assessment

### 1.1 Compilation Verification Results
Both frontend and backend applications were compiled using production build commands in a clean environment:

| Application | Command | Result | Output Summary |
| :--- | :--- | :---: | :--- |
| **Frontend (Next.js 14)** | `npx tsc --noEmit` | **PASSED** | 0 TypeScript errors across all 137 App Router pages and 120+ components. |
| **Frontend (Next.js 14)** | `npm run build` | **PASSED** | 124 static and dynamic routes compiled into production `.next` chunks with 0 warnings/errors. |
| **Backend (NestJS 10)** | `npx tsc --noEmit` | **PASSED** | 0 TypeScript errors across 42 modules, 38 controllers, and 45 services. |
| **Backend (NestJS 10)** | `npm run build` (`nest build`) | **PASSED** | Clean `dist/` compilation under target ES2021 with source-maps. |
| **Prisma ORM** | `npx prisma migrate status` | **PASSED** | Database schema is in sync with `migrations/20260309172233_init/migration.sql`. Zero schema drift. |

### 1.2 Deployment Feasibility Verdict
The core software architecture is sound and syntactically free of build-breaking flaws. However, deploying into production today without addressing authentication secrets, CORS wildcarding, disk upload ephemerality, and missing database constraints would create immediate security and data corruption vulnerabilities.

---

## 2. Environment Variables Specification

### 2.1 Frontend Environment Variables (Vercel / VPS)
All frontend variables are prefixed with `NEXT_PUBLIC_` because the App Router components and client-side auth context execute within user browsers:

| Variable Name | Required | Default / Fallback | Description & Production Value |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_API_URL` | **YES** | `http://localhost:4000/api/v1` | Public HTTPS REST endpoint used by Axios and client fetchers. Example: `https://api.novamobile.com.bd/api/v1` |
| `NEXT_PUBLIC_BACKEND_URL` | **YES** | `http://localhost:4000` | Root host for serving static uploads when R2 is bypassed. Example: `https://api.novamobile.com.bd` |
| `NEXT_PUBLIC_SITE_URL` | OPTIONAL | `http://localhost:3000` | Canonical origin for OpenGraph meta tags, sitemaps, and robots.txt. Example: `https://novamobile.com.bd` |

### 2.2 Backend Environment Variables (VPS / Render / Railway)
The backend requires strict configuration for database pooling, cryptographic token signatures, object storage, and payment gateway webhooks:

| Variable Name | Required | Insecure Fallback | Purpose & Production Recommendation |
| :--- | :---: | :---: | :--- |
| `PORT` | NO | `4000` | Port on which NestJS Express binds. Set to `4000` or system assigned port. |
| `NODE_ENV` | **YES** | `development` | Set explicitly to `production` to disable debug verbosity and enable optimized caching. |
| `DATABASE_URL` | **YES** | None | PostgreSQL connection URI. If using Neon or Supabase, use connection pooler URL with `?pgbouncer=true&sslmode=require`. |
| `DIRECT_URL` | OPTIONAL | None | Direct unpooled PostgreSQL URI for executing `prisma migrate deploy` DDL migrations. |
| `JWT_ACCESS_SECRET` | **CRITICAL** | `'access-secret'` | 64+ char cryptographic key for signing short-lived access tokens (`openssl rand -hex 32`). **Must not be omitted.** |
| `JWT_ACCESS_EXPIRY` | NO | `15m` | Token lifespan. Standard: `15m` or `30m`. |
| `JWT_REFRESH_SECRET` | **CRITICAL** | `'refresh-secret'` | 64+ char cryptographic key for signing refresh tokens (`openssl rand -hex 32`). **Must not be omitted.** |
| `JWT_REFRESH_EXPIRY` | NO | `7d` | Token lifespan. Standard: `7d` or `30d`. |
| `ALLOWED_ORIGINS` | **CRITICAL** | Wildcard Fallback | Comma-separated whitelist of client origins permitted by CORS. Example: `https://novamobile.com.bd,https://admin.novamobile.com.bd`. |
| `FRONTEND_URL` | **YES** | None | Primary storefront URL used for generating redirect URLs in payment gateway flows. |
| `API_URL` | **YES** | None | Public API URL used by IPN callback handlers for SSLCommerz and bKash redirects. |
| `R2_ACCOUNT_ID` | **YES (Prod)** | None | Cloudflare Account ID for S3-compatible media upload. Required to prevent upload data loss on container restart. |
| `R2_ACCESS_KEY_ID` | **YES (Prod)** | None | Cloudflare R2 API token access key. |
| `R2_SECRET_ACCESS_KEY` | **YES (Prod)** | None | Cloudflare R2 API token secret access key. |
| `R2_BUCKET_NAME` | **YES (Prod)** | None | Target R2 bucket name. Example: `novamobile-media-prod`. |
| `R2_PUBLIC_URL` | **YES (Prod)** | None | Public CDN or custom domain mapped to R2 bucket. Example: `https://cdn.novamobile.com.bd`. |
| `UPLOAD_ROOT` | NO | `./uploads` | Local fallback directory if R2 is not provided. Requires persistent VPS disk mount if used in production. |
| `SSLCOMMERZ_STORE_ID` | OPTIONAL | None | Store ID provided by SSLCommerz merchant panel. |
| `SSLCOMMERZ_STORE_PASS` | OPTIONAL | None | Store Password provided by SSLCommerz merchant panel. |
| `SSLCOMMERZ_IS_LIVE` | OPTIONAL | `false` | Boolean switch: `true` for live production transactions, `false` for sandbox simulator. |
| `BKASH_APP_KEY` | OPTIONAL | None | Merchant App Key provided by bKash PGW portal. |
| `BKASH_APP_SECRET` | OPTIONAL | None | Merchant App Secret provided by bKash PGW portal. |
| `BKASH_USERNAME` | OPTIONAL | None | API Username provided by bKash. |
| `BKASH_PASSWORD` | OPTIONAL | None | API Password provided by bKash. |
| `BKASH_IS_LIVE` | OPTIONAL | `false` | Boolean switch: `true` for live production PGW, `false` for sandbox simulator. |

---

## 3. Database Migration, Seeding & Maintenance

### 3.1 Migration Execution Protocol
The production deployment pipeline must execute:
```bash
# In api/ directory:
npx prisma migrate deploy
```
- **Readiness**: The single baseline migration `20260309172233_init` covers all 84 tables.
- **Safety**: `prisma migrate deploy` executes transactionally without prompting or resetting data.
- **Recommended DDL Migration Script**: Prior to live traffic, apply SQL performance indexes and negative-quantity check constraints via a new migration:
  ```bash
  npx prisma migrate dev --name add_perf_indexes_and_checks --create-only
  ```

### 3.2 Seeding Plan & Idempotency Analysis
File: `api/prisma/seed.ts`
- **Idempotency**: **VERIFIED IDEMPOTENT**. The script exclusively utilizes `prisma.role.upsert`, `prisma.rolePermission.upsert`, `prisma.staff.upsert`, `prisma.branch.upsert`, and `findFirst` checks. Re-running the seed script against an existing database will not duplicate records or overwrite live transactional IDs.
- **Bootstrap Output (`npm run bootstrap:prod`)**:
  - 10 System Roles with canonical permission matrices.
  - 1 Super Admin provisioned via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (all-branches scope).
  - System configs: Country (Bangladesh), BusinessSettings, PaymentGatewayConfigs (COD active, BKASH/SSLCOMMERZ inactive).
- **Post-Deploy Action**: Keep initial credentials secure and manage staff accounts through Admin Panel.

---

## 4. Media Storage & Upload Strategy

### 4.1 Local Disk vs Cloudflare R2
The codebase features a dual-mode storage engine in `api/src/common/upload/storage.service.ts`:
1. **Cloudflare R2 (Recommended & Built-in)**:
   - When `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` are supplied in `.env`, `StorageService` initializes `@aws-sdk/client-s3` pointing to Cloudflare's edge.
   - Files are streamed to R2, and public URLs (`https://cdn.novamobile.com.bd/<key>`) are written to PostgreSQL.
   - **Advantage**: Fully compatible with ephemeral hosting (Render, Railway, Fly.io, or container restarts) with zero egress bandwidth charges.
2. **Local Disk Storage (`/uploads`)**:
   - If R2 environment variables are absent, Multer writes files to `process.env.UPLOAD_ROOT || join(process.cwd(), 'uploads')` and Express serves them via `app.useStaticAssets`.
   - **CRITICAL WARNING**: If deployed on Render or Docker without a persistent volume mount, any container restart or redeploy will permanently delete all uploaded product images and employee photos.

---

## 5. Security & Network Configuration

### 5.1 Domain & CORS Architecture
In production:
- **Frontend Origin**: `https://novamobile.com.bd` (and `https://admin.novamobile.com.bd` if separated).
- **Backend Origin**: `https://api.novamobile.com.bd`.
- **CORS Configuration**:
  - In `api/src/main.ts`, remove the fallback `callback(null, true)` (line 70) and restrict CORS strictly to `process.env.ALLOWED_ORIGINS`.
  - Ensure `credentials: true` is retained for cookie-based refresh tokens.

### 5.2 Rate Limiting (Throttler)
- Currently in `api/src/app.module.ts:63-68`, Throttler is set globally to `limit: 1000, ttl: 60000` (1000 requests per minute).
- **Production Action**: Apply a strict `@Throttle({ default: { limit: 5, ttl: 60000 } })` decorator on `POST /auth/login` and `POST /auth/customer/login` to prevent password brute-forcing.

### 5.3 Health Check Monitoring
- **Endpoint**: `GET /api/v1/health` (implemented in `api/src/app.controller.ts:16-25`).
- **Response**:
  ```json
  {
    "status": "ok",
    "uptime": 1420.52,
    "timestamp": "2026-10-02T02:30:00.000Z",
    "service": "mobilehubbd-api",
    "environment": "production"
  }
  ```
- **Monitoring Integration**: Point UptimeRobot, BetterUptime, or AWS Route53 health checks directly to `https://api.novamobile.com.bd/api/v1/health` with a 30-second interval.

---

## 6. Production Infrastructure Essentials

### 6.1 Process Management (PM2 Ecosystem)
For VPS deployments (Ubuntu 22.04 / 24.04 LTS), create `api/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'novamobile-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
```

### 6.2 Reverse Proxy Configuration (Nginx)
Recommended Nginx block for `api.novamobile.com.bd`:
```nginx
server {
    server_name api.novamobile.com.bd;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.3 Database Backup Strategy
For production PostgreSQL:
1. **Daily Automated Snapshots**: Configure managed provider (Neon, Supabase, or AWS RDS) for 7-day point-in-time recovery (PITR).
2. **Offsite Cron Backup**: For self-hosted PostgreSQL, execute daily automated `pg_dump` compressed to Cloudflare R2 or AWS S3:
   ```bash
   pg_dump -Fc $DATABASE_URL | gzip > /backups/novamobile_$(date +%Y%m%d_%H%M%S).dump.gz
   ```

---

## 7. Demo-Readiness Seeding Requirements

When presenting the live website to the client, an empty storefront will result in an immediate perception of an incomplete project. The current database contains synthetic test records (`test_imei_179...`, `Synthetic Customer 419`).

Before demonstrating the system to stakeholders:
1. **Catalog Dataset**: Seed 15 realistic mobile phone models across top brands (Apple iPhone 15/16 Pro, Samsung Galaxy S24 Ultra, Xiaomi 14, Google Pixel 8/9 Pro) with actual specs, authentic product photos, and realistic BDT pricing.
2. **Banners & Sliders**: Upload 3 high-resolution homepage carousel banners (1920x600px) highlighting promotional smartphone launches and exchange offers.
3. **Menu Hierarchy**: Configure the navigation builder in Admin (`/admin/cms/menus`) to link "Smartphones", "Featured Brands", and "Accessories".
4. **Staff Logins**: Verify all operational role logins configured during setup operate smoothly:
   - Super Admin: Configured during bootstrap via environment variables.
   - Assigned Branch Staff & Roles: Configured via Admin HRM module.
