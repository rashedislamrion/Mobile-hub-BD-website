"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/api-client";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price?: number | string;
    regularPrice?: number | string;
    oldPrice?: number | string | null;
    salePrice?: number | string | null;
    saveAmount?: number;
    stock?: number;
    totalStock?: number;
    images?: Array<string | { id?: string; url: string }>;
    category?: { id?: string; name: string; slug?: string } | null;
    brand?: { id?: string; name: string } | null;
    variants?: Array<{ id?: string; stock: number; price: number | string }>;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  // Normalize pricing
  const regularPrice = Number(product.regularPrice ?? product.price ?? 0);
  const salePrice = product.salePrice ? Number(product.salePrice) : product.oldPrice ? Number(product.price) : null;
  const originalPrice = product.oldPrice ? Number(product.oldPrice) : salePrice ? regularPrice : null;
  const currentPrice = salePrice ? salePrice : regularPrice;
  const saveAmount = originalPrice && currentPrice < originalPrice ? originalPrice - currentPrice : 0;

  // Calculate stock
  const totalStock = product.totalStock ?? product.stock ?? (
    product.variants && product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : 1
  );
  const isOutOfStock = totalStock <= 0;

  // Normalize image
  const firstImage = product.images?.[0];
  const imageRawUrl = typeof firstImage === "string" ? firstImage : firstImage?.url;
  const imageUrl = getImageUrl(imageRawUrl);

  const categorySlug = product.category?.slug || (product.category?.name ? product.category.name.toLowerCase().replace(/\s+/g, '-') : 'all');

  return (
    <div className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      {/* Badges */}
      {saveAmount > 0 ? (
        <Badge className="absolute top-2 left-2 z-10 bg-danger text-white border-none font-semibold shadow-sm text-xs">
          SAVE ৳{saveAmount.toLocaleString()}
        </Badge>
      ) : null}

      {/* Image Area */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-slate-50 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageUrl} 
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/category/${categorySlug}`} className="text-xs text-slate-400 font-medium hover:text-primary mb-1 truncate">
          {product.category?.name || "Spare Parts"}
        </Link>
        <Link href={`/product/${product.slug}`} className="block mb-2 flex-1">
          <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-snug group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="flex items-end gap-2 mb-4">
          <span className="text-lg font-bold text-slate-900">৳{currentPrice.toLocaleString()}</span>
          {originalPrice && originalPrice > currentPrice && (
            <span className="text-xs text-slate-400 line-through mb-0.5">৳{originalPrice.toLocaleString()}</span>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 mt-auto">
          <Button variant="outline" size="icon" className="shrink-0 text-slate-400 hover:text-danger hover:border-danger hover:bg-danger/5 transition-colors">
            <Heart className="w-5 h-5" />
          </Button>
          
          {isOutOfStock ? (
            <Button variant="outline" className="w-full text-slate-400 border-slate-200 cursor-not-allowed" disabled>
              Out of Stock
            </Button>
          ) : (
            <Link href={`/product/${product.slug}`} className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm">
                View & Buy
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
