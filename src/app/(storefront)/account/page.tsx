"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  CreditCard, 
  Heart, 
  XCircle, 
  CheckCircle2, 
  MapPin,
  Plus,
  ShoppingCart,
  EyeOff,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiGet, getImageUrl } from "@/lib/api-client";

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const { items, itemCount, subtotal } = useCart();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [prof, ords] = await Promise.all([
          apiGet<any>("/customers/me/profile").catch(() => null),
          apiGet<any[]>("/orders/my").catch(() => []),
        ]);
        setProfile(prof);
        setOrders(ords || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const completedOrders = orders.filter((o) => o.status === "COMPLETED" || o.status === "DELIVERED").length;
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;
  const pendingOrders = orders.filter((o) => o.paymentStatus === "PENDING" || o.paymentStatus === "DUE").length;

  const defaultAddress = profile?.addresses?.find((a: any) => a.isDefault) || profile?.addresses?.[0];

  const statCards = [
    { label: "Total Orders", value: orders.length.toString(), icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pending Dues", value: pendingOrders.toString(), icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Cart Items", value: itemCount.toString(), icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Cancelled", value: cancelledOrders.toString(), icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
    { label: "Delivered", value: completedOrders.toString(), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Dashboard</h1>
        <p className="text-slate-500 text-sm">Welcome back, {user?.name || "Valued Customer"}!</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <span className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</span>
            <span className="text-sm font-medium text-slate-500">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Default Shipping Address */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Default Shipping Address</h2>
          </div>
          
          {defaultAddress ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[180px] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">{defaultAddress.fullName}</h3>
                </div>
                <div className="text-slate-600 text-sm space-y-0.5 ml-7">
                  <p>{defaultAddress.fullAddress}</p>
                  <p className="font-medium text-xs text-slate-500 pt-1">Phone: {defaultAddress.phone}</p>
                </div>
              </div>
              <Button asChild variant="link" className="text-emerald-600 p-0 h-auto self-start ml-7 mt-2">
                <Link href="/account/address">Manage Addresses</Link>
              </Button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[180px]">
              <MapPin className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-600 text-sm font-medium mb-3">No saved address yet</p>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/account/address">
                  <Plus className="w-4 h-4 mr-1.5" /> Add New Address
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* My Cart Summary */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">My Cart</h2>
          </div>
          {items.length > 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[180px] flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in cart
                </p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                </p>
                <p className="text-base font-extrabold text-emerald-600 mt-2">
                  Subtotal: ৳{subtotal.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button asChild size="sm" variant="outline">
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link href="/checkout" className="flex items-center gap-1">
                    Checkout <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[180px]">
              <ShoppingCart className="w-10 h-10 text-slate-200 mb-2" />
              <p className="text-slate-500 text-sm font-medium mb-1">Your cart is empty.</p>
              <Link href="/category/all" className="text-xs font-semibold text-emerald-600 hover:underline">
                Start Shopping
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Quick Links */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/account/orders" className="p-4 bg-white border rounded-xl hover:border-emerald-500 transition-colors">
            <h3 className="font-bold text-sm text-slate-800">Track Orders</h3>
            <p className="text-xs text-slate-500 mt-1">Check real-time status of your orders</p>
          </Link>
          <Link href="/account/support" className="p-4 bg-white border rounded-xl hover:border-emerald-500 transition-colors">
            <h3 className="font-bold text-sm text-slate-800">Support Tickets</h3>
            <p className="text-xs text-slate-500 mt-1">Get help with parts, warranty, or returns</p>
          </Link>
          <Link href="/account/profile" className="p-4 bg-white border rounded-xl hover:border-emerald-500 transition-colors">
            <h3 className="font-bold text-sm text-slate-800">Profile Settings</h3>
            <p className="text-xs text-slate-500 mt-1">Update phone, email, and password</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
