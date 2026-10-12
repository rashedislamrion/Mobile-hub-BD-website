# Reports vs. Reality — Audit & Verification Map

**Audit Date**: October 2, 2026  
**Auditor**: Antigravity AI Engine (Read-Only Static & Live Verification Pass)  
**Target Repository**: `Mobile-shop-website` (Monorepo: Next.js 14 Frontend + NestJS 10 API Backend + PostgreSQL 16 DB)

---

## 1. Inventory of Existing Reports Found

The repository contains 12 core historical audit, verification, and diagnostic reports:

1. **`PROJECT_STATUS_REPORT.md`** (Fix Passes 1–20+ status review)
2. **`PROJECT_FULL_ANALYSIS_REPORT.md`** (System architecture and feature matrix across Fix Passes 23–33)
3. **`QA_AUDIT_REPORT.md`** (Initial QA Playwright suite & Fix Pass 1 verification)
4. **`PHASE5_CATALOG_VERIFICATION_REPORT.md`** (Catalog, taxonomy, and categories audit)
5. **`PHASE6_SALES_ORDERS_VERIFICATION_REPORT.md`** (Order status transitions, timeline, stock deduction/restoration)
6. **`PHASE7_HRM_ACCOUNTING_REPORT_VERIFICATION_REPORT.md`** (Employees, payroll, wallets, expenses, suppliers)
7. **`PHASE8_MARKETING_CMS_PAYMENT_VERIFICATION_REPORT.md`** (Marketing, CMS, settings, checkout, and payments)
8. **`MOCK_DATA_AUDIT.md`** (Database record inspection of mock/synthetic rows)
9. **`PDF_EXPORT_BUG_DIAGNOSTIC.md`** (Fix Pass 35 diagnostic on invoice misalignment in Chrome vs Safari)
10. **`PASS36_EXPORT_ALIGNMENT_REPORT.md`** (Fix Pass 36 cross-browser export fix implementation report)
11. **`PROJECT_ANALYZE.md`** & **`PROJECT_ANALYZE_3.md`** (Early codebase structure plans)
12. **`DEPLOYMENT_STEPS.md`** (Early staging deployment instructions)

---

## 2. Claimed in Reports vs. Actually Present in Code

Every major claim from historical reports was audited against the active codebase. Below is the ground-truth verification matrix:

| # | Feature / Area | Claimed in Report | Active Code Reality | Verification Status | Exact File & Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **1** | **POS Receipt Dotted Lines** | Dotted underlines on 7 fields do not strike through text (`PASS36_EXPORT_ALIGNMENT_REPORT.md`). | Converted to flex-sibling `border-b border-dotted mb-0.5` after text node. Verified on Chromium & WebKit. | 🟢 **TRUE / VERIFIED** | [`src/components/admin/pos/PosInvoiceModal.tsx:433-462`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/components/admin/pos/PosInvoiceModal.tsx#L433-L462) |
| **2** | **CASH MEMO Badge Clipping** | Badge uses flex layout with no `translateY` and no bottom clipping (`PASS36_EXPORT_ALIGNMENT_REPORT.md`). | Uses 3-column flex container with `h-7 px-6` green pill badge. Verified in WebKit render test. | 🟢 **TRUE / VERIFIED** | [`src/components/admin/pos/PosInvoiceModal.tsx:482-496`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/components/admin/pos/PosInvoiceModal.tsx#L482-L496) |
| **3** | **Invoice Outlet Header Buffer** | 30mm buffer prevents header text from colliding with top-right green ribbon (`PDF_EXPORT_BUG_DIAGNOSTIC.md`). | `max-w-[220px] pr-4 line-clamp-2` applied to address block, ensuring +49.9px clearance. | 🟢 **TRUE / VERIFIED** | [`src/components/admin/pos/PosInvoiceModal.tsx:408-412`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/components/admin/pos/PosInvoiceModal.tsx#L408-L412) |
| **4** | **Stock Deduction on Order** | Order creation decrements variant and branch stock inside `$transaction` (`PHASE6_SALES_ORDERS_VERIFICATION_REPORT.md`). | Uses `tx.productVariant.update` and `tx.branchInventory.update` with `{ decrement: qty }` inside `prisma.$transaction`. | 🟢 **TRUE / VERIFIED** | [`api/src/order/order.service.ts:388-406`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/order/order.service.ts#L388-L406) |
| **5** | **Order Status Illegal Transitions** | Illegal transition (e.g. `DELIVERED` -> `PENDING`) rejected with HTTP 400 (`PHASE6_SALES_ORDERS_VERIFICATION_REPORT.md`). | State machine map `ALLOWED_TRANSITIONS` enforces valid order flows in `order.service.ts`. | 🟢 **TRUE / VERIFIED** | [`api/src/order/order.service.ts:60-85`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/order/order.service.ts#L60-L85) |
| **6** | **Zero Mock Data in Frontend** | All mock data removed from frontend pages (`PROJECT_STATUS_REPORT.md`). | `src/lib/mock-data/` folder still contains 54 unused mock files (~1MB). `StockAdjustmentsPage` imports types from it. Database contains 86% mock rows. | 🟡 **PARTIAL / CODE RESIDUAL** | [`src/app/(admin)/admin/stock-adjustments/page.tsx:8`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/stock-adjustments/page.tsx#L8), [`MOCK_DATA_AUDIT.md:10-25`](file:///Users/rashedislam/Desktop/Mobile-shop-website/MOCK_DATA_AUDIT.md#L10-L25) |
| **7** | **Token Key Isolation** | Customer and Staff auth tokens are isolated into separate keys (`PROJECT_FULL_ANALYSIS_REPORT.md`). | Core client uses `customer_access_token` and `staff_access_token`. BUT 4 admin form pages use raw `fetch` with `localStorage.getItem("token")` or `"accessToken"`, breaking image uploads and customer creation! | 🔴 **REGRESSED / DEFECT** | [`src/components/admin/EmployeeForm.tsx:250`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/components/admin/EmployeeForm.tsx#L250), [`src/app/(admin)/admin/marketing/banners/create/page.tsx:61`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/marketing/banners/create/page.tsx#L61), [`src/app/(admin)/admin/customers/create/page.tsx:82`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/customers/create/page.tsx#L82) |
| **8** | **Dynamic Multi-Select Filtering** | Multi-brand and multi-color category filters are sent as comma-separated queries (`QA_AUDIT_REPORT.md:173`). | `CategoryPage` joins selected brands with commas (`query.brand = selectedBrands.join(",")`), and `ProductService.findAllPublic` uses Prisma `{ in: [...] }`. | 🟢 **TRUE / VERIFIED** | [`src/app/(storefront)/category/[slug]/page.tsx:120-135`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/category/[slug]/page.tsx#L120-L135), [`api/src/product/product.service.ts:140-165`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/product/product.service.ts#L140-L165) |
| **9** | **Live Call & WhatsApp Buttons** | Call to Order and WhatsApp buttons wired with real numbers (`QA_AUDIT_REPORT.md:174`). | Uses `a href="tel:..."` and `a href="https://wa.me/..."` pulling numbers from `/business-settings` and `/social-links`. | 🟢 **TRUE / VERIFIED** | [`src/app/(storefront)/product/[slug]/page.tsx:480-510`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/product/[slug]/page.tsx#L480-L510) |
| **10** | **Admin Sidebar RBAC Filtering** | Sidebar hides items based on staff permissions (`PROJECT_FULL_ANALYSIS_REPORT.md`). | `isItemVisible` checks `hasPermission(item.module, "READ")`; Technicians receive isolated `technicianNavConfig`. | 🟢 **TRUE / VERIFIED** | [`src/components/admin/AdminSidebar.tsx:127-150`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/components/admin/AdminSidebar.tsx#L127-L150) |
| **11** | **Customer CRM Built** | Removed in QA Audit; claimed built in Pass 26 (`QA_AUDIT_REPORT.md:175`). | Dedicated CRM pages at `/admin/customers`, `/admin/customers/create`, `/admin/customers/[id]`, `/admin/customers/[id]/edit`. | 🟢 **TRUE / VERIFIED** | [`src/app/(admin)/admin/customers/page.tsx:1-40`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/customers/page.tsx#L1-L40) |
| **12** | **Technician 50/50 Profit Share** | 50% profit share recorded on completed servicing jobs (`PHASE7_HRM_ACCOUNTING_REPORT_VERIFICATION_REPORT.md`). | `service-job.service.ts` calculates `(finalAmount - materialCost) * (profitSharePercentage / 100)` and credits technician ledger. | 🟢 **TRUE / VERIFIED** | [`api/src/service-job/service-job.service.ts:580-610`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/service-job/service-job.service.ts#L580-L610) |
| **13** | **Cloudflare R2 Storage Active** | Storage service supports Cloudflare R2 streaming (`PROJECT_FULL_ANALYSIS_REPORT.md`). | `StorageService` initializes R2 S3Client, but R2 credentials are NOT configured in local `.env`; falls back to `/uploads` disk storage. | 🟡 **PARTIAL / FALLBACK ACTIVE** | [`api/src/common/upload/storage.service.ts:20-52`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/common/upload/storage.service.ts#L20-L52) |
| **14** | **Custom Error & 404 Pages** | Reported complete in early plan (`DEPLOYMENT_STEPS.md`). | Neither `src/app/not-found.tsx` nor `src/app/error.tsx` exists anywhere in the repository. | 🔴 **FALSE / UNBUILT** | App Router root missing [`src/app/not-found.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/not-found.tsx) and [`src/app/error.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/error.tsx) |
| **15** | **Zero TypeScript / Build Errors** | Build passes with 0 errors (`PASS36_EXPORT_ALIGNMENT_REPORT.md`). | Verified: `next build` generates 124 static pages with 0 errors; `nest build` compiles cleanly with 0 errors. | 🟢 **TRUE / VERIFIED** | [`scratch/task-7039.log`](file:///Users/rashedislam/.gemini/antigravity-ide/brain/fdd73ae4-b1d8-42ce-aebe-f795c6f19d3d/.system_generated/tasks/task-7039.log) |
| **16** | **JWT Secret Strict Enforcement** | Auth uses secure JWT signing (`PHASE8_MARKETING_CMS_PAYMENT_VERIFICATION_REPORT.md`). | Fallback defaults `'access-secret'` and `'refresh-secret'` are hardcoded in strategies if env variables are missing! | 🔴 **CRITICAL DEFECT** | [`api/src/auth/strategies/jwt-access.strategy.ts:17`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/auth/strategies/jwt-access.strategy.ts#L17), [`api/src/auth/strategies/jwt-refresh.strategy.ts:26`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/auth/strategies/jwt-refresh.strategy.ts#L26) |

---

## 3. Pending & Deferred Items from Prior Passes

The following items were found documented in previous reports as "pending", "known issue", or "needs follow-up":

1. **Database Mock Data Cleanup**: Documented in `MOCK_DATA_AUDIT.md`. 64 of 74 products and 1,124 of 1,130 customers are automated test records with synthetic timestamp names. Needs automated pruning script before production release.
2. **Missing Database Indexes**: Catalog has 0 custom indexes on `Product`, `ProductVariant`, and `Order` foreign keys and status columns. High risk for performance when scaling to 18,000+ products.
3. **Hardcoded Fallback JWT Secrets**: Documented in security pass as needing strict startup validation in production mode.
4. **Local Disk Ephemeral Storage Risk**: Backend stores uploaded images on local disk (`/uploads`). Serverless or container deployments (Vercel, Render without persistent disk) will lose media files on reboot unless Cloudflare R2 is configured.
