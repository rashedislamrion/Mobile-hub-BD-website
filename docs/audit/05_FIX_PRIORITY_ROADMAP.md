# NovaMobile / MobileHubBD — Fix Priority Roadmap & Execution Plan
**Audit Date:** October 2, 2026  
**Auditor Mode:** Read-Only Audit & Deployment Pre-Flight  
**Objective:** Shortest path to a secure, stable, professional live demo and deployment

---

## 1. Roadmap Architecture & Execution Batches

To transition NovaMobile to a live deployment efficiently, remediation tasks are segmented into three strictly ordered batches based on risk profile and operational impact:

```mermaid
graph TD
    subgraph Batch A [BATCH A: Pre-Deployment Gates - Must Fix Before ANY Deployment]
        A1[SEC-001: JWT Fallback Secrets]
        A2[SEC-002: CORS Universal Fallback]
        A3[SEC-003: POST /orders Customer RBAC]
        A4[REG-001: Staff Token Key Isolation]
        A5[DATA-001: IPN Webhook Stock Availability Check]
        A6[DATA-002: PostgreSQL Non-Negative Check Constraints]
    end

    subgraph Batch B [BATCH B: Client Demo Readiness - Must Fix Before Demo Access]
        B1[ARCH-001: Cloudflare R2 Upload Credentials]
        B2[DATA-003 & SEED-001: Synthetic Data Purge & Catalog Seeding]
        B3[PERF-001: High-Traffic Foreign Key Indexes]
        B4[UX-001: Next.js Root Error & 404 Boundaries]
    end

    subgraph Batch C [BATCH C: Post-Demo Hardening & Tech Debt]
        C1[DEBT-001: Purge Unused Mock Data Files]
        C2[LINT-001: Resolve Backend Lint Warnings]
    end

    Batch A --> Batch B
    Batch B --> Batch C
```

---

## 2. BATCH A: Pre-Deployment Security & Integrity Gates
*Absolute prerequisites. Do not point a public domain or open traffic to the backend until all items in Batch A are verified in code.*

### Batch A Issue Summary

| Order | Issue ID | Module | Severity | Summary | Effort | Parallel Safe |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: |
| **A.1** | `SEC-001` | Auth / Security | **BLOCKER** | Enforce non-empty JWT secrets; throw runtime error on startup if missing. | **S** (15m) | Yes (Backend) |
| **A.2** | `SEC-002` | API / CORS | **BLOCKER** | Remove permissive `callback(null, true)` fallback in `main.ts:70`. | **S** (15m) | Yes (Backend) |
| **A.3** | `REG-001` | Admin Forms | **HIGH** | Replace `localStorage.getItem("token")` with `STAFF_TOKEN_KEY` in 4 forms. | **S** (30m) | Yes (Frontend) |
| **A.4** | `SEC-003` | Orders / RBAC | **HIGH** | Add customer auth vs staff permission distinction and default branch in `POST /orders`. | **M** (1h) | No (Backend) |
| **A.5** | `DATA-001` | Payments / Stock | **HIGH** | Validate `stock >= quantity` inside payment IPN webhook transaction before decrements. | **M** (1h) | No (Backend) |
| **A.6** | `DATA-002` | Database DDL | **HIGH** | Add PostgreSQL `CHECK (stock >= 0)` constraints via migration. | **S** (30m) | No (Database) |

### Step-by-Step Execution Sequence (Batch A)
1. **Parallel Track 1 (Frontend)**:
   - Fix `REG-001`: In `EmployeeForm.tsx`, `banners/create/page.tsx`, `customers/create/page.tsx`, and `customers/[id]/edit/page.tsx`, import `STAFF_TOKEN_KEY` from `@/lib/auth-storage` and use `getStoredStaffToken()`. Verify admin file upload headers send legitimate bearer tokens.
2. **Parallel Track 2 (Backend Security)**:
   - Fix `SEC-001`: In `api/src/auth/strategies/jwt-access.strategy.ts`, `jwt-refresh.strategy.ts`, and `auth.service.ts`, remove default secret strings. Throw an explicit fatal exception if `process.env.JWT_ACCESS_SECRET` is unset.
   - Fix `SEC-002`: In `api/src/main.ts`, replace the fallback `callback(null, true)` with `callback(new Error('Disallowed by CORS policy'))`.
3. **Backend Order & Stock Logic**:
   - Fix `SEC-003`: In `api/src/order/order.controller.ts:100-103`, inspect caller identity: if staff, enforce `CREATE ORDERS` permission; if authenticated customer, automatically associate order with the customer profile and default flagship branch `BR-DHK`.
   - Fix `DATA-001`: In `api/src/payment/payment.service.ts`, wrap stock reduction in an optimistic lock or pre-flight query checking `stock >= quantity`. If insufficient, mark payment for manual reconciliation rather than driving inventory negative.
4. **Database Constraint Migration**:
   - Fix `DATA-002`: Create and apply a Prisma migration adding `CHECK (stock >= 0)` on `ProductVariant` and `BranchInventory`.

---

## 3. BATCH B: Client Demo Readiness & Performance
*Required before presenting the staging/live link to the client to ensure high visual fidelity and fast page loads.*

### Batch B Issue Summary

| Order | Issue ID | Module | Severity | Summary | Effort | Parallel Safe |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: |
| **B.1** | `ARCH-001` | Uploads / R2 | **MEDIUM** | Configure Cloudflare R2 credentials in production `.env`. | **S** (20m) | Yes (DevOps) |
| **B.2** | `DATA-003` & `SEED-001` | Data / Catalog | **HIGH** | Purge 1,124 synthetic test rows; seed 15 authentic smartphones + 3 banners. | **M** (1.5h) | Yes (Database) |
| **B.3** | `PERF-001` | Database Indexes | **HIGH** | Add B-Tree indexes on foreign keys (`categoryId`, `brandId`, `sku`, etc.). | **S** (30m) | Yes (Database) |
| **B.4** | `UX-001` | Storefront UX | **HIGH** | Create App Router `not-found.tsx` and `error.tsx` error boundaries. | **S** (45m) | Yes (Frontend) |

### Step-by-Step Execution Sequence (Batch B)
1. **Cloudflare R2 Bucket Provisioning (`ARCH-001`)**:
   - Create a Cloudflare R2 bucket (`novamobile-media`).
   - Populate `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_PUBLIC_URL` in backend `.env`.
   - Test by uploading one product photo from Admin; verify URL resolves over Cloudflare CDN.
2. **Catalog & Banner Seeding (`DATA-003`, `SEED-001`)**:
   - Run a clean script to delete synthetic customers with dummy emails (`synthetic_customer_*`), synthetic test IMEIs (`test_imei_*`), and invalid test orders.
   - Seed 15 genuine phone models (iPhone 16 Pro, Samsung S24, Pixel 9) across 5 categories with high-res images and variant configurations.
   - Seed 3 promotional banners for the homepage hero carousel.
3. **Index Optimization (`PERF-001`)**:
   - Add `@@index([categoryId, status])`, `@@index([brandId])`, `@@index([sku])` to `schema.prisma`.
   - Execute `npx prisma migrate dev --name add_perf_indexes`.
4. **UX Error Handling (`UX-001`)**:
   - Add `src/app/not-found.tsx` with a branded 404 illustration, search bar, and "Back to Homepage" CTA button.
   - Add `src/app/error.tsx` with friendly error recovery and reload triggers.

---

## 4. BATCH C: Post-Demo Hardening & Tech Debt
*Tasks that do not block demo access or deployment, scheduled for ongoing maintenance.*

### Batch C Issue Summary

| Order | Issue ID | Module | Severity | Summary | Effort | Parallel Safe |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: |
| **C.1** | `DEBT-001` | Cleanup | **MEDIUM** | Remove 54 dead mock data files in `src/lib/mock-data/` (~1MB). | **S** (15m) | Yes |
| **C.2** | `LINT-001` | Code Quality | **LOW** | Address 556 backend ESLint warnings (`any` typing in controllers/services). | **L** (3-4h) | Yes |

---

## 5. Summary of Effort & Timeline to Live Demo

| Phase | Tasks Included | Estimated Elapsed Time | Engineers Needed |
| :--- | :--- | :---: | :---: |
| **Batch A (Pre-Deploy)** | Security secrets, CORS, staff tokens, RBAC, stock logic | **3.5 hours** | 1 Fullstack Engineer |
| **Batch B (Demo Ready)** | R2 configuration, catalog seed, indexes, error UX | **3.0 hours** | 1 Fullstack Engineer |
| **Batch C (Post-Demo)** | Dead code cleanup, typing strictness | **4.0 hours** | 1 Engineer (Deferred) |
| **TOTAL TO LIVE DEMO** | **Batches A + B** | **~6.5 hours** | **1 Day Turnaround** |
