"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Package, Check, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/api-client";

export interface ProductCatalogItem {
  id: string;
  name: string;
  code?: string | null;
  slug?: string;
  regularPrice: number | string;
  salePrice?: number | string | null;
  costPrice?: number | string | null;
  totalStock?: number;
  category?: { id: string; name: string; slug?: string } | null;
  brand?: { id: string; name: string; logo?: string | null } | null;
  images?: { id?: string; url: string }[];
  variants?: {
    id: string;
    color?: string | null;
    quality?: string | null;
    sku: string;
    stock: number;
    price: number | string;
    wholesalePrice?: number | string | null;
  }[];
}

interface ProductCatalogGridProps {
  products: ProductCatalogItem[];
  isLoading?: boolean;
  onSelectProduct: (product: ProductCatalogItem) => void;
  selectedProductId?: string | null;
  className?: string;
  maxHeight?: string;
}

export function ProductCatalogGrid({
  products = [],
  isLoading = false,
  onSelectProduct,
  selectedProductId = null,
  className = "",
  maxHeight = "max-h-[420px]",
}: ProductCatalogGridProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.category?.id && p.category?.name) {
        map.set(p.category.id, p.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const brands = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.brand?.id && p.brand?.name) {
        map.set(p.brand.id, p.brand.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.category?.id !== selectedCategory) {
        return false;
      }
      if (selectedBrand !== "all" && p.brand?.id !== selectedBrand) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesCode = p.code?.toLowerCase().includes(q);
        const matchesSku = p.variants?.some((v) => v.sku?.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesSku) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrand, search]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search catalog by name, code or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-sm"
          />
        </div>

        {brands.length > 0 && (
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div className={`${maxHeight} overflow-y-auto pr-1`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Layers className="w-8 h-8 animate-pulse mb-2 text-emerald-500" />
            <p className="text-xs">Loading catalog products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Package className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-600">No products found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try searching with a different keyword</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredProducts.map((p) => {
              const isSelected = selectedProductId === p.id;
              const imgUrl = p.images?.[0]?.url ? getImageUrl(p.images[0].url) : "/placeholder.png";
              const stock =
                p.totalStock !== undefined
                  ? p.totalStock
                  : p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProduct(p)}
                  className={`group relative flex flex-col p-2.5 bg-white rounded-2xl border text-left transition-all hover:shadow-md ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                      : "border-slate-200/80 hover:border-emerald-300"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="relative w-full aspect-square bg-slate-50 rounded-xl overflow-hidden mb-2 border border-slate-100 flex items-center justify-center">
                    <Image
                      src={imgUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-contain p-1.5 group-hover:scale-105 transition-transform"
                    />
                    {/* Stock badge */}
                    <div className="absolute bottom-1 left-1">
                      <Badge
                        variant={stock > 0 ? "outline" : "destructive"}
                        className={`text-[10px] px-1.5 py-0 font-medium ${
                          stock > 0
                            ? "bg-white/95 text-emerald-700 border-emerald-200"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {stock > 0 ? `${stock} in stock` : "Out of stock"}
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                      {p.name}
                    </p>
                    {p.code && (
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        Code: {p.code}
                      </p>
                    )}
                    <p className="text-xs font-bold text-emerald-700">
                      ৳{Number(p.regularPrice).toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
