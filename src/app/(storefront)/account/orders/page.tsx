"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PackageX, Eye, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface MyOrderItem {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  product?: { name: string };
}

interface MyOrder {
  id: string;
  orderCode: string;
  createdAt: string;
  items: MyOrderItem[];
  totalAmount: number | string;
  status: string;
  paymentStatus: string;
}

const TABS = ["Pending", "Confirmed", "Parcel Booked", "Delivered", "Returned", "Cancelled", "All"];

const STATUS_MAP: Record<string, string> = {
  Pending: "PENDING",
  Confirmed: "CONFIRMED",
  "Parcel Booked": "PARCEL_BOOKED",
  Delivered: "DELIVERED",
  Returned: "RETURNED",
  Cancelled: "CANCELLED",
};

export default function CustomerOrdersPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  const loadOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const res = await apiGet<MyOrder[]>("/orders/my");
      setOrders(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load your orders");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, loadOrders]);

  const getFilteredOrders = (tab: string) => {
    if (tab === "All") return orders;
    const mapped = STATUS_MAP[tab];
    return orders.filter((o) => o.status === mapped || o.status === tab);
  };

  const getCount = (tab: string) => getFilteredOrders(tab).length;

  if (isAuthLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Please Sign In</h2>
        <p className="text-slate-500 text-sm max-w-md">
          You need to be logged into your account to view your past orders and track current shipments.
        </p>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/login">Sign In / Register</Link>
        </Button>
      </div>
    );
  }

  const renderOrderTable = (tab: string) => {
    const tabOrders = getFilteredOrders(tab);

    if (isLoading) {
      return (
        <div className="p-8 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      );
    }

    if (tabOrders.length === 0) {
      return (
        <EmptyState 
          icon={PackageX} 
          title="No Order Found" 
          subtitle={`There are no orders with the status "${tab}".`}
          action={<Button asChild variant="outline"><Link href="/">Continue Shopping</Link></Button>}
        />
      );
    }

    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-700">
              <th className="py-4 px-6">Order ID</th>
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6">Items</th>
              <th className="py-4 px-6">Total</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Payment</th>
            </tr>
          </thead>
          <tbody>
            {tabOrders.map((order) => {
              const count = order.items?.reduce((acc, i) => acc + i.quantity, 0) || order.items?.length || 0;
              const dateStr = new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-emerald-600 font-mono">{order.orderCode}</td>
                  <td className="py-4 px-6 text-sm text-slate-600">{dateStr}</td>
                  <td className="py-4 px-6 text-sm text-slate-600">{count} item{count !== 1 ? "s" : ""}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">৳{Number(order.totalAmount).toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <Badge variant="outline" className={`
                      ${order.status === "PENDING" ? "text-amber-600 border-amber-200 bg-amber-50" : ""}
                      ${order.status === "CONFIRMED" || order.status === "PARCEL_BOOKED" ? "text-blue-600 border-blue-200 bg-blue-50" : ""}
                      ${order.status === "DELIVERED" || order.status === "COMPLETED" ? "text-emerald-600 border-emerald-200 bg-emerald-50" : ""}
                      ${order.status === "CANCELLED" || order.status === "RETURNED" ? "text-red-600 border-red-200 bg-red-50" : ""}
                    `}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right text-xs font-semibold text-slate-700">
                    {order.paymentStatus}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order History</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <TabsList className="bg-transparent p-0 h-auto gap-2">
            {TABS.map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab}
                className="rounded-full border border-slate-200 px-4 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900 text-slate-600"
              >
                {tab} ({getCount(tab)})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-6">
          {TABS.map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0 outline-none">
              {renderOrderTable(tab)}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
