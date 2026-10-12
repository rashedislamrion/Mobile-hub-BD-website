"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RefreshCw, ShoppingCart, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason") || "Payment could not be completed";

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className="bg-white border rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900">Payment Failed or Cancelled</h1>
          <p className="text-slate-500 text-sm">
            {reason === "cancel" || reason === "Cancelled"
              ? "You cancelled the payment transaction. No amount was deducted."
              : `The payment attempt was unsuccessful (${reason}).`}
          </p>
          {orderId && (
            <p className="text-xs text-slate-400">Order ID: {orderId}</p>
          )}
        </div>

        <div className="bg-slate-50 border rounded-xl p-4 text-xs text-slate-600 text-left space-y-2">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-500" /> What can you do next?
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-500">
            <li>Retry using a different payment method (bKash, Cards, or Cash on Delivery).</li>
            <li>Check your internet banking balance or mobile wallet PIN.</li>
            <li>Contact our customer support team if you were charged.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
            <Link href="/checkout" className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full border-slate-300">
            <Link href="/cart" className="flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" /> View Cart
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center text-slate-500">Loading...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
