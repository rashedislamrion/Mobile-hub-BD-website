"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { ProductForm } from "@/components/admin/ProductForm";

export default function CreateProductPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();

  useEffect(() => {
    setTitle("Add New Product");
    setBadge("Website");
    setDateFilter(""); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Add New Product</h2>
          <p className="text-xs text-slate-500">Configure catalog specifications, attributes, pricing, and SEO</p>
        </div>
        <Link href="/admin/products">
          <Button variant="outline" size="sm" className="h-8 text-xs border-slate-300 text-slate-700 gap-1.5 hover:bg-slate-50">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to List
          </Button>
        </Link>
      </div>
      <ProductForm isEdit={false} />
    </div>
  );
}
