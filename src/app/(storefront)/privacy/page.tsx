"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrivacyPage() {
  const [pageData, setPageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<any>("/pages/privacy-policy");
        setPageData(data);
      } catch (e) {
        // Use fallback
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 tracking-tight">
        {pageData?.title || "Privacy Policy"}
      </h1>
      <div className="prose prose-slate max-w-none bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        {pageData?.content ? (
          <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
        ) : (
          <>
            <p className="text-slate-600 leading-relaxed mb-6">
              At mobilehubbd, we are committed to safeguarding the privacy and security of our customers and site visitors. This Privacy Policy details how we collect, store, and utilize your personal information when you visit our store or place an order.
            </p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Information We Collect</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              When you purchase an item, register an account, or contact support, we collect contact details including your name, delivery address, phone number, and email. This data is exclusively used for order fulfillment, parcel tracking, and warranty validation.
            </p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Payment Data Security</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              mobilehubbd never stores your credit card, debit card, or mobile banking PINs on our servers. All digital payments are processed through secure, bank-grade encrypted gateways (bKash and SSLCommerz).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
