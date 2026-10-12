# Full Codebase Inventory & Architecture Map

**Audit Date**: October 2, 2026  
**Auditor**: Antigravity AI Engine (Read-Only Deep Analysis Pass)  
**Target Repository**: `Mobile-shop-website`

---

## 1. Frontend Architecture & Inventory

### 1.1 App Router Pages & Routes (137 Routes Total)

#### A. Public Storefront & Customer Portal (20 Pages)
| Route / Page Path | File Path | Purpose | Status |
| :--- | :--- | :--- | :---: |
| `/` | [`src/app/(storefront)/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/page.tsx) | Storefront homepage: banners carousel, categories, featured products, best deals, blogs | 🟢 Complete |
| `/category/[slug]` | [`src/app/(storefront)/category/[slug]/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/category/[slug]/page.tsx) | Category product listing with multi-brand, multi-color, and price filters | 🟢 Complete |
| `/product/[slug]` | [`src/app/(storefront)/product/[slug]/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/product/[slug]/page.tsx) | Product detail page: variant switcher, price, stock checks, Add to Cart, WhatsApp | 🟢 Complete |
| `/phones` | [`src/app/(storefront)/phones/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/phones/page.tsx) | Dedicated smartphones catalog with condition/warranty filters | 🟢 Complete |
| `/cart` | [`src/app/(storefront)/cart/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/cart/page.tsx) | Dedicated cart view with stepper, free delivery progress, and checkout link | 🟢 Complete |
| `/checkout` | [`src/app/(storefront)/checkout/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/checkout/page.tsx) | Online checkout: guest or saved address, coupon code validator, COD & MFS payment | 🟢 Complete |
| `/order/confirmation/[orderId]` | [`src/app/(storefront)/order/confirmation/[orderId]/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/order/confirmation/[orderId]/page.tsx) | Order placed receipt page with timeline and items summary | 🟢 Complete |
| `/order/payment-failed` | [`src/app/(storefront)/order/payment-failed/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/order/payment-failed/page.tsx) | Payment failed/cancelled notice with retry order button | 🟢 Complete |
| `/login` | [`src/app/(storefront)/login/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/login/page.tsx) | Customer phone/email password login with JWT token issue | 🟢 Complete |
| `/register` | [`src/app/(storefront)/register/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/register/page.tsx) | Customer self-registration form (name, phone, email, password) | 🟢 Complete |
| `/account` | [`src/app/(storefront)/account/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/account/page.tsx) | Customer dashboard: recent orders, loyalty balance, profile overview | 🟢 Complete |
| `/account/orders` | [`src/app/(storefront)/account/orders/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/account/orders/page.tsx) | Customer order history with live status badges and invoice details | 🟢 Complete |
| `/account/profile` | [`src/app/(storefront)/account/profile/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/account/profile/page.tsx) | Customer profile update (name, email, phone) | 🟢 Complete |
| `/account/address` | [`src/app/(storefront)/account/address/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/account/address/page.tsx) | Multiple address book management with default tag selector | 🟢 Complete |
| `/account/wishlist` | [`src/app/(storefront)/account/wishlist/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/account/wishlist/page.tsx) | Customer saved favorites and wishlist | 🟢 Complete |
| `/account/support` | [`src/app/(storefront)/account/support/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/account/support/page.tsx) | Customer support ticket submission and conversation view | 🟢 Complete |
| `/account/change-password` | [`src/app/(storefront)/account/change-password/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/account/change-password/page.tsx) | Customer password change with old password verification | 🟢 Complete |
| `/blog` | [`src/app/(storefront)/blog/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/blog/page.tsx) | News, tutorials, and repair guides listing | 🟢 Complete |
| `/blog/[slug]` | [`src/app/(storefront)/blog/[slug]/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(storefront)/blog/[slug]/page.tsx) | Full article page with rich HTML content and author attribution | 🟢 Complete |
| `/contact`, `/terms`, `/privacy`, `/about` | Storefront CMS pages | Public information, terms, privacy, and inquiry form | 🟢 Complete |

#### B. Enterprise Admin ERP & Staff Portal (117 Pages)
| Section / Subsystem | Key Routes | File Path Location | Status |
| :--- | :--- | :--- | :---: |
| **Authentication** | `/admin/login` | [`src/app/(admin)/admin/login/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/login/page.tsx) | 🟢 Complete |
| **Core Dashboard** | `/admin` | [`src/app/(admin)/admin/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/page.tsx) | 🟢 Complete |
| **POS Counter Terminal** | `/admin/pos` | [`src/app/(admin)/admin/pos/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/pos/page.tsx) | 🟢 Complete |
| **Orders Management** | `/admin/orders`, `/admin/orders/[id]` | [`src/app/(admin)/admin/orders/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/orders/page.tsx) | 🟢 Complete |
| **Sales & Courier** | `/admin/sales/all`, `/admin/sales/courier`, `/admin/sales/courier-list`, `/admin/sales/diagnosing`, `/admin/sales/service` | `src/app/(admin)/admin/sales/*` | 🟢 Complete |
| **Sales Returns** | `/admin/sales-returns`, `/admin/sales-returns/[id]` | `src/app/(admin)/admin/sales-returns/*` | 🟢 Complete |
| **Servicing & Repair** | `/admin/servicing`, `/admin/servicing/create`, `/admin/technician`, `/admin/technician/servicing-report` | `src/app/(admin)/admin/servicing/*`, `src/app/(admin)/admin/technician/*` | 🟢 Complete |
| **Customer CRM** | `/admin/customers`, `/admin/customers/create`, `/admin/customers/[id]`, `/admin/customers/[id]/edit` | `src/app/(admin)/admin/customers/*` | 🟢 Complete |
| **Catalog & Products** | `/admin/products`, `/admin/products/create`, `/admin/products/[id]/edit`, `/admin/products/attributes`, `/admin/products/brands`, `/admin/products/series`, `/admin/products/units`, `/admin/products/wanted`, `/admin/products/wasted` | `src/app/(admin)/admin/products/*` | 🟢 Complete |
| **Categories** | `/admin/category` | [`src/app/(admin)/admin/category/page.tsx`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/category/page.tsx) | 🟢 Complete |
| **Stock Adjustments** | `/admin/stock-adjustments`, `/admin/stock-adjustments/create` | `src/app/(admin)/admin/stock-adjustments/*` | 🟢 Complete |
| **Exchanges** | `/admin/exchanges`, `/admin/exchanges/[id]` | `src/app/(admin)/admin/exchanges/*` | 🟢 Complete |
| **Branches & Requests** | `/admin/branch`, `/admin/branch/create`, `/admin/branch/[id]/edit`, `/admin/branch/product-requests/*` | `src/app/(admin)/admin/branch/*` | 🟢 Complete |
| **HRM & Payroll** | `/admin/hrm/employees`, `/admin/hrm/departments`, `/admin/hrm/roles-permissions`, `/admin/hrm/payroll`, `/admin/hrm/payroll/run`, `/admin/hrm/technicians` | `src/app/(admin)/admin/hrm/*` | 🟢 Complete |
| **Accounting & Suppliers**| `/admin/accounting/suppliers/*`, `/admin/accounting/purchase/*`, `/admin/accounting/expense/*`, `/admin/accounting/wallet/*` | `src/app/(admin)/admin/accounting/*` | 🟢 Complete |
| **Marketing & CMS** | `/admin/marketing/banners/*`, `/admin/marketing/ads/*`, `/admin/marketing/promo-code/*`, `/admin/marketing/push-notification`, `/admin/marketing/blogs/*`, `/admin/cms/*` | `src/app/(admin)/admin/marketing/*`, `src/app/(admin)/admin/cms/*` | 🟢 Complete |
| **Business Settings** | `/admin/business-settings/*`, `/admin/3rd-party` | `src/app/(admin)/admin/business-settings/*` | 🟢 Complete |
| **Reports (14 Pages)** | `/admin/reports/*` (summary, transactions, pos-sales, website-sales, service-sales, courier, customer-due, supplier-due, product-stock, product-analytics, purchase, discount, expense) | `src/app/(admin)/admin/reports/*` | 🟢 Complete |

---

### 1.2 LocalStorage Keys & Auth Isolation

| Key Name | Owner / Scope | Purpose | Isolation Status |
| :--- | :--- | :--- | :---: |
| `customer_access_token` | Customer | JWT access token for customer storefront & checkout | 🟢 Isolated |
| `staff_access_token` | Staff / Admin | JWT access token for admin ERP, POS, and servicing | 🟢 Isolated |
| `customer_user` | Customer | Customer profile metadata snapshot | 🟢 Isolated |
| `staff_user` | Staff / Admin | Staff profile, role permissions, and branch ID | 🟢 Isolated |
| `cart_items` | Customer | Storefront e-commerce shopping cart items | 🟢 Isolated |
| `admin_selected_branch_id` | Staff | Currently selected branch in Admin Topbar | 🟢 Isolated |
| `admin_selected_branch_name`| Staff | Display name for selected branch | 🟢 Isolated |
| `admin_theme_name` | Staff | Selected theme color in Admin Topbar | 🟢 Isolated |
| `token` / `accessToken` | **DEFECT** | Used by 4 admin forms with raw `fetch`, reading non-existent key! | 🔴 **LEAK / DEFECT** |

---

### 1.3 API Base URL Usages & Hardcoded Endpoints

- **Centralized Definition**: [`src/lib/api-client.ts:2-5`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/lib/api-client.ts#L2-L5) defines:
  ```ts
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  ```
- **Fallback Usages with Hardcoded Defaults** (12 files):
  1. [`src/components/admin/EmployeeForm.tsx:251`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/components/admin/EmployeeForm.tsx#L251): `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}`
  2. [`src/components/admin/CustomerAvatar.tsx:60`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/components/admin/CustomerAvatar.tsx#L60): `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}`
  3. [`src/app/(admin)/admin/accounting/purchase/create/page.tsx:866`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/accounting/purchase/create/page.tsx#L866)
  4. [`src/app/(admin)/admin/marketing/banners/create/page.tsx:57`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/marketing/banners/create/page.tsx#L57)
  5. [`src/app/(admin)/admin/marketing/blogs/create/page.tsx:166`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/marketing/blogs/create/page.tsx#L166)
  6. [`src/app/(admin)/admin/marketing/ads/create/page.tsx:60`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/marketing/ads/create/page.tsx#L60)
  7. [`src/app/(admin)/admin/customers/create/page.tsx:78`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/customers/create/page.tsx#L78)
  8. [`src/app/(admin)/admin/customers/create/page.tsx:179`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/customers/create/page.tsx#L179)
  9. [`src/app/(admin)/admin/customers/[id]/edit/page.tsx:74`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/customers/[id]/edit/page.tsx#L74)
  10. [`src/app/(admin)/admin/customers/[id]/edit/page.tsx:112`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/(admin)/admin/customers/[id]/edit/page.tsx#L112)
  11. [`src/app/layout.tsx:29`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/layout.tsx#L29)
  12. [`src/app/sitemap.ts:5`](file:///Users/rashedislam/Desktop/Mobile-shop-website/src/app/sitemap.ts#L5)

---

## 2. Backend Architecture & Inventory

### 2.1 NestJS System Topology
- **NestJS Framework Version**: 10.4.x
- **Modules**: 42 Modules registered in [`api/src/app.module.ts`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/app.module.ts)
- **Global Pipes**: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` ([`api/src/main.ts:75-81`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/main.ts#L75-L81))
- **Global Guards** (Registered via `APP_GUARD` in [`api/src/app.module.ts:124-134`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/app.module.ts#L124-L134)):
  1. `ThrottlerGuard` (Rate limiting)
  2. `JwtAuthGuard` (JWT Bearer Token validation; bypasses routes with `@Public()`)
  3. `PermissionsGuard` (RBAC role matrix validation; bypasses routes without `@RequirePermission()`)

### 2.2 Endpoints Inventory & Access Control Matrix

The backend exposes **142 total endpoints** across 53 controllers.

#### Summary of Access Boundaries:
- **Public Endpoints** (`@Public()`): 39 endpoints (Product catalog, public categories, blogs, storefront checkout, bKash/SSLCommerz IPN webhooks, public branches).
- **Staff-Protected Endpoints with Explicit RBAC** (`@RequirePermission`): 95 endpoints (POS sales, inventory updates, supplier payments, payroll dispatch, role management).
- **Authenticated Endpoints Lacking Specific RBAC Decorators** (Protected by `JwtAuthGuard` only): **8 endpoints**:
  1. `GET /orders/:id` ([`api/src/order/order.controller.ts:86`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/order/order.controller.ts#L86)) — Checked via `order.service.ts` customer/staff logic.
  2. `POST /orders` ([`api/src/order/order.controller.ts:101`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/order/order.controller.ts#L101)) — **Vulnerability**: Any authenticated customer can submit to the staff order creation endpoint!
  3. `GET /product-requests/:id` ([`api/src/product-request/product-request.controller.ts:56`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/product-request/product-request.controller.ts#L56))
  4. `PATCH /product-requests/:id/complete` ([`api/src/product-request/product-request.controller.ts:71`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/product-request/product-request.controller.ts#L71))
  5. `GET /service-jobs/my` ([`api/src/service-job/service-job.controller.ts:48`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/service-job/service-job.controller.ts#L48))
  6. `GET /phone-units/check-imei` ([`api/src/phone-unit/phone-unit.controller.ts:31`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/phone-unit/phone-unit.controller.ts#L31))
  7. `POST /support-tickets` ([`api/src/support-ticket/support-ticket.controller.ts:25`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/support-ticket/support-ticket.controller.ts#L25))
  8. `GET /support-tickets/my` ([`api/src/support-ticket/support-ticket.controller.ts:36`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/src/support-ticket/support-ticket.controller.ts#L36))

---

## 3. Database Architecture & Inventory

### 3.1 Prisma Schema Metrics
- **Prisma Schema Path**: [`api/prisma/schema.prisma`](file:///Users/rashedislam/Desktop/Mobile-shop-website/api/prisma/schema.prisma)
- **Database Engine**: PostgreSQL 16
- **Total Data Models**: **84 Models**
- **Active Migrations**: 1 Migration (`prisma/migrations/0_baseline`)
- **Migration Status**: Verified synchronized with zero schema drift via `npx prisma migrate status`.

### 3.2 Critical Missing Indexes on High-Volume Tables

| Model | Table Name | Existing Indexes | Critical Missing Indexes | Scalability Impact |
| :--- | :--- | :--- | :--- | :--- |
| **`Product`** | `"Product"` | 0 indexes | `categoryId`, `brandId`, `status`, `isPhone`, `createdAt` | Full-table scans on 18,000+ catalog rows |
| **`ProductVariant`** | `"ProductVariant"` | 0 indexes | `productId`, `sku` | Slow variant resolution during cart & checkout |
| **`Order`** | `"Order"` | 0 indexes | `customerId`, `branchId`, `status`, `createdAt` | Slow order history & reporting queries |
| **`OrderItem`** | `"OrderItem"` | 0 indexes | `orderId`, `productVariantId` | Degraded order detail retrieval |
| **`PhoneUnit`** | `"PhoneUnit"` | 3 indexes (`variantId`, `branchId`, `status`) | `orderId`, `imei1` | Adequate for POS, needs indexing on order associations |
| **`Customer`** | `"Customer"` | 0 indexes | `phone`, `email`, `createdAt` | High latency during POS customer autocomplete |
| **`ServiceJob`** | `"ServiceJob"` | 0 indexes | `branchId`, `technicianId`, `status` | Slow technician workspace filtering |
| **`Expense`** | `"Expense"` | 0 indexes | `branchId`, `categoryId`, `expenseDate` | Slow accounting report generation |

---

## 4. End-to-End Module Status Matrix (Phase 2D)

| # | Module Name | UI Path | API Controller | DB Models | Status | Operational Capabilities & Risk Factors | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **1** | **Customer CRM** | `/admin/customers/*` | `CustomerController` | `Customer`, `Address` | 🟢 Complete | Customer 360 view, wallet balance, order history, quick create. Risk: token key mismatch on create form. | 🟡 Medium |
| **2** | **Product & Variants** | `/admin/products/*` | `ProductController` | `Product`, `ProductVariant` | 🟢 Complete | Multi-variant color/quality, stock, pricing, image uploads. Risk: 0 DB indexes on foreign keys. | 🟠 High |
| **3** | **Categories & Brands**| `/admin/category`, `.../brands` | `CategoryController`, `BrandController` | `Category`, `Brand` | 🟢 Complete | Tree hierarchy with image upload and slug generator. | 🟢 Low |
| **4** | **Purchase & Procurement**| `/admin/accounting/purchase/*` | `PurchaseOrderController` | `PurchaseOrder`, `PurchaseOrderItem` | 🟢 Complete | Spare parts + phone IMEI batch procurement with supplier running dues. | 🟢 Low |
| **5** | **POS Terminal** | `/admin/pos` | `PosController` | `Order`, `OrderItem` | 🟢 Complete | Barcode scanner, variant selector, IMEI device picker, split tender payment. | 🟢 Low |
| **6** | **Invoice Generation** | `PosInvoiceModal.tsx` | N/A (Frontend PDF/PNG) | N/A | 🟢 Complete | 80mm POS Thermal (Template B) and A4 Cash Memo (Template A). Chrome + Safari verified. | 🟢 Low |
| **7** | **Sales & Returns** | `/admin/sales/*`, `.../returns` | `OrderController`, `SalesReturnController`| `Order`, `SalesReturn` | 🟢 Complete | Courier management, parcel booking, return inspection, and transactional stock restitution. | 🟢 Low |
| **8** | **Inventory Management**| `/admin/stock-adjustments` | `StockAdjustmentController` | `BranchInventory`, `StockAdjustment` | 🟢 Complete | Multi-branch stock audits, wasted products. Risk: missing DB CHECK constraint on negative stock. | 🟡 Medium |
| **9** | **IMEI Tracking** | `/admin/pos`, `/admin/products` | `PhoneUnitController` | `PhoneUnit` | 🟢 Complete | Serialized device intake, status transition (`IN_STOCK` -> `SOLD`). | 🟢 Low |
| **10**| **Suppliers** | `/admin/accounting/suppliers/*`| `SupplierController` | `Supplier`, `SupplierPayment` | 🟢 Complete | Procurement history, running due balance, payment receipts. | 🟢 Low |
| **11**| **Expenses** | `/admin/accounting/expense/*` | `ExpenseController` | `Expense`, `ExpenseCategory` | 🟢 Complete | Multi-category expense tracking, receipt attachment upload. | 🟢 Low |
| **12**| **HRM & Payroll** | `/admin/hrm/*` | `EmployeeController`, `PayrollController` | `Staff`, `Department`, `Payroll` | 🟢 Complete | Staff directory, department taxonomy, monthly payroll dispatch with allowances. | 🟢 Low |
| **13**| **Master Dashboard** | `/admin` | `ReportController` | Multiple | 🟢 Complete | Real-time sales, technician jobs, supplier dues, order status counters. | 🟢 Low |
| **14**| **Branches** | `/admin/branch/*` | `BranchController` | `Branch`, `StaffBranchAccess` | 🟢 Complete | Multi-branch configuration, inter-branch requisition requests. | 🟢 Low |
| **15**| **Role Builder & RBAC**| `/admin/hrm/roles-permissions` | `RoleController` | `Role`, `RolePermission` | 🟢 Complete | Granular CRUD permission matrix across all 30+ modules. | 🟢 Low |
| **16**| **Staff Authentication**| `/admin/login` | `AuthController` | `Staff`, `RefreshToken` | 🟢 Complete | JWT access/refresh tokens with 5 req/min rate limiter. Risk: fallback secret in dev config. | 🔴 Blocker |
| **17**| **Business Settings** | `/admin/business-settings/*` | `BusinessSettingsController` | `BusinessSetting`, `Currency` | 🟢 Complete | General info, currency, delivery charges, verification settings. | 🟢 Low |
| **18**| **CMS Builders** | `/admin/cms/*` | `MenuController`, `FooterController`, `PageController` | `MenuItem`, `Page`, `FooterColumn`| 🟢 Complete | Mega-menu builder, footer columns, dynamic custom pages, social links. | 🟢 Low |
| **19**| **Storefront** | `/`, `/category/*`, `/product/*` | `ProductController`, `CategoryController` | Multiple | 🟢 Complete | Responsive SSR shopping catalog, variant switcher, cart drawer. | 🟢 Low |
| **20**| **Cart & Checkout** | `/cart`, `/checkout` | `OrderController` | `Order`, `OrderItem`, `Address` | 🟢 Complete | Dynamic cart, coupon validation, delivery fee calculation, transactional order creation. | 🟢 Low |
| **21**| **Payment Gateways** | `/checkout` | `BkashController`, `SslcommerzController` | `PaymentGatewayConfig`, `PaymentAttempt`| 🟢 Complete | bKash tokenized checkout & SSLCommerz hosted gateway integration. | 🟢 Low |
| **22**| **Reports (14 Pages)** | `/admin/reports/*` | `ReportController` | Multiple | 🟢 Complete | Financial summaries, POS sales, courier performance, customer & supplier dues. | 🟢 Low |
| **23**| **SEO & Meta** | `/sitemap.xml`, `/robots.txt` | App Router generators | N/A | 🟡 Partial | Dynamic sitemap & robots.txt built; missing custom 404 & 500 error boundaries. | 🟡 Medium |
