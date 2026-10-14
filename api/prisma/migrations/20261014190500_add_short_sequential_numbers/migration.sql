-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderSeq" INTEGER,
ADD COLUMN "shortCode" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN "poSeq" INTEGER,
ADD COLUMN "shortCode" TEXT;

-- Backfill Order sequential numbers ordered by createdAt
WITH ranked_orders AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as seq
  FROM "Order"
)
UPDATE "Order" o
SET
  "orderSeq" = ro.seq,
  "shortCode" = '#' || LPAD(ro.seq::TEXT, 3, '0')
FROM ranked_orders ro
WHERE o.id = ro.id;

-- Backfill PurchaseOrder sequential numbers ordered by createdAt
WITH ranked_pos AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as seq
  FROM "PurchaseOrder"
)
UPDATE "PurchaseOrder" po
SET
  "poSeq" = rp.seq,
  "shortCode" = '#PO-' || LPAD(rp.seq::TEXT, 3, '0')
FROM ranked_pos rp
WHERE po.id = rp.id;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderSeq_key" ON "Order"("orderSeq");
CREATE INDEX "Order_shortCode_idx" ON "Order"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poSeq_key" ON "PurchaseOrder"("poSeq");
CREATE INDEX "PurchaseOrder_shortCode_idx" ON "PurchaseOrder"("shortCode");
