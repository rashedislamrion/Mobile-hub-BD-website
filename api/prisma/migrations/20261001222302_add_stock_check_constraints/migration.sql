-- AlterTable ProductVariant: prevent negative stock
ALTER TABLE "ProductVariant" ADD CONSTRAINT "chk_product_variant_stock_non_negative" CHECK ("stock" >= 0);

-- AlterTable BranchInventory: prevent negative quantity
ALTER TABLE "BranchInventory" ADD CONSTRAINT "chk_branch_inventory_quantity_non_negative" CHECK ("quantity" >= 0);