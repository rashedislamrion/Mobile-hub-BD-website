"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RefreshCw, Home, Smartphone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet, getImageUrl } from "@/lib/api-client";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const [shopName, setShopName] = useState(
    process.env.NEXT_PUBLIC_STORE_NAME || process.env.NEXT_PUBLIC_SITE_NAME || "MobileHubBD"
  );
  const [logoUrl, setLogoUrl] = useState("/images/logo-full.jpeg");

  useEffect(() => {
    // Log the error to console or error monitoring service
    console.error("[Storefront Runtime Error]:", error);

    apiGet<any>("/business-settings")
      .then((settings) => {
        if (settings) {
          const name = settings.branding?.shopName || settings.general?.companyName || settings.companyName;
          if (name) setShopName(name);
          const logo = settings.branding?.logo || settings.logo;
          if (logo) setLogoUrl(getImageUrl(logo));
        }
      })
      .catch(() => {});
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="w-full bg-white border-b py-4 px-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center">
          <Image
            src={logoUrl}
            alt={shopName}
            width={200}
            height={40}
            className="w-auto h-8 sm:h-9 object-contain"
            priority
            unoptimized={logoUrl.startsWith("http") || logoUrl.includes("/uploads/")}
          />
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
            <Home className="w-4 h-4" />
            Home
          </Button>
        </Link>
      </header>

      {/* Main Error Content */}
      <main className="container max-w-xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-6 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
          Something Went Wrong
        </h1>

        <p className="text-base text-slate-600 max-w-md mb-8 leading-relaxed">
          We encountered an unexpected issue while loading this page. Please try again or return to our catalog.
        </p>

        {error?.digest && (
          <div className="mb-6 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500">
            Error ID: {error.digest}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => reset()}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium px-6 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>

          <Button asChild variant="outline" size="lg" className="border-slate-300 hover:bg-slate-100 gap-2 font-medium px-6">
            <Link href="/">
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </Button>

          <Button asChild variant="ghost" size="lg" className="text-slate-600 hover:text-slate-900 gap-2 font-medium px-6">
            <Link href="/phones">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Browse Phones
            </Link>
          </Button>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full border-t py-6 text-center text-xs text-slate-500 bg-white">
        <p>&copy; {new Date().getFullYear()} {shopName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
