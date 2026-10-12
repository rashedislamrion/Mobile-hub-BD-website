"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ShoppingCart, ShieldCheck, Check, Sparkles, AlertCircle } from "lucide-react";
import { apiGet, getImageUrl } from "@/lib/api-client";
import { toast } from "sonner";

export interface PosProductVariant {
  id: string; // variantId
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  color: string | null;
  quality: string | null;
  sku: string;
  stock: number;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  categoryName: string;
  categoryId: string;
  categorySlug: string;
  brandName: string | null;
  isPhone?: boolean;
  condition?: string | null;
  attributes?: Record<string, any> | null;
  phoneUnits?: Array<{
    id: string;
    imei1: string;
    imei2?: string | null;
    serialNumber?: string | null;
    status: string;
    condition?: string | null;
    buyingPrice?: number;
    sellingPrice?: number;
  }>;
  allVariants: {
    id: string;
    color: string | null;
    quality: string | null;
    sku: string;
    stock: number;
    price: number;
    isPhone?: boolean;
    phoneUnits?: any[];
    attributes?: Record<string, any> | null;
  }[];
}

export interface PosProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: PosProductVariant | null;
  currentBranchId: string;
  cart: any[];
  onAddStandardItem: (item: {
    cartItemId: string;
    productId: string;
    variantId?: string;
    name: string;
    image: string;
    color: string | null;
    quality: string | null;
    sku: string;
    stock: number;
    unitPrice: number;
    originalPrice: number;
    quantity: number;
  }) => void;
  onAddPhoneItem: (item: {
    cartItemId: string;
    productId: string;
    variantId?: string;
    phoneUnitId: string;
    isPhone: boolean;
    imei1: string;
    imei2?: string | null;
    serialNumber?: string | null;
    phoneCondition: string;
    brandName?: string | null;
    warrantyType: string;
    warrantyPeriod: string;
    warrantyStartDate: string;
    warrantyEndDate: string;
    name: string;
    image: string;
    color: string | null;
    quality: string | null;
    sku: string;
    stock: number;
    unitPrice: number;
    originalPrice: number;
    quantity: number;
  }) => void;
}

export function PosProductModal({
  open,
  onOpenChange,
  product,
  currentBranchId,
  cart,
  onAddStandardItem,
  onAddPhoneItem,
}: PosProductModalProps) {
  // Active selected variant ID
  const [activeVariantId, setActiveVariantId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);

  // Quantity and price override
  const [quantity, setQuantity] = useState<number>(1);
  const [priceOverride, setPriceOverride] = useState<number | string>("");

  // Phone physical unit state (Fix Pass 20)
  const [phoneUnits, setPhoneUnits] = useState<any[]>([]);
  const [selectedPhoneUnitId, setSelectedPhoneUnitId] = useState<string>("");
  const [warrantyType, setWarrantyType] = useState<string>("7 Days Replacement");
  const [warrantyPeriod, setWarrantyPeriod] = useState<string>("7 Days");
  const [warrantyStartDate, setWarrantyStartDate] = useState<string>(() =>
    new Date().toISOString().split("T")[0]
  );
  const [warrantyEndDate, setWarrantyEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });

  const handleWarrantyPeriodChange = (period: string) => {
    setWarrantyPeriod(period);
    const d = new Date(warrantyStartDate || Date.now());
    if (period.includes("7") || period.toLowerCase().includes("week")) {
      d.setDate(d.getDate() + 7);
    } else if (
      period.includes("30") ||
      period.toLowerCase().includes("1 month") ||
      period.toLowerCase().includes("month")
    ) {
      d.setDate(d.getDate() + 30);
    } else if (period.includes("180") || period.toLowerCase().includes("6 month")) {
      d.setDate(d.getDate() + 180);
    } else if (period.includes("365") || period.toLowerCase().includes("1 year") || period.toLowerCase().includes("year")) {
      d.setDate(d.getDate() + 365);
    }
    setWarrantyEndDate(d.toISOString().split("T")[0]);
  };

  // Grouping: Distinct color options
  const colorOptions = useMemo(() => {
    if (!product?.allVariants || product.allVariants.length === 0) return [];
    const set = new Set<string>();
    product.allVariants.forEach((v) => {
      const val =
        v.color ||
        (v.attributes as any)?.Color ||
        (v.attributes as any)?.color;
      if (val && typeof val === "string" && val.trim()) {
        set.add(val.trim());
      }
    });
    return Array.from(set);
  }, [product]);

  // Grouping: Distinct quality options
  const qualityOptions = useMemo(() => {
    if (!product?.allVariants || product.allVariants.length === 0) return [];
    const set = new Set<string>();
    product.allVariants.forEach((v) => {
      const val =
        v.quality ||
        (v.attributes as any)?.Quality ||
        (v.attributes as any)?.quality ||
        (v.attributes as any)?.Grade ||
        (v.attributes as any)?.grade;
      if (val && typeof val === "string" && val.trim()) {
        set.add(val.trim());
      }
    });
    return Array.from(set);
  }, [product]);

  // Fetch available phone units for a specific variant
  const fetchPhoneUnitsForVariant = async (variantId: string) => {
    try {
      const branchParam = currentBranchId ? `&branchId=${currentBranchId}` : "";
      const units = await apiGet<any[]>(
        `/phone-units/available?variantId=${variantId}${branchParam}`
      );
      const list = Array.isArray(units) ? units : [];
      setPhoneUnits(list);
      if (list.length > 0) {
        setSelectedPhoneUnitId(list[0].id);
        if (list[0].sellingPrice) {
          setPriceOverride(list[0].sellingPrice);
        }
      } else {
        setSelectedPhoneUnitId("");
      }
    } catch {
      setPhoneUnits([]);
      setSelectedPhoneUnitId("");
    }
  };

  // Initialize modal state when product opens
  useEffect(() => {
    if (!product) return;

    setActiveVariantId(product.id);
    setQuantity(1);
    setPriceOverride(product.price);

    const initialColor =
      product.color ||
      (product.attributes as any)?.Color ||
      (product.attributes as any)?.color ||
      (colorOptions.length > 0 ? colorOptions[0] : null);

    const initialQuality =
      product.quality ||
      (product.attributes as any)?.Quality ||
      (product.attributes as any)?.quality ||
      (qualityOptions.length > 0 ? qualityOptions[0] : null);

    setSelectedColor(initialColor);
    setSelectedQuality(initialQuality);

    if (product.isPhone) {
      fetchPhoneUnitsForVariant(product.id);
    } else {
      setPhoneUnits([]);
      setSelectedPhoneUnitId("");
    }
  }, [product]);

  // Resolve currently active variant
  const activeVariant = useMemo(() => {
    if (!product) return null;
    if (activeVariantId && product.allVariants) {
      const found = product.allVariants.find((v) => v.id === activeVariantId);
      if (found) return found;
    }
    return {
      id: product.id,
      color: product.color,
      quality: product.quality,
      sku: product.sku,
      stock: product.stock,
      price: product.price,
      isPhone: product.isPhone,
      phoneUnits: product.phoneUnits,
      attributes: product.attributes,
    };
  }, [product, activeVariantId]);

  // Color selection -> Resolve to matching variant
  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    if (!product?.allVariants || product.allVariants.length === 0) return;

    // 1. Try finding exact variant with currently selected quality
    let match = selectedQuality
      ? product.allVariants.find(
          (v) =>
            (v.color?.trim() === colorName || (v.attributes as any)?.Color?.trim() === colorName) &&
            (v.quality?.trim() === selectedQuality || (v.attributes as any)?.Quality?.trim() === selectedQuality)
        )
      : undefined;

    // 2. Fallback: first variant with this color
    if (!match) {
      match = product.allVariants.find(
        (v) => v.color?.trim() === colorName || (v.attributes as any)?.Color?.trim() === colorName
      );
      if (match) {
        const fallbackQuality =
          match.quality ||
          (match.attributes as any)?.Quality ||
          (match.attributes as any)?.quality ||
          null;
        if (fallbackQuality) setSelectedQuality(fallbackQuality.trim());
      }
    }

    if (match) {
      setActiveVariantId(match.id);
      setPriceOverride(match.price);
      if (product.isPhone) {
        fetchPhoneUnitsForVariant(match.id);
      }
    }
  };

  // Quality selection -> Resolve to matching variant
  const handleSelectQuality = (qualityName: string) => {
    setSelectedQuality(qualityName);
    if (!product?.allVariants || product.allVariants.length === 0) return;

    // 1. Try finding exact variant with currently selected color
    let match = selectedColor
      ? product.allVariants.find(
          (v) =>
            (v.quality?.trim() === qualityName || (v.attributes as any)?.Quality?.trim() === qualityName) &&
            (v.color?.trim() === selectedColor || (v.attributes as any)?.Color?.trim() === selectedColor)
        )
      : undefined;

    // 2. Fallback: first variant with this quality
    if (!match) {
      match = product.allVariants.find(
        (v) => v.quality?.trim() === qualityName || (v.attributes as any)?.Quality?.trim() === qualityName
      );
      if (match) {
        const fallbackColor =
          match.color ||
          (match.attributes as any)?.Color ||
          (match.attributes as any)?.color ||
          null;
        if (fallbackColor) setSelectedColor(fallbackColor.trim());
      }
    }

    if (match) {
      setActiveVariantId(match.id);
      setPriceOverride(match.price);
      if (product.isPhone) {
        fetchPhoneUnitsForVariant(match.id);
      }
    }
  };

  // Stock check for Color button
  const checkColorDisabled = (colorName: string) => {
    if (!product?.allVariants || product.allVariants.length === 0) return false;
    if (selectedQuality && qualityOptions.length > 0) {
      const specificVariant = product.allVariants.find(
        (v) =>
          (v.color?.trim() === colorName || (v.attributes as any)?.Color?.trim() === colorName) &&
          (v.quality?.trim() === selectedQuality || (v.attributes as any)?.Quality?.trim() === selectedQuality)
      );
      if (specificVariant) {
        return specificVariant.stock <= 0;
      }
    }
    const colorVariants = product.allVariants.filter(
      (v) => v.color?.trim() === colorName || (v.attributes as any)?.Color?.trim() === colorName
    );
    if (colorVariants.length === 0) return true;
    return colorVariants.every((v) => v.stock <= 0);
  };

  // Stock check for Quality button
  const checkQualityDisabled = (qualityName: string) => {
    if (!product?.allVariants || product.allVariants.length === 0) return false;
    if (selectedColor && colorOptions.length > 0) {
      const specificVariant = product.allVariants.find(
        (v) =>
          (v.color?.trim() === selectedColor || (v.attributes as any)?.Color?.trim() === selectedColor) &&
          (v.quality?.trim() === qualityName || (v.attributes as any)?.Quality?.trim() === qualityName)
      );
      if (specificVariant) {
        return specificVariant.stock <= 0;
      }
    }
    const qualityVariants = product.allVariants.filter(
      (v) => v.quality?.trim() === qualityName || (v.attributes as any)?.Quality?.trim() === qualityName
    );
    if (qualityVariants.length === 0) return true;
    return qualityVariants.every((v) => v.stock <= 0);
  };

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!product || !activeVariant) return;

    // Flow 1: Phone Device (IMEI Selection)
    if (product.isPhone) {
      if (!selectedPhoneUnitId) {
        toast.error("Please select a physical phone unit (IMEI) to add to cart.");
        return;
      }
      const chosenUnit = phoneUnits.find((u) => u.id === selectedPhoneUnitId);
      if (!chosenUnit) {
        toast.error("Selected phone unit is not available.");
        return;
      }

      if (cart.some((item) => item.phoneUnitId === chosenUnit.id)) {
        toast.error(`Phone with IMEI ${chosenUnit.imei1} is already in the cart.`);
        return;
      }

      const unitPrice =
        Number(priceOverride) >= 0 ? Number(priceOverride) : chosenUnit.sellingPrice || activeVariant.price;
      const cartItemId = `pu-${chosenUnit.id}`;

      onAddPhoneItem({
        cartItemId,
        productId: product.productId,
        variantId: activeVariant.id.startsWith("pv-") ? undefined : activeVariant.id,
        phoneUnitId: chosenUnit.id,
        isPhone: true,
        imei1: chosenUnit.imei1,
        imei2: chosenUnit.imei2,
        serialNumber: chosenUnit.serialNumber,
        phoneCondition: chosenUnit.condition || product.condition || "NEW",
        brandName: product.brandName,
        warrantyType,
        warrantyPeriod,
        warrantyStartDate,
        warrantyEndDate,
        name: product.productName,
        image: product.productImage,
        color: activeVariant.color,
        quality: activeVariant.quality,
        sku: activeVariant.sku,
        stock: 1,
        unitPrice,
        originalPrice: chosenUnit.sellingPrice || activeVariant.price,
        quantity: 1,
      });

      toast.success(`Added phone ${product.productName} (IMEI: ${chosenUnit.imei1}) to cart`);
      onOpenChange(false);
      return;
    }

    // Flow 2: Standard Product (Displays, Accessories, Gadgets, Spare Parts)
    const qty = Number(quantity) || 1;
    if (qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (activeVariant.stock <= 0) {
      toast.error(`"${product.productName}" is out of stock in this branch`);
      return;
    }

    if (activeVariant.stock < qty) {
      toast.error(
        `Insufficient stock! Available in this branch: ${activeVariant.stock}, Requested: ${qty}`
      );
      return;
    }

    const unitPrice =
      Number(priceOverride) >= 0 ? Number(priceOverride) : activeVariant.price;
    const cartItemId = activeVariant.id;

    onAddStandardItem({
      cartItemId,
      productId: product.productId,
      variantId: activeVariant.id.startsWith("pv-") ? undefined : activeVariant.id,
      name: product.productName,
      image: product.productImage,
      color: activeVariant.color,
      quality: activeVariant.quality,
      sku: activeVariant.sku,
      stock: activeVariant.stock,
      unitPrice,
      originalPrice: activeVariant.price,
      quantity: qty,
    });

    toast.success(`Added ${qty}x ${product.productName} to cart`);
    onOpenChange(false);
  };

  if (!product) return null;

  const currentUnitPrice = Number(priceOverride || activeVariant?.price || 0);
  const lineTotal = currentUnitPrice * quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl bg-white max-h-[92vh] flex flex-col">
        {/* ========================================================================= */}
        {/* MODAL HEADER: Product Details label, large bold title, unit price         */}
        {/* ========================================================================= */}
        <DialogHeader className="p-6 md:p-8 pb-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Product Details
              </p>
              <DialogTitle className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {product.productName}
              </DialogTitle>
              <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
                {product.categoryName && (
                  <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                    {product.categoryName}
                  </span>
                )}
                {product.brandName && (
                  <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                    {product.brandName}
                  </span>
                )}
                {product.condition && (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                    Condition: {product.condition}
                  </span>
                )}
              </div>
            </div>

            {/* Live Unit Price */}
            <div className="sm:text-right shrink-0">
              <div className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">
                ৳{currentUnitPrice.toLocaleString()}
              </div>
              {product.regularPrice && currentUnitPrice < product.regularPrice && (
                <div className="text-xs text-slate-400 line-through font-semibold mt-0.5">
                  ৳{product.regularPrice.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* ========================================================================= */}
        {/* MODAL BODY: Separate Color, Quality sections, IMEI, and Quantity controls */}
        {/* ========================================================================= */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          {/* COLOR SECTION (Rendered if color options exist) */}
          {colorOptions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Color
                  </label>
                  {selectedColor && (
                    <span className="text-xs font-semibold text-slate-600">
                      Active: <span className="font-bold text-emerald-700">{selectedColor}</span>
                    </span>
                  )}
                </div>

                {/* Inline Stock Display for Selected Color/Variant (Fix Pass 23) */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      (activeVariant?.stock ?? product.stock) > 0
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-rose-500"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      (activeVariant?.stock ?? product.stock) > 0
                        ? "text-emerald-700"
                        : "text-rose-600"
                    }`}
                  >
                    {(activeVariant?.stock ?? product.stock) > 0
                      ? `${activeVariant?.stock ?? product.stock} in stock`
                      : "Out of stock"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {colorOptions.map((c) => {
                  const isSelected = selectedColor === c;
                  const isOutOfStock = checkColorDisabled(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      disabled={isOutOfStock}
                      onClick={() => handleSelectColor(c)}
                      className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all border flex items-center gap-2 ${
                        isSelected
                          ? "bg-emerald-50/90 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs"
                          : isOutOfStock
                          ? "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed line-through"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                      <span>{c}</span>
                      {isOutOfStock && (
                        <span className="text-[10px] text-rose-500 font-normal no-underline">
                          (0 in stock)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUALITY SECTION (Rendered if quality options exist) */}
          {qualityOptions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Quality
                  </label>
                  {selectedQuality && (
                    <span className="text-xs font-semibold text-slate-600">
                      Active: <span className="font-bold text-emerald-700">{selectedQuality}</span>
                    </span>
                  )}
                </div>

                {/* If product has no color options, show stock in Quality section header */}
                {colorOptions.length === 0 && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        (activeVariant?.stock ?? product.stock) > 0
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-rose-500"
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        (activeVariant?.stock ?? product.stock) > 0
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      {(activeVariant?.stock ?? product.stock) > 0
                        ? `${activeVariant?.stock ?? product.stock} in stock`
                        : "Out of stock"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {qualityOptions.map((q) => {
                  const isSelected = selectedQuality === q;
                  const isOutOfStock = checkQualityDisabled(q);
                  return (
                    <button
                      type="button"
                      key={q}
                      disabled={isOutOfStock}
                      onClick={() => handleSelectQuality(q)}
                      className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all border flex items-center gap-2 ${
                        isSelected
                          ? "bg-emerald-50/90 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs"
                          : isOutOfStock
                          ? "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed line-through"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                      <span>{q}</span>
                      {isOutOfStock && (
                        <span className="text-[10px] text-rose-500 font-normal no-underline">
                          (0 in stock)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FLOW 1: PHONE DEVICE PHYSICAL IMEI SELECTION (Fix Pass 20)                */}
          {/* ========================================================================= */}
          {product.isPhone ? (
            <div className="space-y-5 pt-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Physical Device (IMEI) *
                  </label>
                  <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                    {phoneUnits.length} in stock
                  </span>
                </div>

                {phoneUnits.length === 0 ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> No Physical Phone Units In Stock
                    </p>
                    <p className="text-[11px] mt-1 text-rose-600 leading-relaxed">
                      There are no available units with status &quot;IN_STOCK&quot; for this variant. Please purchase or receive units before selling.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {phoneUnits.map((unit) => {
                      const isSelected = selectedPhoneUnitId === unit.id;
                      return (
                        <div
                          key={unit.id}
                          onClick={() => {
                            setSelectedPhoneUnitId(unit.id);
                            if (unit.sellingPrice) setPriceOverride(unit.sellingPrice);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            isSelected
                              ? "bg-purple-50/80 border-purple-600 ring-2 ring-purple-600/20 text-purple-950 font-bold shadow-xs"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div>
                            <div className="font-mono text-sm text-purple-900 font-extrabold flex items-center gap-1.5">
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-700 stroke-[3]" />}
                              IMEI 1: {unit.imei1}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                              {unit.imei2 ? `IMEI 2: ${unit.imei2} • ` : ""}
                              Condition: <span className="font-semibold text-slate-700">{unit.condition || product.condition || "NEW"}</span>
                              {unit.serialNumber ? ` • S/N: ${unit.serialNumber}` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-700">
                              ৳{(unit.sellingPrice || activeVariant?.price || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Warranty Settings */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Outbound Customer Warranty
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Warranty Type
                    </label>
                    <select
                      value={warrantyType}
                      onChange={(e) => setWarrantyType(e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="7 Days Replacement">7 Days Replacement</option>
                      <option value="1 Month Service Warranty">1 Month Service Warranty</option>
                      <option value="6 Months Service Warranty">6 Months Service Warranty</option>
                      <option value="1 Year Official Warranty">1 Year Official Warranty</option>
                      <option value="No Warranty">No Warranty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Warranty Period
                    </label>
                    <select
                      value={warrantyPeriod}
                      onChange={(e) => handleWarrantyPeriodChange(e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="7 Days">7 Days</option>
                      <option value="30 Days / 1 Month">30 Days / 1 Month</option>
                      <option value="180 Days / 6 Months">180 Days / 6 Months</option>
                      <option value="365 Days / 1 Year">365 Days / 1 Year</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={warrantyStartDate}
                      onChange={(e) => setWarrantyStartDate(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={warrantyEndDate}
                      onChange={(e) => setWarrantyEndDate(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Demoted SKU line */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    SKU:
                  </span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {activeVariant?.sku || product.sku}
                  </span>
                </div>
              </div>

              {/* Price Override for Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Selling Price (৳)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder="Selling price"
                  className="h-11 text-base font-bold text-emerald-800 bg-white"
                />
              </div>

              {/* Add Phone Button */}
              <button
                type="button"
                disabled={!selectedPhoneUnitId || phoneUnits.length === 0}
                onClick={handleAddToCart}
                className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Add Selected Phone to Cart
              </button>
            </div>
          ) : (
            /* ========================================================================= */
            /* FLOW 2: STANDARD PRODUCT (REFINED FIX PASS 23: UNIFIED ACTION ROW)        */
            /* ========================================================================= */
            <div className="space-y-3 pt-2">
              {/* Demoted SKU line and Line Total preview */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 pb-0.5 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    SKU:
                  </span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {activeVariant?.sku || product.sku}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Fallback stock display if neither Color nor Quality sections are present */}
                  {colorOptions.length === 0 && qualityOptions.length === 0 && (
                    <span
                      className={`font-semibold mr-2 flex items-center gap-1.5 ${
                        (activeVariant?.stock ?? product.stock) > 0
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          (activeVariant?.stock ?? product.stock) > 0
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-rose-500"
                        }`}
                      />
                      {(activeVariant?.stock ?? product.stock) > 0
                        ? `${activeVariant?.stock ?? product.stock} in stock`
                        : "Out of stock"}
                    </span>
                  )}
                  <span className="text-slate-500">
                    Line Total:{" "}
                    <span className="font-bold text-slate-900 text-sm">
                      ৳{lineTotal.toLocaleString()}
                    </span>
                    {quantity > 1 && (
                      <span className="text-[11px] text-slate-400 font-normal ml-1">
                        (৳{currentUnitPrice.toLocaleString()} × {quantity})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* UNIFIED SINGLE ACTION ROW: Quantity Stepper, Override Price, and Add to Cart Button */}
              {/* Responsive: On mobile (<sm), Quantity + Price sit on 1 row and Add to Cart on row 2. On sm+, all 3 sit in ONE row */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="grid grid-cols-2 sm:flex sm:items-end gap-3 shrink-0">
                  {/* Quantity Stepper */}
                  <div className="sm:w-36">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Quantity *
                    </label>
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 h-11">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center font-bold text-slate-700 shadow-2xs border border-slate-200 text-base transition-colors"
                      >
                        −
                      </button>
                      <Input
                        type="number"
                        min={1}
                        max={activeVariant?.stock || 9999}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                        className="h-9 text-center text-sm font-bold border-none bg-transparent shadow-none focus-visible:ring-0 p-0"
                      />
                      <button
                        type="button"
                        disabled={activeVariant ? quantity >= activeVariant.stock : false}
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-9 h-9 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center font-bold text-slate-700 shadow-2xs border border-slate-200 text-base transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Override Price Input */}
                  <div className="sm:w-44">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Override Price (৳)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={priceOverride}
                      onChange={(e) => setPriceOverride(e.target.value)}
                      placeholder="Regular price"
                      className="h-11 text-sm font-bold text-emerald-800 bg-white border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Add to Cart Button */}
                <div className="flex-1 w-full">
                  <button
                    type="button"
                    disabled={!activeVariant || activeVariant.stock <= 0}
                    onClick={handleAddToCart}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm whitespace-nowrap"
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    <span>Add to Cart ({quantity}x) — ৳{lineTotal.toLocaleString()}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
