"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Smartphone, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet, getImageUrl } from "@/lib/api-client";

export default function NotFound() {
  const [shopName, setShopName] = useState(
    process.env.NEXT_PUBLIC_STORE_NAME || process.env.NEXT_PUBLIC_SITE_NAME || "MobileHubBD"
  );
  const [logoUrl, setLogoUrl] = useState("/images/logo-full.jpeg");

  useEffect(() => {
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
  }, []);

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

      {/* Main 404 Content */}
      <main className="container max-w-2xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-6 border border-emerald-200">
          Error 404
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Page Not Found
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-lg mb-8 leading-relaxed">
          The page or product you are looking for doesn&apos;t exist, has been moved, or is temporarily unavailable.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium px-6 shadow-sm">
            <Link href="/">
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="border-slate-300 hover:bg-slate-100 gap-2 font-medium px-6">
            <Link href="/phones">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Browse Phones
            </Link>
          </Button>

          <Button asChild variant="ghost" size="lg" className="text-slate-600 hover:text-slate-900 gap-2 font-medium px-6">
            <Link href="/category/all">
              <ShoppingBag className="w-4 h-4" />
              All Products
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
