export type AdjustmentType = "Increase" | "Decrease" | "Recount/Correction";
export type AdjustmentReason = "Damaged" | "Recount Correction" | "Theft/Loss" | "Return to Supplier" | "New Stock Received" | "Other";

export interface StockAdjustment {
  id: string; // Reference No.
  date: string;
  branch: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  type: AdjustmentType;
  quantityChange: number; // positive or negative
  stockBefore: number;
  stockAfter: number;
  reason: AdjustmentReason;
  notes?: string;
  adjustedBy: string;
}

export const mockStockAdjustments: StockAdjustment[] = [
  {
    id: "ADJ-2026-00142",
    date: "2026-08-14T10:30:00Z",
    branch: "Dhaka Main Branch",
    productId: "p1",
    productName: "iPhone 13 Pro Max Display - OLED",
    productSku: "IP13PM-DIS-OLED",
    productImage: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=200&h=200&fit=crop",
    type: "Increase",
    quantityChange: 15,
    stockBefore: 45,
    stockAfter: 60,
    reason: "New Stock Received",
    adjustedBy: "Rahim Uddin",
  },
  {
    id: "ADJ-2026-00141",
    date: "2026-08-14T09:15:00Z",
    branch: "Chattogram Branch",
    productId: "p2",
    productName: "Samsung Galaxy S22 Ultra Battery",
    productSku: "S22U-BAT-OEM",
    productImage: "https://images.unsplash.com/photo-1606555198032-411bd1933ba1?w=200&h=200&fit=crop",
    type: "Decrease",
    quantityChange: -2,
    stockBefore: 12,
    stockAfter: 10,
    reason: "Damaged",
    notes: "Swollen battery found during inventory check",
    adjustedBy: "Karim Hasan",
  },
  {
    id: "ADJ-2026-00140",
    date: "2026-08-13T16:45:00Z",
    branch: "Central Warehouse",
    productId: "p3",
    productName: "MacBook Pro 16\" Screen Assembly",
    productSku: "MBP16-SCR-A2141",
    productImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop",
    type: "Recount/Correction",
    quantityChange: 1,
    stockBefore: 4,
    stockAfter: 5,
    reason: "Recount Correction",
    notes: "Found one extra box behind the shelf",
    adjustedBy: "Jashim Uddin",
  },
  {
    id: "ADJ-2026-00139",
    date: "2026-08-13T14:20:00Z",
    branch: "Dhaka Main Branch",
    productId: "p4",
    productName: "OnePlus 9 Pro Charging Flex",
    productSku: "OP9P-CHGFX",
    productImage: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=200&h=200&fit=crop",
    type: "Decrease",
    quantityChange: -5,
    stockBefore: 30,
    stockAfter: 25,
    reason: "Return to Supplier",
    notes: "Batch was defective, returning to supplier",
    adjustedBy: "Rahim Uddin",
  },
  {
    id: "ADJ-2026-00138",
    date: "2026-08-12T11:00:00Z",
    branch: "Chattogram Branch",
    productId: "p5",
    productName: "AirPods Pro Replacement Earbud",
    productSku: "APP-EAR-L",
    productImage: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=200&h=200&fit=crop",
    type: "Decrease",
    quantityChange: -1,
    stockBefore: 8,
    stockAfter: 7,
    reason: "Theft/Loss",
    notes: "Missing from display counter",
    adjustedBy: "Karim Hasan",
  },
  {
    id: "ADJ-2026-00137",
    date: "2026-08-12T09:30:00Z",
    branch: "Dhaka Main Branch",
    productId: "p1",
    productName: "iPhone 13 Pro Max Display - OLED",
    productSku: "IP13PM-DIS-OLED",
    productImage: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=200&h=200&fit=crop",
    type: "Recount/Correction",
    quantityChange: -2,
    stockBefore: 47,
    stockAfter: 45,
    reason: "Recount Correction",
    notes: "System showed 47, physical count is 45",
    adjustedBy: "Admin User",
  },
];
