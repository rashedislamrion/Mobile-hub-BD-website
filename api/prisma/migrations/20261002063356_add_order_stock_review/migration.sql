-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "needsStockReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stockReviewNote" TEXT;

-- CreateIndex
CREATE INDEX "Order_needsStockReview_idx" ON "Order"("needsStockReview");
