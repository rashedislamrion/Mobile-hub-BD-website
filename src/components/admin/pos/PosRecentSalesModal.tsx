"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, CreditCard, RefreshCw, Eye } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { AddOrderPaymentModal } from "@/components/admin/orders/AddOrderPaymentModal";
import Link from "next/link";

interface PosRecentSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
}

export function PosRecentSalesModal({
  isOpen,
  onClose,
  branchId,
}: PosRecentSalesModalProps) {
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any | null>(null);

  const fetchRecentSales = useCallback(async () => {
    try {
      setIsLoading(true);
      const query = branchId && branchId !== "all" ? `?branchId=${branchId}&limit=20` : "?limit=20";
      const res = await apiGet<any>(`/orders${query}`);
      const list = Array.isArray(res) ? res : res?.data || [];
      setSales(list);
    } catch (err) {
      console.error("Failed to fetch recent sales:", err);
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (isOpen) {
      fetchRecentSales();
    }
  }, [isOpen, fetchRecentSales]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl rounded-2xl p-6 max-h-[85vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Recent Sales & Due Collection
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  View recent orders, track unpaid dues, and record collections
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchRecentSales}
              disabled={isLoading}
              className="gap-1.5 text-xs mr-6"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2">
            {sales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                {isLoading ? "Loading recent sales..." : "No recent sales found for this outlet."}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Order #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-right">Due</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {sales.map((order) => {
                      const total = Number(order.totalAmount || 0);
                      const paid = Number(order.paidAmount || 0);
                      const due = Number(order.dueAmount || Math.max(0, total - paid));
                      const isDue = due > 0 || order.paymentStatus === "DUE";

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-slate-900 block">
                              #{order.orderCode}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800 block">
                              {order.customer?.name || "Walk-in Customer"}
                            </span>
                            {order.customer?.phone && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {order.customer.phone}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                            ৳{total.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                            ৳{paid.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {due > 0 ? (
                              <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                ৳{due.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-400">৳0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold uppercase ${
                                order.paymentStatus === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isDue
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {order.paymentStatus || (due > 0 ? "DUE" : "PAID")}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            {isDue && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setSelectedOrderForPayment(order)}
                                className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-xs"
                              >
                                <CreditCard className="w-3 h-3" />
                                Collect Due
                              </Button>
                            )}
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900"
                            >
                              <Link href={`/admin/orders/${order.id}`} target="_blank">
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Collect Due Payment Modal */}
      {selectedOrderForPayment && (
        <AddOrderPaymentModal
          isOpen={Boolean(selectedOrderForPayment)}
          onClose={() => setSelectedOrderForPayment(null)}
          order={selectedOrderForPayment}
          onSuccess={() => {
            fetchRecentSales();
          }}
        />
      )}
    </>
  );
}
