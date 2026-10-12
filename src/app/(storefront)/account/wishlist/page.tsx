"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeartCrack, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/ProductCard";
import { apiGet } from "@/lib/api-client";

export default function WishlistPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In future or current setup, fetch wishlist or popular products
    const loadData = async () => {
      try {
        const res = await apiGet<{ data: any[] }>("/products", { limit: 4 });
        setProducts(res?.data || []);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Wishlist ({products.length})
        </h1>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            icon={HeartCrack}
            title="Wishlist is empty"
            subtitle="You haven't added any products to your wishlist yet."
            action={
              <Button asChild variant="outline">
                <Link href="/">Browse Products</Link>
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
