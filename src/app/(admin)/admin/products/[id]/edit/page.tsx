"use client";

import { useEffect, useState } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { ProductForm, ExistingProductData } from "@/components/admin/ProductForm";
import { apiGet } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [product, setProduct] = useState<ExistingProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTitle("Edit Product");
    setBadge("Website");
    setDateFilter(""); 

    (async () => {
      setIsLoading(true);
      try {
        const data = await apiGet<ExistingProductData>(`/products/${params.id}`);
        setProduct(data);
        if (data?.name) {
          setTitle(`Edit: ${data.name}`);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.id, setTitle, setBadge, setDateFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <Skeleton className="h-10 w-1/3" />
        <div className="flex gap-6">
          <Skeleton className="h-[500px] w-2/3" />
          <Skeleton className="h-[300px] w-1/3" />
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="p-6 text-slate-500">Product not found in database.</div>;
  }

  return (
    <div className="pb-10">
      <ProductForm initialData={product} isEdit={true} productId={params.id} />
    </div>
  );
}
