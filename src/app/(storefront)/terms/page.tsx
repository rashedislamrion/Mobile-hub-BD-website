"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function TermsPage() {
  const [pageData, setPageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<any>("/pages/terms-and-conditions");
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
        {pageData?.title || "Terms & Conditions"}
      </h1>
      <div className="prose prose-slate max-w-none bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        {pageData?.content ? (
          <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
        ) : (
          <>
            <p className="text-slate-600 leading-relaxed mb-6">
              Welcome to mobilehubbd. By accessing and using our website, you agree to comply with and be bound by the following terms and conditions of use. Please review these terms carefully. If you do not agree to these terms, you should not use this site.
            </p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Acceptance of Agreement</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              You agree to the terms and conditions outlined in this Terms of Use Agreement with respect to our site. This Agreement constitutes the entire and only agreement between us and you, and supersedes all prior or contemporaneous agreements.
            </p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Genuine Parts & Warranty</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              All replacement parts, smartphone displays, and batteries sold through mobilehubbd are tested for performance and guaranteed authentic. Return and warranty claims must be reported within the specified return window.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
