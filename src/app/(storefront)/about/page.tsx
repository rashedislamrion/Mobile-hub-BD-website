"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Award, Users, Wrench } from "lucide-react";

export default function AboutPage() {
  const [pageData, setPageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<any>("/pages/about-us");
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
    <div className="container mx-auto px-4 py-16 max-w-4xl space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
        {pageData?.title || "About mobilehubbd"}
      </h1>

      <div className="prose prose-slate max-w-none bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {pageData?.content ? (
          <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
        ) : (
          <>
            <p className="text-slate-600 leading-relaxed text-base">
              mobilehubbd is Bangladesh's premier e-commerce and retail destination for genuine mobile parts, accessories, and precision diagnosis services. Founded to solve the lack of authentic replacement displays and batteries in the local market, mobilehubbd delivers lab-tested quality directly to technicians and individual smartphone users nationwide.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-6">
              <div className="p-4 bg-slate-50 rounded-xl border flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">100% Original Spares</h4>
                  <p className="text-xs text-slate-500 mt-1">Every part is verified before stocking to prevent counterfeit parts.</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border flex items-start gap-3">
                <Wrench className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Certified Tech Team</h4>
                  <p className="text-xs text-slate-500 mt-1">Expert technicians capable of complex board-level and IC servicing.</p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mt-6">Our Mission</h3>
            <p className="text-slate-600 leading-relaxed">
              To empower smartphone owners and repair centers with seamless access to high-grade spare parts, transparent pricing, and fast nationwide delivery.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
