"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  CheckCircle2, Package, MapPin, CreditCard, Clock, 
  ArrowRight, ShoppingBag, PhoneCall, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet, getImageUrl } from "@/lib/api-client";
import { useCart } from "@/context/CartContext";

export default function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    (async () => {
      try {
        const data = await apiGet<any>(`/orders/${params.orderId}`);
        setOrder(data);
      } catch (e) {
        console.error("Failed to load order details", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.orderId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Verifying Your Order...</h2>
        <p className="text-sm text-slate-500 mt-1">Please wait while we confirm your receipt.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-white border rounded-3xl p-6 sm:p-10 shadow-sm text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase px-3 py-1">
            Order Placed Successfully
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Thank You for Your Order!
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Your order has been received and is now being processed. We have sent confirmation details to your contact number.
          </p>
        </div>

        {/* Order Details Card */}
        {order ? (
          <div className="bg-slate-50 border rounded-2xl p-6 text-left space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Order Number</p>
                <p className="text-base font-extrabold text-slate-900">{order.orderCode}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase text-right">Payment Status</p>
                <Badge className={order.paymentStatus === 'PAID' ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}>
                  {order.paymentStatus} ({order.paymentMethod})
                </Badge>
              </div>
            </div>

            {/* Item list */}
            <div className="space-y-3 divide-y">
              {order.items?.map((item: any) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center p-1 flex-shrink-0">
                      <ShoppingBag className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 line-clamp-1">{item.productNameSnapshot || item.product?.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">৳{Number(item.lineTotal).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳{Number(order.subtotal).toLocaleString()}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-৳{Number(order.discountAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>৳{Number(order.deliveryCharge).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t pt-2">
                <span>Total Amount</span>
                <span className="text-emerald-600 font-extrabold text-base">৳{Number(order.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border rounded-2xl p-6 text-sm text-slate-600">
            Order Reference: <strong className="text-slate-900">{params.orderId}</strong>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button variant="outline" asChild className="h-12 border-slate-300 font-semibold">
            <Link href="/account/orders">View Order History</Link>
          </Button>
          <Button asChild className="h-12 bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
            <Link href="/category/all" className="flex items-center justify-center gap-2">
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
