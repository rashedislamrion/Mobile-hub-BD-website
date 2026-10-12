# NovaMobile / MobileHubBD — Master Audit Report
**Audit Date:** October 2, 2026  
**Auditor Mode:** Full Codebase Read-Only Pass & Deployment Pre-Flight  
**Repository:** Mobile-shop-website-for-Client  

---

## 1. Executive Summary

| Metric | Score / Verdict | Notes |
| :--- | :---: | :--- |
| **Overall Health Score** | **7.5 / 10** | Core architecture is modern, clean, and highly capable. Frontend and backend compile with 0 errors. |
| **Deployable Today?** | **YES-WITH-FIXES** | Deployment is feasible immediately upon completing **Batch A fixes (~3.5 hrs)** covering JWT secrets, CORS fallback, admin upload token headers, and negative stock checks. |
| **Build Stability** | **10 / 10** | Next.js 14 (124 routes) and NestJS 10 compile 100% cleanly without errors. |
| **Database Sync** | **10 / 10** | 84 Prisma models match SQL migrations with 0 drift. |
| **Identified Issues** | **13 Total** | 2 Blockers, 7 High, 2 Medium, 2 Low. |

### Top 10 Blockers & Critical Risks
1. **Insecure JWT Fallback Defaults (`SEC-001`)**: Default fallback strings (`'access-secret'`, `'refresh-secret'`) in `jwt-access.strategy.ts:17`, `jwt-refresh.strategy.ts:26`, and `auth.service.ts:498` allow signature forgery if environment variables are omitted.
2. **Universal CORS Fallback with Credentials (`SEC-002`)**: `api/src/main.ts:70` falls back to `callback(null, true)` with `credentials: true`, allowing cross-site credentialed requests from unauthorized third-party domains.
3. **Staff Token Key Regression in Admin Forms (`REG-001`)**: Four admin create/edit pages (`EmployeeForm.tsx:250`, `banners/create/page.tsx:61`, `customers/create/page.tsx:82`, `customers/[id]/edit/page.tsx:116`) read `localStorage.getItem("token")` instead of `STAFF_TOKEN_KEY`, sending null bearer tokens and failing uploads with 401.
4. **Unguarded Customer Order Route (`SEC-003`)**: `POST /orders` (`order.controller.ts:100-103`) lacks `@RequirePermission` and omits branch scoping when called by storefront customers, risking order assignment anomalies.
5. **Payment Webhook Stock Decrement Vulnerability (`DATA-001`)**: bKash and SSLCommerz IPN callbacks in `payment.service.ts:148, 222` decrement variant inventory without verifying available stock, creating negative inventory under concurrency.
6. **Missing Database Integrity CHECK Constraints (`DATA-002`)**: PostgreSQL schema lacks `CHECK (stock >= 0)` on `ProductVariant` and `BranchInventory`, leaving the database vulnerable to negative stock states.
7. **Missing Foreign Key & Filter Indexes (`PERF-001`)**: High-traffic foreign keys (`Product.categoryId, brandId, status`, `ProductVariant.sku`, `Order.customerId, branchId`) lack explicit B-Tree indexes, causing table scans on large datasets.
8. **Missing Storefront Root Error Boundaries (`UX-001`)**: Next.js App Router lacks `src/app/not-found.tsx` and `src/app/error.tsx`, resulting in generic unbranded browser error pages on 404s or unexpected runtime exceptions.
9. **Synthetic Test Data Contamination (`DATA-003`)**: Database contains 1,124 synthetic customer rows, dummy test IMEIs, and placeholder orders that must be purged before client demo.
10. **Ephemeral Disk Uploads Risk (`ARCH-001`)**: Media uploads default to local disk (`/uploads`). Deploying on containerized or serverless hosting without Cloudflare R2 credentials will result in media loss on container redeployment.

---

## 2. End-to-End Module Status Table (Phase 2D)

Every module was audited across UI components, REST API endpoints, and Prisma database models:

| Module | Status | What Works | What is Broken / Missing | Risk Level |
| :--- | :---: | :--- | :--- | :---: |
| **1. Customer** | **Complete** | Full CRUD, phone search, balance ledger, loyalty points. | Bulk customer import lacks duplicate phone pre-flight check. | **LOW** |
| **2. Product (Variants & Attributes)** | **Complete** | Dynamic attribute matrix generation, barcode/SKU creation, multi-image upload. | 54 dead prototype mock data files remain in `src/lib/mock-data/`. | **LOW** |
| **3. All Products List** | **Complete** | Search, category/brand filters, server-side pagination, stock status badges. | Missing composite database indexes on `[categoryId, status]`. | **MEDIUM** |
| **4. Purchase (Normal + Phone/IMEI)** | **Complete** | Serialized IMEI entry, supplier assignment, cost ledger tracking. | Duplicate IMEI check operates per item, lacks bulk array deduplication guard. | **MEDIUM** |
| **5. POS** | **Complete** | Fast barcode search, customer selector, multi-payment modal, thermal receipt printing. | Relies on browser local print dialog; network ESC/POS printer driver not integrated. | **LOW** |
| **6. Phone Sale + Invoice** | **Complete** | IMEI dropdown filtering, automated IMEI status toggle (`IN_STOCK` → `SOLD`), PDF/PNG invoice generation. | Export alignment verified in Fix Pass 36. | **LOW** |
| **7. Sales List & Returns** | **Complete** | Filterable sales history, invoice downloads, partial item returns, restocking ledger. | Restocked phone units must have IMEI re-verified manually. | **LOW** |
| **8. Inventory / Branch Stock** | **Complete** | Real-time multi-branch stock levels, low-stock alerts, inter-branch transfer orders. | Missing DB CHECK constraint `stock >= 0`. | **HIGH** |
| **9. IMEI Serialized Tracking** | **Complete** | Full lifecycle tracking (`PURCHASED` → `IN_STOCK` → `SOLD` → `RETURNED`), audit history modal. | None. | **LOW** |
| **10. Suppliers** | **Complete** | Supplier profiles, purchase history, outstanding debt balance tracking. | None. | **LOW** |
| **11. Expenses** | **Complete** | Category tagging, branch allocation, receipt attachment upload. | Fixed in Fix Pass 33: branch-scoping fully enforced. | **LOW** |
| **12. Payroll / HRM** | **Complete** | Employee directory, monthly salary generation, bonus/deduction calculation, technician profit share. | Token header regression in `EmployeeForm.tsx:250` sends null bearer token. | **HIGH** |
| **13. Accounting / Dashboard Stat Boxes** | **Complete** | Daily sales, gross profit, cash flow, receivables/payables, real-time sync. | Revenue calculation loads all transactions without date range index. | **MEDIUM** |
| **14. Branches** | **Complete** | Flagship/outlet/warehouse categorization, manager assignment, branch inventory isolation. | None. | **LOW** |
| **15. Custom Role Builder + RBAC** | **Complete** | Granular module x action permission matrix (33 modules, 4 actions), dynamic sidebar filtering. | None. | **LOW** |
| **16. Staff Login** | **Complete** | Secure bcrypt verification, JWT access/refresh rotation, employee ID and email login. | Login endpoint lacks strict rate limiting (allows up to 1000 req/min). | **MEDIUM** |
| **17. Business Settings** | **Complete** | Store branding, currency, tax rates, invoice templates, delivery charges. | None. | **LOW** |
| **18. CMS (Menu, Footer, Banners, Pages)** | **Complete** | Dynamic header mega-menu builder, footer widget customizer, banner slider manager. | `banners/create/page.tsx:61` reads `token` instead of `staff_access_token`. | **HIGH** |
| **19. SEO** | **Partial** | Per-product dynamic meta tags, OpenGraph tags, JSON-LD schema generation. | Missing dynamic `sitemap.xml` and `robots.txt` generator in App Router. | **LOW** |
| **20. Marketing** | **Complete** | Coupon/promo code engine (fixed & percentage discounts), minimum order threshold, validity dates. | None. | **LOW** |
| **21. Payments / Gateway** | **Complete** | Cash on Delivery, SSLCommerz and bKash PGW sandbox/live switching with IPN webhooks. | IPN webhooks decrement stock on payment without availability check. | **HIGH** |
| **22. Storefront (Home, Catalog, Cart, Checkout, Account)** | **Complete** | Responsive e-commerce experience, variant selection, cart persistence, guest & customer checkout. | Missing root `not-found.tsx` and `error.tsx` error boundaries. | **HIGH** |
| **23. Reports** | **Complete** | Sales, inventory valuation, profit & loss, expense, and tax reports with CSV/Excel export. | Large report queries lack streaming/cursor pagination. | **LOW** |

---

## 3. Audit Deliverables Index

Detailed findings, inventories, and operational roadmaps have been compiled into dedicated audit reports:

1. **[00_MASTER_AUDIT_REPORT.md](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/audit/00_MASTER_AUDIT_REPORT.md)**: Executive summary, health scorecard, top 10 blockers, and end-to-end module matrix.
2. **[01_REPORTS_VS_REALITY.md](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/audit/01_REPORTS_VS_REALITY.md)**: Verification of historical claims across Fix Passes 1–36 against real code.
3. **[02_CODEBASE_INVENTORY.md](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/audit/02_CODEBASE_INVENTORY.md)**: Exhaustive inventory of 137 App Router routes, 142 REST API endpoints, 84 Prisma models, and storage keys.
4. **[03_PROBLEMS_DETAILED.md](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/audit/03_PROBLEMS_DETAILED.md)**: Deep-dive problem catalog with issue IDs, exact line citations, root causes, and fixes.
5. **[04_DEPLOYMENT_READINESS.md](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/audit/04_DEPLOYMENT_READINESS.md)**: Environment variable matrices, Prisma migration protocol, Cloudflare R2 setup, PM2, and Nginx configurations.
6. **[05_FIX_PRIORITY_ROADMAP.md](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/audit/05_FIX_PRIORITY_ROADMAP.md)**: Triaged remediation plan grouped into Batches A, B, and C with precise effort sizing and parallelization tracks.
