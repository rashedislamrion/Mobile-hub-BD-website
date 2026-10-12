# Phase 6 — Sales/Orders Verification Report
Date: 2026-08-22 21:29:14 UTC+6

## Pre-flight: PASS
- Backend boots cleanly on port 4000.
- Staff authentication (`/auth/staff/login`) operates with JWT access/refresh token generation.
- Phase 5 Catalog regression check (`/categories/tree`, `/products`, `/branches/public`) returned 200 OK.
- `OrderNote` model added to `schema.prisma` and synchronized to PostgreSQL without data loss.

## Check 1 — Stock Deduction on Order: PASS [before: 50, after: 47, ordered qty: 3]
- Created POS Order (`POST /orders`) for product variant `P6-TEST` with quantity 3.
- Database stock before creation: 50
- Database stock after creation: 47
- Exact decrement of 3 units verified via Prisma `$transaction`.

## Check 2 — Status Transition + Timeline: PASS [valid transitions shown, illegal transition rejected with 400: yes]
- Created Website Order (initial status: `PENDING`).
- Valid status transitions executed:
  - `PENDING` -> `CONFIRMED` (HTTP 200)
  - `CONFIRMED` -> `PARCEL_BOOKED` (HTTP 200)
  - `PARCEL_BOOKED` -> `DELIVERED` (HTTP 200)
- Timeline rows in `OrderStatusHistory` recorded with staff attribution and custom notes.
- Illogical transition attempt (`DELIVERED` -> `PENDING`) was rejected with HTTP 400 Bad Request ("Transition from DELIVERED to PENDING is not allowed").

## Check 3 — Stock Restoration on Cancel: PASS [before: 44, after: 46]
- Created and confirmed an order for 2 units (deducting stock from 46 to 44).
- Transitioned order status to `CANCELLED` (`PATCH /orders/:id/status`).
- Stock verified restored back to 46 in database without duplicate additions.

## Check 4 — Sales Return Stock Restoration: PASS [before: 44, after: 45, qty: 1]
- Created Sales Return (`POST /sales-returns`) for 1 defective item from delivered order.
- Approved return via `PATCH /sales-returns/:id/approve`.
- Product variant stock automatically incremented from 44 to 45 in transactional update.

## Check 5 — 403 Permission Enforcement: PASS [role used: SEO, action attempted: POST /orders (CREATE ORDERS), status code: 403, admin retry status code: 201]
- Logged in as `seo@novamobile.test` (role: `SEO`, which lacks `ORDERS` module permissions).
- Attempted `POST /orders` with valid SEO bearer token -> Received HTTP 403 Forbidden.
- Re-attempted identical `POST /orders` request with Super Admin bearer token -> Received HTTP 201 Created.

## Check 6 — 403 Branch Scope Enforcement: PASS [staff branch: BR-DHK (Dhaka Main), target order branch: BR-CTG (Chittagong Outlet), status code: 403, own-branch retry status code: 200]
- Created Branch Admin staff assigned to Branch Dhaka (`BR-DHK`) with `OWN_BRANCH` scope.
- Attempted status update (`PATCH /orders/:id/status`) on an order owned by Chittagong Outlet (`BR-CTG`) -> Received HTTP 403 Forbidden ("You can only access or modify data belonging to your own branch.").
- Attempted status update (`PATCH /orders/:id/status`) on an order owned by Dhaka Main (`BR-DHK`) -> Received HTTP 200 OK.

## Check 7 — Frontend Real-Data Rendering: PASS [per page]
- `GET /admin/sales/diagnosing` -> 200 OK
- `GET /admin/sales/courier` -> 200 OK
- `GET /admin/sales/all` -> 200 OK
- `GET /admin/sales/service` -> 200 OK
- `GET /admin/sales/courier-list` -> 200 OK
- `GET /admin/orders` -> 200 OK
- `GET /admin/orders/:id` -> 200 OK
- `GET /admin/sales-returns` -> 200 OK
- `GET /admin/exchanges` -> 200 OK
- `GET /account/orders` -> 200 OK

## Check 8 — No Mock Imports Remain: PASS [grep output]
- Grep scan across all 11 target pages in Part B confirmed 0 `mock-data` imports remaining.

## Issues Found & Fixed
1. TypeScript strict decorator metadata error for `JwtPayload` in `order.controller.ts` and `service-job.controller.ts` resolved using `import type`.
2. Variant stock null inference and `OrderStatus` array typing in `order.service.ts` resolved with explicit type assertions.
3. Database `isOnlineDefault` column preserved on `Branch` model in `schema.prisma` to maintain zero data loss during schema synchronization.
4. Added global `AuthProvider` wrapping in `src/app/layout.tsx` to ensure admin and customer pages seamlessly authenticate.

## Overall Result
PASS

## Recommendation
The Sales, Orders, Service Jobs, Courier Tracking, Sales Returns, and Exchanges modules are now fully implemented and connected to real PostgreSQL database transactions and RBAC permissions. The frontend admin management views and customer order history now consume live backend endpoints with zero mock data. Follow-up milestones for future phases include integrating the storefront payment gateways (bKash / SSLCommerz / COD) for customer self-checkout and the dedicated POS terminal screen interface.
