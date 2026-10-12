# NovaMobile ERP — Project Status Report
Generated: 2026-08-22 02:40:00 +06:00

## 1. Summary Scorecard
| Area | Built | Wired to Real API | Notes |
|---|---|---|---|
| Public Storefront | 7/7 pages | 0/7 (0%) | Built with rich UI and mock data; `/terms` & `/privacy` are static |
| Customer Dashboard | 10/10 pages | 0/10 (0%) | Full account shell & 7 functional sub-pages; uses MockAuth |
| Admin Shell + Dashboard | ✅ Built | 0/1 (0%) | Full nav (all 14 groups), topbar, palette switcher, dashboard charts (mock data) |
| Admin — Sales Module | 5/5 pages | 0/5 (0%) | Diagnosing, Courier, All Sales, Service, Courier List (mock data) |
| Admin — Order Handling | 3/3 pages (6 routes) | 0/3 (0%) | Orders, Sales Returns, Exchanges (lists + `[id]` details) (mock data) |
| Admin — Products Module | 10/10 pages (11 routes) | 0/10 (0%) | All Products, Create, Edit, Wanted, Category Tree, Brands, Series, Units, Attributes, Wasted, Bulk Import (mock data) |
| Admin — Branch Module | 3/3 pages (4 routes) | 0/3 (0%) | Branch List, Create, Edit, Stock Adjustments (mock data) |
| Admin — HRM Module | 6/6 pages (7 routes) | 0/6 (0%) | Departments, Employees (list/create/edit), Technicians, Roles & Permissions, Payroll (list/run) (mock data) |
| Admin — Report Module | 5/5 pages | 0/5 (0%) | Product Analytics, Customer Due, Supplier Due, Summary, Discount (mock data) |
| Admin — Accounting Module | 10/10 pages (12 routes) | 0/10 (0%) | Wallet Types, Deposit History, Purpose, Expense Categories, All Expenses, Expense History, Suppliers (list/create/detail/edit), Supplier Payments, Purchase (list/create/detail) (mock data) |
| Admin — Marketing Module | 7/7 pages (8 routes) | 0/7 (0%) | Promotional Banner, Ads (list/create), Promo Code, Push Notification, Blogs (list/create/edit) (mock data) |
| Admin — CMS/Business Admin | 9/9 pages (10 routes) | 0/9 (0%) | Pages (list/create/edit), Menus, Footer, Country, Social Links, Contact Us, Ticket Issue Types (mock data) |
| Admin — 3rd Party Config | 5/5 tabs | 0/5 (0%) | Payment Gateway (bKash/SSLCommerz/COD only), SMS, Mail, Firebase, ReCaptcha (mock state) |
| Backend — Auth/RBAC | ⚠️ Incomplete | N/A | Auth module, JWT strategies, guards & decorators exist, but runtime compression crash & route prefix bug present |
| Backend — Category/Brand/Product/Branch | ❌ Not built yet | 0/4 (0%) | Prisma models & seed exist, but NestJS controllers, services, DTOs are missing |
| Backend — Sales/Orders/HRM/Accounting/etc. | ❌ Not built yet | 0/10 (0%) | Prisma models & seed exist, but NestJS controllers, services, DTOs are missing |

## 2. Detailed Findings (per section 1-11 above)

### 1. Frontend — Public Storefront Pages
All 7 required storefront routes exist under `src/app/(storefront)/`:
- **Homepage (`/`)** — `src/app/(storefront)/page.tsx`: 🔄 Built with mock data (`mockCategories`, `mockProducts`, `mockBlogs`). Features Hero Carousel, Popular Categories slider, Best Deals tabbed grid, Featured Products, and Latest Blogs.
- **Category Listing (`/category/[slug]`)** — `src/app/(storefront)/category/[slug]/page.tsx`: 🔄 Built with mock data (`mockProducts`). Features responsive sidebar/sheet with 7 accordion filter sections (Brand, Color, Quality, Guarantee, Frame, Type, Service), sorting dropdown, pagination, and empty state.
- **Product Detail (`/product/[slug]`)** — `src/app/(storefront)/product/[slug]/page.tsx`: 🔄 Built with mock data (`mockProducts`, `mockReviews`). Features multi-image thumbnail gallery, stock/discount badges, variant selectors (color, quality), quantity stepper, Cart/Buy Now triggers, Call/WhatsApp action buttons, tabs for description/specifications/reviews, sticky recently viewed sidebar, and related products grid.
- **Blog Listing (`/blog`)** — `src/app/(storefront)/blog/page.tsx`: 🔄 Built with mock data (`mockBlogs`). Features responsive 3-column grid and pagination controls.
- **Blog Detail (`/blog/[slug]`)** — `src/app/(storefront)/blog/[slug]/page.tsx`: 🔄 Built with mock data (`mockBlogs`). Features hero cover image, author/date/view metadata, formatted article body, back navigation, and related posts carousel/grid.
- **Login (`/login`)** — `src/app/(storefront)/login/page.tsx`: 🔄 Built with mock auth (`MockAuthContext`). React Hook Form + Zod schema validation, password visibility toggle, simulated API delay, and redirection to `/account`.
- **Register (`/register`)** — `src/app/(storefront)/register/page.tsx`: 🔄 Built with mock auth (`MockAuthContext`). React Hook Form + Zod schema validation (full name, phone, optional email, password matching), simulated registration delay, and redirection to `/account`.

### 2. Frontend — Customer Dashboard Pages
All 10 customer dashboard and policy routes exist under `src/app/(storefront)/`:
- **Shell / Layout (`account/layout.tsx`)**: 🔄 Layout containing user avatar, customer name from `MockAuthContext`, responsive sidebar navigation, mobile navigation drawer via Sheet, and legal links.
- **Dashboard Home (`account/page.tsx`)**: 🔄 5 stat cards (Orders, Payment, Wishlist, Cancelled, Completed), Default Shipping Address widget with empty state toggle, My Cart summary widget, and Recently Viewed section using `<EmptyState />`.
- **Order History (`account/orders/page.tsx`)**: 🔄 7 status filter tabs (Pending, Confirmed, Parcel Booked, Delivered, Returned, Cancelled, All) with counts, order table with status badges, and `<EmptyState />` for empty tabs.
- **Wishlist (`account/wishlist/page.tsx`)**: 🔄 Grid of wishlist items rendering `<ProductCard />`, with `<EmptyState />` fallback when items are cleared.
- **My Profile (`account/profile/page.tsx`)**: 🔄 Profile form with avatar upload trigger, verification status badges (Verified mobile, Unverified email), name/mobile/email inputs, and profile update toast.
- **Manage Address (`account/address/page.tsx`)**: 🔄 Address list with Default tag, Edit/Delete action buttons, and Add New Address form with Home/Office/Other tag selectors.
- **Support Ticket (`account/support/page.tsx`)**: 🔄 Status tabs (Running, Completed, Cancel) with ticket counts, Create Ticket modal dialog with order selector, issue category dropdown, and empty states.
- **Change Password (`account/change-password/page.tsx`)**: 🔄 Password update form with current/new/confirm password fields, individual password visibility toggles, and Zod validation.
- **Terms & Conditions (`terms/page.tsx`)**: ✅ Complete static content with styled sections covering Agreement, Intellectual Property, and Product/Service terms.
- **Privacy Policy (`privacy/page.tsx`)**: ✅ Complete static content with structured sections covering Information Collection, Usage, and Data Protection.

### 3. Frontend — Shared Storefront Components
All shared storefront components exist in `src/components/storefront/` and `src/components/ui/`:
- **`<Header />`** (`src/components/storefront/Header.tsx`): ✅ Includes desktop mega-menu dropdown with category icons, global search input, wishlist/cart count badges, user account dropdown with avatar and logout action, and mobile hamburger drawer with nested category accordions.
- **`<Footer />`** (`src/components/storefront/Footer.tsx`): ✅ Store branding, category links, customer service links, branch contact details, social links, newsletter input, and copyright notice.
- **`<ProductCard />`** (`src/components/storefront/ProductCard.tsx`): ✅ Image thumbnail, discount badge, pricing with strikethrough original price, star rating, wishlisting toggle button, and Add to Cart action.
- **`<BlogCard />`** (`src/components/storefront/BlogCard.tsx`): ✅ Cover image, author, date, excerpt, view count badge, and detail link.
- **`<EmptyState />`** (`src/components/ui/empty-state.tsx`): ✅ Generic component accepting icon, title, subtitle, and action button slot; consistently utilized across storefront and account pages.

### 4. Frontend — Admin Shell
All admin shell components and layout wrappers exist:
- **`app/(admin)/admin/layout.tsx`**: ✅ Wraps the admin interface in `AdminPageProvider`, manages desktop and mobile responsive layout containers, and embeds `AdminSidebar` and `AdminTopbar`.
- **`AdminSidebar`** (`src/components/admin/AdminSidebar.tsx` + `src/lib/mock-data/admin-nav.ts`): ✅ Contains all 14 required navigation groups:
  1. *MAIN* (Dashboard)
  2. *SALES* (Sales dropdown with Diagnosing, Courier, All Sales, Service, Courier List; Customers)
  3. *ORDER HANDLING* (Orders, Sales Returns, Exchanges)
  4. *CATEGORY* (Category Tree)
  5. *PRODUCTS* (Products dropdown with All Products, Wanted, Brands, Series, Units, Attributes, Bulk Import/Export, Wasted)
  6. *BRANCH/WAREHOUSE MANAGEMENT* (Branch, Stock Adjustments)
  7. *HRM* (Employees, Technicians, Departments, Roles & Permissions, Payroll)
  8. *SUMMARY / REPORT* (Product Analytics, Customer Due, Supplier Due, Summary, Discount)
  9. *ACCOUNTING* (Wallet dropdown with Types, Deposit History, Purpose; Expense dropdown with All, Categories, History; Suppliers dropdown with List, Payments; Purchase)
  10. *MARKETING PROMOTIONS* (Promotional Banner, Ads, Promo Code, Push Notification, Blogs)
  11. *ASSISTANCE/SUPPORT* (Help Requests, Help Notes)
  12. *LANGUAGE SETTINGS* (Languages)
  13. *BUSINESS ADMINISTRATION* (Business Settings dropdown, CMS dropdown with Pages, Menus, Footer, Country, Social Links, Contact Us, Ticket Issue Types)
  14. *3rd Party Configuration*
- **`AdminTopbar`** (`src/components/admin/AdminTopbar.tsx`): ✅ Dynamic page title & badge from context, global date filter select (Today, This Week, This Month, This Year), quick action icons (Search, History, POS), active Branch Switcher dropdown, user avatar/name badge, and "Change Color Palette" popover (Emerald, Purple, Blue, Rose swatches).
- **Admin Dashboard Page** (`src/app/(admin)/admin/page.tsx`): 🔄 Complete dashboard layout powered by mock data in `src/lib/mock-data/admin-dashboard.ts`:
  - 8 KPI cards across 2 rows with trend indicators (Total Revenue, Product Sale, Service Sale, Liquid Cash, Total Expense, Total Purchase, Supplier Payment, Supplier Due).
  - 8 Order Status Overview counters (Pending, Confirmed, Parcel Booked, Delivered, Returned, Cancelled, Diagnosing, Completed).
  - Interactive Recharts Summary Area Chart (Order, Income Growth, Expense Growth).
  - Most Selling Products widget with thumbnail and sales count badges.
  - Weekly Top Customers widget with order counts and avatar initials.
  - Recent Orders table with order status badges and view action triggers.

### 5. Frontend — Shared Admin Components
- **`<FilterBar />`** (`src/components/admin/FilterBar.tsx`): ✅ Exists. Provides search input, dynamic select filter dropdowns, date range triggers, and reset button.
- **`<DataTable />`** (`src/components/admin/DataTable.tsx`): ✅ Exists. Built with TanStack Table patterns; supports generic column mapping, sorting, search filtering, row selection, pagination, and skeleton loading state.
- **`<StatusBadge />`** (`src/components/admin/DataTable.tsx`): ✅ Exists. Exported from `DataTable.tsx`; renders status pills with color dots supporting `success`, `warning`, `danger`, `info`, and `notice` styles.
- **`createActionColumn` / `ActionDropdown`** (`src/components/admin/DataTable.tsx`): ⚠️ `ActionDropdown` is implemented and exported from `DataTable.tsx`. However, `createActionColumn` is not defined as a standalone helper function; pages instead define action columns directly by rendering `<ActionDropdown actions={...} rowData={row} />` in column accessors.
- **`<ColoredStatCard />`** (`src/components/admin/ColoredStatCard.tsx`): ✅ Exists. Used in Suppliers detail, Purchase list, Promo Code, and Summary Report.
- **`<StatusTimeline />`** (`src/components/admin/StatusTimeline.tsx`): ✅ Exists. Used in Orders detail, Sales Returns detail, and Exchanges detail.
- **`<PermissionMatrix />`**: ⚠️ Does not exist as an isolated component file in `components/admin/`. Instead, the full switch-based module-vs-action matrix is implemented directly inside `src/app/(admin)/admin/hrm/roles-permissions/page.tsx`.
- **`<ReportExportButtons />`** (`src/components/admin/ReportExportButtons.tsx`): ✅ Exists. Used across all 5 report pages (Product Analytics, Customer Due, Supplier Due, Summary, Discount).
- **Consistency Analysis on Table Reusability**:
  - *Standard `<DataTable />` adoption*: Adopted across 31 admin pages (Branches, Products, Brands, Series, Units, Attributes, Wanted, Wasted, Sales, Returns, Exchanges, Orders, HRM Departments/Employees/Technicians/Payroll, Marketing Ads/Blogs/Promos/Push Notifications, CMS Pages/Countries/Contact/Ticket Issues, Accounting Wallets/Suppliers/Purchase, Reports).
  - *One-off `<table>` or `<Table>` implementations*: 8 pages implement custom tables rather than `<DataTable />`:
    1. `admin/page.tsx` — Dashboard Recent Orders uses `@/components/ui/table`.
    2. `admin/accounting/purchase/[id]/page.tsx` — Purchase order line-item list uses custom `<table>`.
    3. `admin/accounting/purchase/create/page.tsx` — Purchase item addition table uses custom `<table>`.
    4. `admin/products/bulk/page.tsx` — CSV preview table uses custom `<table>`.
    5. `admin/business/general/page.tsx` — Notification settings matrix uses custom `<table>`.
    6. `admin/hrm/roles-permissions/page.tsx` — Permission toggle matrix uses custom `<table>`.
    7. `admin/hrm/payroll/run/page.tsx` — Monthly payroll calculation table uses custom `<table>`.
    8. `admin/orders/[id]/page.tsx` — Order item line breakdown uses custom `<table>`.

### 6. Frontend — Admin Module Pages
Every single requested admin route file exists:
- **Sales (5 routes)**:
  - Diagnosing Orders (`admin/sales/diagnosing/page.tsx`): 🔄
  - Courier Sales (`admin/sales/courier/page.tsx`): 🔄
  - All Sales (`admin/sales/all/page.tsx`): 🔄
  - Service List (`admin/sales/service/page.tsx`): 🔄
  - Courier List (`admin/sales/courier-list/page.tsx`): 🔄
- **Order Handling (6 routes)**:
  - Orders: List (`admin/orders/page.tsx`) 🔄 | Detail (`admin/orders/[id]/page.tsx`) 🔄
  - Sales Returns: List (`admin/sales-returns/page.tsx`) 🔄 | Detail (`admin/sales-returns/[id]/page.tsx`) 🔄
  - Exchanges: List (`admin/exchanges/page.tsx`) 🔄 | Detail (`admin/exchanges/[id]/page.tsx`) 🔄
- **Products (11 routes)**:
  - All Products (`admin/products/page.tsx`): 🔄
  - Create Product (`admin/products/create/page.tsx`): 🔄
  - Edit Product (`admin/products/[id]/edit/page.tsx`): 🔄
  - Wanted Products (`admin/products/wanted/page.tsx`): 🔄
  - Category Tree (`admin/category/page.tsx`): 🔄
  - Brands (`admin/products/brands/page.tsx`): 🔄
  - Series (`admin/products/series/page.tsx`): 🔄
  - Units (`admin/products/units/page.tsx`): 🔄
  - Attributes (`admin/products/attributes/page.tsx`): 🔄
  - Wasted Products (`admin/products/wasted/page.tsx`): 🔄
  - Bulk Import/Export (`admin/products/bulk/page.tsx`): 🔄
- **Branch (4 routes)**:
  - Branch List (`admin/branch/page.tsx`): 🔄
  - Create Branch (`admin/branch/create/page.tsx`): 🔄
  - Edit Branch (`admin/branch/[id]/edit/page.tsx`): 🔄
  - Stock Adjustments (`admin/stock-adjustments/page.tsx`): 🔄
- **HRM (7 routes)**:
  - Departments (`admin/hrm/departments/page.tsx`): 🔄
  - Employees List (`admin/hrm/employees/page.tsx`): 🔄
  - Create Employee (`admin/hrm/employees/create/page.tsx`): 🔄
  - Edit Employee (`admin/hrm/employees/[id]/edit/page.tsx`): 🔄
  - Technicians (`admin/hrm/technicians/page.tsx`): 🔄
  - Roles & Permissions (`admin/hrm/roles-permissions/page.tsx`): 🔄
  - Payroll List (`admin/hrm/payroll/page.tsx`) 🔄 | Run Payroll (`admin/hrm/payroll/run/page.tsx`) 🔄
- **Report (5 routes)**:
  - Product Analytics (`admin/reports/product-analytics/page.tsx`): 🔄
  - Customer Due (`admin/reports/customer-due/page.tsx`): 🔄
  - Supplier Due (`admin/reports/supplier-due/page.tsx`): 🔄
  - Summary (`admin/reports/summary/page.tsx`): 🔄
  - Discount (`admin/reports/discount/page.tsx`): 🔄
- **Accounting (12 routes)**:
  - Wallet Types (`admin/accounting/wallet/types/page.tsx`): 🔄
  - Deposit History (`admin/accounting/wallet/deposit-history/page.tsx`): 🔄
  - Purpose (`admin/accounting/wallet/purpose/page.tsx`): 🔄
  - Expense Categories (`admin/accounting/expense/categories/page.tsx`): 🔄
  - All Expenses (`admin/accounting/expense/all/page.tsx`): 🔄
  - Expense History (`admin/accounting/expense/history/page.tsx`): 🔄
  - Suppliers List (`admin/accounting/suppliers/page.tsx`): 🔄
  - Supplier Create (`admin/accounting/suppliers/create/page.tsx`): 🔄
  - Supplier Detail (`admin/accounting/suppliers/[id]/page.tsx`): 🔄
  - Supplier Edit (`admin/accounting/suppliers/[id]/edit/page.tsx`): 🔄
  - Supplier Payments (`admin/accounting/suppliers/payments/page.tsx`): 🔄
  - Purchase Management List (`admin/accounting/purchase/page.tsx`) 🔄 | Create (`admin/accounting/purchase/create/page.tsx`) 🔄 | View (`admin/accounting/purchase/[id]/page.tsx`) 🔄
- **Marketing (8 routes)**:
  - Promotional Banner (`admin/marketing/banners/page.tsx`): 🔄
  - Ads List (`admin/marketing/ads/page.tsx`) 🔄 | Create Ad (`admin/marketing/ads/create/page.tsx`) 🔄
  - Promo Code (`admin/marketing/promo-code/page.tsx`): 🔄
  - Push Notification (`admin/marketing/push-notification/page.tsx`): 🔄
  - Blogs List (`admin/marketing/blogs/page.tsx`) 🔄 | Create Blog (`admin/marketing/blogs/create/page.tsx`) 🔄 | Edit Blog (`admin/marketing/blogs/[id]/edit/page.tsx`) 🔄
- **CMS (10 routes)**:
  - Pages List (`admin/cms/pages/page.tsx`) 🔄 | Create Page (`admin/cms/pages/create/page.tsx`) 🔄 | Edit Page (`admin/cms/pages/[id]/edit/page.tsx`) 🔄
  - Menus (`admin/cms/menus/page.tsx`): 🔄
  - Footer (`admin/cms/footer/page.tsx`): 🔄
  - Country (`admin/cms/countries/page.tsx`): 🔄
  - Social Links (`admin/cms/social/page.tsx`): 🔄
  - Contact Us (`admin/cms/contact/page.tsx`): 🔄
  - Ticket Issue Types (`admin/cms/ticket-issues/page.tsx`): 🔄
- **Business Settings & 3rd Party Configuration**:
  - Business Settings (`admin/business/general/page.tsx`): ✅ All 5 tabs present (General, Branding, Currency & Tax, Order Settings, Notifications) 🔄 (uses local state initialized from `mockBusinessSettings`).
  - 3rd Party Configuration (`admin/3rd-party/page.tsx`): ✅ All 5 tabs present (Payment Gateway, SMS Gateway, Mail Config, Firebase Notification, Google ReCaptcha). Confirmed Payment Gateway shows **ONLY bKash, SSLCommerz, and Cash on Delivery (COD)** with sandbox/live modes and credential inputs. 🔄 (uses local state initialized from `mockThirdPartyConfig`).

### 7. Frontend — Mock Data vs Real API Status
- **`src/lib/api-client.ts`**: ❌ Does not exist.
- **API Fetching calls**: 0 pages make calls to `apiGet`, `apiPost`, `fetch()`, or `axios`.
- **Mock Data status**:
  - Every single dynamic page (all 7 storefront pages, all 7 customer dashboard pages, and all 71 admin routes/tabs) imports directly from `@/lib/mock-data/...` or relies on React local state.
  - Overall status: **100% Mock Data (🔄)**.

### 8. Backend — NestJS Modules
Module folders located under `api/src/`:
1. **`auth` (`api/src/auth/`)**:
   - **Controller**: `auth.controller.ts`
   - **Service**: `auth.service.ts`
   - **DTOs**: `login.dto.ts`, `register-customer.dto.ts`, `change-password.dto.ts`, `forgot-password.dto.ts`, `reset-password.dto.ts`
   - **Guards & Strategies**: `jwt-auth.guard.ts`, `permissions.guard.ts`, `jwt-access.strategy.ts`, `jwt-refresh.strategy.ts`
   - **Decorators**: `@CurrentUser`, `@Public`, `@RequirePermission`, `@Match`
   - **Endpoints (9 total)**:
     - `POST /api/v1/v1/auth/customer/register` (Public)
     - `POST /api/v1/v1/auth/customer/login` (Public, Throttled)
     - `POST /api/v1/v1/auth/staff/login` (Public, Throttled)
     - `POST /api/v1/v1/auth/refresh` (Public)
     - `POST /api/v1/v1/auth/logout` (Protected)
     - `POST /api/v1/v1/auth/change-password` (Protected)
     - `POST /api/v1/v1/auth/forgot-password` (Public, Throttled)
     - `POST /api/v1/v1/auth/reset-password` (Public)
     - `GET /api/v1/v1/auth/me` (Protected)
   - **`@RequirePermission` on mutating routes**: None in `auth.controller.ts` (all endpoints are either public or user-scoped self-service).
2. **`prisma` (`api/src/prisma/`)**:
   - **Module**: `prisma.module.ts`
   - **Service**: `prisma.service.ts` (manages Prisma client lifecycle).
3. **Missing Modules**:
   - ❌ Category, Brand, Product, Branch, Sales, Orders, Sales Returns, Exchanges, Stock Adjustments, HRM (Employees, Technicians, Departments, Roles, Payroll), Reports, Accounting (Wallet, Expenses, Suppliers, Purchases), Marketing (Banners, Ads, Promos, Notifications, Blogs), CMS (Pages, Menus, Footer, Countries, Social, Contacts, Tickets), Settings / 3rd Party Config.

### 9. Backend — Database
- **`npx prisma validate`**: ✅ Passed cleanly (`The schema at prisma/schema.prisma is valid 🚀`).
- **Models in `schema.prisma` (64 total)**:
  `Role`, `RolePermission`, `Staff`, `RefreshToken`, `Customer`, `Address`, `Branch`, `Department`, `Category`, `Brand`, `Series`, `Unit`, `Attribute`, `AttributeValue`, `Product`, `ProductImage`, `ProductVariant`, `ProductSpecification`, `WantedProduct`, `WastedProduct`, `Order`, `OrderItem`, `OrderStatusHistory`, `SalesReturn`, `SalesReturnItem`, `Exchange`, `ServiceJob`, `Shipment`, `StockAdjustment`, `Payroll`, `WalletType`, `WalletTransaction`, `Purpose`, `ExpenseCategory`, `Expense`, `Supplier`, `SupplierPayment`, `PurchaseOrder`, `PurchaseOrderItem`, `Banner`, `Ad`, `PromoCode`, `PushNotification`, `Blog`, `Page`, `MenuItem`, `FooterSettings`, `Country`, `SocialLink`, `ContactSubmission`, `TicketIssueType`, `SupportTicket`, `SupportTicketMessage`, `HelpNote`, `Wishlist`, `Review`, `BusinessSetting`, `PaymentGatewayConfig`, `SmsConfig`, `MailConfig`, `FirebaseConfig`, `RecaptchaConfig`, `MessageTemplate`, `PasswordResetToken`.
- **Prisma Studio**: ✅ Starts cleanly on port 5555 (`http://localhost:5555`).
- **Seeded Data Status**: ✅ Verified in PostgreSQL database:
  - Roles: 9
  - Staff: 1 (Super Admin: `admin@novamobile.test`)
  - Branches: 3 (Dhaka Main, Chittagong Outlet, Sylhet Warehouse)
  - Categories: 3
  - Country: 1 (Bangladesh)
  - Config records: BusinessSetting, PaymentGatewayConfig (BKASH, SSLCOMMERZ, COD), SmsConfig, MailConfig, FirebaseConfig, RecaptchaConfig all populated.

### 10. Auth + RBAC Status
- **`AUTH_RBAC_VERIFICATION_REPORT.md`**: ❌ Does not exist in the repository.
- **Backend RBAC Core**:
  - `PermissionsGuard` (`api/src/auth/guards/permissions.guard.ts`): ✅ Exists and enforces `rolePermission` table lookup and `OWN_BRANCH` scope validation.
  - `JwtAuthGuard` (`api/src/auth/guards/jwt-auth.guard.ts`): ✅ Exists and integrates with `@Public()` metadata bypass.
  - `@RequirePermission` (`api/src/auth/decorators/require-permission.decorator.ts`): ✅ Exists and binds module, action, and optional branch parameter keys.
- **Frontend Auth Context**:
  - `AuthContext`: ⚠️ Only `MockAuthContext.tsx` is implemented (`src/context/MockAuthContext.tsx`). A real JWT-persisting, token-refreshing `AuthContext` wired to backend endpoints has not yet been built.

### 11. Known Issues / Errors
- **Frontend TypeScript Errors / Dependency Status**:
  - `node_modules` is not installed at the repository root. Running `tsc` reveals missing type definitions until `npm install` is executed at the root level.
  - In code, two compile-time type bugs exist in mock data files:
    1. `src/lib/mock-data/hrm/role-permissions.ts` (lines 48, 59, 70, 103): `Type '{ module: Module; actions: string[]; }[]' is not assignable to type 'RolePermission[]'` (actions array inferred as generic `string[]` instead of `Action[]`).
    2. `src/lib/mock-data/sales/all.ts` (line 140): `Type '"Delivered"' is not assignable to type '"Pending" | "Returned" | "Cancelled" | "Diagnosing" | "Completed" | "In Transit"'`.
- **Backend TypeScript Errors**:
  - `api/src/` (`tsconfig.build.json`): ✅ Compiles with 0 errors.
  - `api/test/auth.e2e-spec.ts` (lines 26, 44, 55, 69): ⚠️ 4 type errors (TS2349) due to `import * as request from 'supertest'` expression callable signature mismatch.
- **Dev Server Runtime Issues**:
  - **Frontend Dev Server (`npm run dev`)**: Fails to start (`sh: next: command not found`) due to missing root `node_modules`.
  - **Backend Dev Server (`npm run start`)**: Crashes on boot at `api/src/main.ts:14` with:
    `TypeError: compression is not a function at bootstrap (api/src/main.ts:14:11)` caused by `import * as compression from 'compression'`.
  - **Backend Route Prefix Bug**: `api/src/main.ts` sets `app.setGlobalPrefix('api/v1')` and `api/src/auth/auth.controller.ts` uses `@Controller('v1/auth')`, causing endpoints to mount at `/api/v1/v1/auth/...` instead of `/api/v1/auth/...`.

## 3. Broken / Incomplete Items Found
1. **Backend Startup Crash**:
   - File: `api/src/main.ts`, line 14 (`app.use(compression());`)
   - Issue: `import * as compression from 'compression'` fails in Node.js runtime (`TypeError: compression is not a function`).
2. **Backend Duplicate URL Prefix**:
   - Files: `api/src/main.ts` (line 11: `app.setGlobalPrefix('api/v1')`) and `api/src/auth/auth.controller.ts` (line 15: `@Controller('v1/auth')`)
   - Issue: All authentication endpoints are mounted under `/api/v1/v1/auth/*` instead of `/api/v1/auth/*`.
3. **E2E Test Type Mismatch**:
   - File: `api/test/auth.e2e-spec.ts`, lines 26, 44, 55, 69
   - Issue: `import * as request from 'supertest'` produces TS2349 ("expression is not callable").
4. **Mock Data TypeScript Type Mismatch**:
   - File: `src/lib/mock-data/sales/all.ts`, line 140 (`status: "Delivered"`)
   - Issue: `"Delivered"` is not in the union type of sales statuses for that mock collection.
5. **Role Permissions Mock Data Type Mismatch**:
   - File: `src/lib/mock-data/hrm/role-permissions.ts`, lines 48, 59, 70, 103
   - Issue: Inferred `string[]` for actions array is incompatible with `Action[]`.
6. **Frontend Root Dependencies**:
   - Root directory lacks `node_modules` (needs `npm install` to enable Next.js CLI and packages).
7. **Missing Frontend API Layer**:
   - `src/lib/api-client.ts` does not exist; no real API fetching layer exists in the frontend.
8. **Missing Backend Resource Modules**:
   - 14 business resource modules in NestJS (Products, Categories, Brands, Branches, Sales, Orders, HRM, Reports, Accounting, Marketing, CMS, Settings, Support, etc.) do not yet exist under `api/src/`.

## 4. What Appears 100% Complete
1. **Prisma Database Schema**: Complete with 64 models, relations, enums, indexes, and full validation (`npx prisma validate` passes).
2. **Database Seeding & Connectivity**: PostgreSQL running on port 5432 with 9 roles, 1 admin staff, 3 branches, 3 categories, and default business/payment configurations.
3. **Public Storefront UI Design & Layouts**: All 7 storefront pages and shared components (Header with mega-menu, Footer, ProductCard, BlogCard, EmptyState, HeroCarousel) with responsive styling and interaction states.
4. **Customer Dashboard UI Design**: All 10 customer pages (Orders with status tabs, Wishlist, Profile with avatar upload & verification tags, Address management, Support ticket dialog, Change Password, Terms, Privacy) with responsive layouts.
5. **Admin Navigation & Shell Structure**: Admin sidebar with all 14 nav groups, Topbar with branch switcher & palette popover, and Admin Dashboard page with KPI cards and Recharts analytics.
6. **Admin Module Frontend Pages**: All 71 admin route files across Sales, Order Handling, Products, Branches, HRM, Reports, Accounting, Marketing, CMS, Business Settings (all 5 tabs), and 3rd Party Config (all 5 tabs, bKash/SSLCommerz/COD only).
7. **Core Backend RBAC Primitives**: `PermissionsGuard`, `JwtAuthGuard`, `@RequirePermission` decorator, and JWT strategies exist in `api/src/auth/`.

## 5. What Is Missing / Not Started
1. **Backend Product / Category / Brand / Branch Modules** (Mapped to original backend API prompts for Catalog & Core data):
   - Missing NestJS modules, controllers, services, and DTOs for Category tree, Brands, Series, Units, Attributes, Products (CRUD, variants, specifications), Branches, and Stock Adjustments.
2. **Backend Order Handling & Sales Modules**:
   - Missing NestJS modules for POS/Courier/Diagnosing/Service sales, Customer Orders (state machine transitions, timeline logging), Sales Returns, and Exchanges.
3. **Backend HRM, Accounting, Marketing, CMS & Settings Modules**:
   - Missing NestJS modules for Employees, Technicians, Departments, Roles & Permission matrix updates, Payroll runs, Wallets, Expenses, Suppliers, Purchases, Banners, Ads, Promos, Push Notifications, Blogs, CMS Pages, Menus, Footer, Countries, Support Tickets, Business Settings, and 3rd Party Configurations.
4. **Frontend API Client & Real API Integration**:
   - Missing `src/lib/api-client.ts` with Axios/Fetch interceptors, JWT token injection, refresh token handling, error normalization, and migration of all 78 frontend routes from mock data to real API endpoints.
5. **Real Frontend AuthContext**:
   - Replacing `src/context/MockAuthContext.tsx` with production `AuthContext` supporting real customer/staff login, cookie handling, session restore via `/api/v1/auth/me`, and route guards.
6. **`AUTH_RBAC_VERIFICATION_REPORT.md`**:
   - Standalone verification report document from previous test prompt was not present in the workspace.

## 6. Recommended Next Step
The single most logical next phase is to **fix the two backend runtime bugs in `api/src/main.ts` and `api/src/auth/auth.controller.ts` (the `compression` import crash and duplicate `/api/v1/v1/` route prefix), implement the core backend catalog and branch modules (`CategoryModule`, `BrandModule`, `ProductModule`, `BranchModule` with full `@RequirePermission` guards), and create `src/lib/api-client.ts` on the frontend to begin wiring the first real endpoints (Authentication & Product Catalog) from backend to storefront/admin.**
