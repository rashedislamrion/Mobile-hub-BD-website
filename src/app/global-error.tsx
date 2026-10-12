"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RefreshCw, Home, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet, getImageUrl } from "@/lib/api-client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [shopName, setShopName] = useState(
    process.env.NEXT_PUBLIC_STORE_NAME || process.env.NEXT_PUBLIC_SITE_NAME || "MobileHubBD"
  );
  const [logoUrl, setLogoUrl] = useState("/images/logo-full.jpeg");

  useEffect(() => {
    console.error("[Storefront Critical Global Error]:", error);

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
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between antialiased">
        {/* Top Header Bar */}
        <header className="w-full bg-white border-b py-4 px-6 flex items-center justify-between">
          <a href="/" className="inline-flex items-center">
            <Image
              src={logoUrl}
              alt={shopName}
              width={200}
              height={40}
              className="w-auto h-8 sm:h-9 object-contain"
              priority
              unoptimized={logoUrl.startsWith("http") || logoUrl.includes("/uploads/")}
            />
          </a>
          <a href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </a>
        </header>

        {/* Critical Error Box */}
        <main className="container max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-6 shadow-sm">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Application Error
          </h1>

          <p className="text-base text-slate-600 max-w-md mb-8 leading-relaxed">
            A critical system error occurred. Please try refreshing the page or navigating back to the homepage.
          </p>

          {error?.digest && (
            <div className="mb-6 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500">
              Digest: {error.digest}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => reset()}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium px-6 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </Button>

            <Button asChild variant="outline" size="lg" className="border-slate-300 hover:bg-slate-100 gap-2 font-medium px-6">
              <a href="/">
                <Home className="w-4 h-4" />
                Return to Home
              </a>
            </Button>
          </div>
        </main>

        <footer className="w-full border-t py-6 text-center text-xs text-slate-500 bg-white">
          <p>&copy; {new Date().getFullYear()} {shopName}. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
