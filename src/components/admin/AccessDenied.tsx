"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  moduleName?: string;
}

export function AccessDenied({
  title = "Access Denied",
  message = "You do not have permission to view or manage this module.",
  moduleName,
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
        {title}
      </h2>

      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        {message}
        {moduleName && (
          <span className="block mt-1 font-medium text-slate-700">
            Module: <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-600">{moduleName}</code>
          </span>
        )}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>

        <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/admin">
            <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
