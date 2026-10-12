"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Smartphone, Filter, ChevronLeft, Search, RefreshCw, CheckCircle2 } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface Brand {
  id: string;
  name: string;
}

export default function PhonesStorefrontPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load Brands
  useEffect(() => {
    apiGet<Brand[]>("/brands")
      .then((res) => setBrands(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  // Fetch Phones from Real Backend
  const loadPhones = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        type: "PHONE",
        limit: 50,
      };
      if (selectedBrand !== "ALL") params.brandId = selectedBrand;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiGet<any>("/products", params);
      const list = Array.isArray(res) ? res : res?.data || [];
      setProducts(list);
    } catch (e) {
      console.error("Failed to load phones", e);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBrand, searchQuery]);

  useEffect(() => {
    loadPhones();
  }, [loadPhones]);

  // Sorted Products
  const sortedProducts = useMemo(() => {
    const copy = [...products];
    if (sortBy === "price_asc") {
      copy.sort((a, b) => Number(a.sellingPrice || a.price || 0) - Number(b.sellingPrice || b.price || 0));
    } else if (sortBy === "price_desc") {
      copy.sort((a, b) => Number(b.sellingPrice || b.price || 0) - Number(a.sellingPrice || a.price || 0));
    }
    return copy;
  }, [products, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">Smartphones & Handsets</span>
      </nav>

      {/* Hero Banner for Phones */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white mb-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 mb-3">
            <Smartphone className="w-3.5 h-3.5 mr-1" />
            Original Handsets & Flagships
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Smartphones, iPhones & Tablets
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Browse our inventory of verified brand-new, official, and pre-owned smartphones. Each device undergoes hardware inspection with verified IMEI stock.
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 opacity-10 hidden lg:block">
          <Smartphone className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Brand Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedBrand("ALL")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedBrand === "ALL"
                ? "bg-primary text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBrand(b.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedBrand === b.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search phone model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-8 px-3 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:ring-primary"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid of Phones */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Smartphone className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No phones matching criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try choosing a different brand or clearing search terms to explore available devices.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedBrand("ALL");
              setSearchQuery("");
            }}
            className="mt-4 text-xs"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
