"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { StatusBadge } from "@/components/admin/DataTable";
import { StatusTimeline } from "@/components/admin/StatusTimeline";
import { StatusVariant } from "@/types/table";
import { toast } from "sonner";
import { Phone, Mail, User, MapPin, CreditCard, Printer, Check, X, Tag, Loader2 } from "lucide-react";
import Image from "next/image";
import { apiGet, apiPatch, apiPost, getImageUrl } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderDetail {
  id: string;
  orderCode: string;
  createdAt: string;
  saleType: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  subtotal: number | string;
  discountAmount: number | string;
  deliveryCharge: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  dueAmount: number | string;
  branch?: { id: string; name: string };
  customer?: { id: string; name: string; phone: string; email: string };
  shippingAddress?: {
    id: string;
    street: string;
    city: string;
    type?: string;
  };
  items: Array<{
    id: string;
    productNameSnapshot: string;
    quantity: number;
    unitPrice: number | string;
    lineTotal: number | string;
    product?: { id: string; name: string; images?: Array<{ url: string }> };
    variant?: { color?: string; quality?: string };
  }>;
  statusHistory: Array<{
    id: string;
    status: string;
    note?: string;
    createdAt: string;
    changedBy?: { name: string };
  }>;
  notes: Array<{
    id: string;
    note: string;
    createdAt: string;
    staff?: { name: string; photo?: string };
  }>;
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const orderId = params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Array<{ id: string; staffName: string; timestamp: string; note: string }>>([]);
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet<OrderDetail>(`/orders/${orderId}`);
      setOrder(res);
      if (res.notes) {
        setNotes(
          res.notes.map((n) => ({
            id: n.id,
            staffName: n.staff?.name || "Staff",
            timestamp: n.createdAt,
            note: n.note,
          })),
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (order) {
      setTitle(`Order ${order.orderCode}`);
      setBadge(order.saleType || "Website");
      setDateFilter("");
    }
  }, [order, setTitle, setBadge, setDateFilter]);

  const getOrderStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "DELIVERED":
      case "COMPLETED":
      case "Delivered":
      case "Completed": return "success";
      case "CONFIRMED":
      case "PARCEL_BOOKED":
      case "Confirmed":
      case "Parcel Booked": return "info";
      case "PENDING":
      case "Pending": return "warning";
      case "RETURNED":
      case "Returned": return "notice";
      case "CANCELLED":
      case "Cancelled": return "danger";
      default: return "info";
    }
  };

  const getPaymentStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "PAID":
      case "Paid": return "success";
      case "DUE":
      case "Due": return "danger";
      case "PENDING":
      case "Pending": return "warning";
      default: return "info";
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      setIsSubmittingNote(true);
      const createdNote = await apiPost<any>(`/orders/${orderId}/notes`, { note: newNote.trim() });
      const added = {
        id: createdNote.id || Date.now().toString(),
        staffName: createdNote.staff?.name || "Current User",
        timestamp: createdNote.createdAt || new Date().toISOString(),
        note: createdNote.note || newNote.trim(),
      };
      setNotes([added, ...notes]);
      setNewNote("");
      toast.success("Note added successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleStatusChange = async (targetStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      await apiPatch(`/orders/${orderId}/status`, { status: targetStatus });
      toast.success(`Status updated to ${targetStatus}`);
      loadOrder();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        <div className="w-full lg:w-2/3 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="w-full lg:w-1/3 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="p-6 text-slate-500">Order not found.</div>;
  }

  const timelineSteps = (order.statusHistory || []).map((sh, idx) => ({
    label: sh.status,
    timestamp: sh.createdAt,
    description: sh.note ? `${sh.note} ${sh.changedBy ? `(by ${sh.changedBy.name})` : ""}` : undefined,
    isCompleted: true,
    isCurrent: idx === 0,
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* LEFT COLUMN */}
      <div className="w-full lg:w-2/3 space-y-6">
        
        {/* Order Items */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Order Items</h3>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
              {order.orderCode}
            </span>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium text-center">Qty</th>
                  <th className="px-5 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item) => {
                  const imgUrl = item.product?.images?.[0]?.url
                    ? getImageUrl(item.product.images[0].url)
                    : "/images/placeholder.png";
                  const variantText = [item.variant?.color, item.variant?.quality].filter(Boolean).join(" - ");

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden relative shrink-0">
                            <Image src={imgUrl} alt={item.productNameSnapshot} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{item.productNameSnapshot}</p>
                            {variantText && <p className="text-xs text-slate-500">{variantText}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="px-5 py-3 text-right text-slate-600">৳{Number(item.unitPrice).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-800">৳{Number(item.lineTotal).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-5 bg-slate-50/50 border-t border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>৳{Number(order.subtotal).toLocaleString()}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>- ৳{Number(order.discountAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charge</span>
              <span>৳{Number(order.deliveryCharge).toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-base text-slate-800">
              <span>Grand Total</span>
              <span>৳{Number(order.totalAmount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Order Timeline</h3>
            <StatusBadge status={order.status} type={getOrderStatusVariant(order.status)} />
          </div>
          <div className="p-6">
            {timelineSteps.length > 0 ? (
              <StatusTimeline steps={timelineSteps} />
            ) : (
              <p className="text-slate-400 text-sm italic">No status history yet.</p>
            )}
          </div>
        </div>

        {/* Staff Notes */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Staff Notes</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <textarea 
                className="w-full min-h-[80px] rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                placeholder="Type an internal note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleAddNote}
                  disabled={isSubmittingNote || !newNote.trim()}
                  className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSubmittingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Note
                </button>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-slate-700">{note.staffName}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(note.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{note.note}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-slate-400 italic">No notes added yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full lg:w-1/3 space-y-6">
        
        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Customer Info
          </h3>
          <div className="space-y-3 text-sm">
            <p className="font-medium text-slate-800 text-base">{order.customer?.name || "Walk-in Customer"}</p>
            {order.customer?.phone && (
              <div className="flex flex-col gap-1.5">
                <a href={`tel:${order.customer.phone}`} className="flex items-center gap-2 text-emerald-600 hover:underline">
                  <Phone className="w-4 h-4" /> {order.customer.phone}
                </a>
                {order.customer.email && (
                  <a href={`mailto:${order.customer.email}`} className="flex items-center gap-2 text-emerald-600 hover:underline">
                    <Mail className="w-4 h-4" /> {order.customer.email}
                  </a>
                )}
              </div>
            )}
            <div className="pt-2">
              <span className="text-xs text-slate-400">Branch: {order.branch?.name || "Global"}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-5">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Shipping Address
            </h3>
            {order.shippingAddress?.type && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                {order.shippingAddress.type}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {order.shippingAddress
              ? `${order.shippingAddress.street || ""}, ${order.shippingAddress.city || ""}`
              : "Standard Delivery / In-Store Pickup"}
          </p>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            Payment Info
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Method</span>
              <span className="font-medium text-slate-800">{order.paymentMethod || "COD / Cash"}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={order.paymentStatus} type={getPaymentStatusVariant(order.paymentStatus)} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Paid Amount</span>
              <span className="font-medium text-slate-800">৳{Number(order.paidAmount).toLocaleString()}</span>
            </div>
            {Number(order.dueAmount) > 0 && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Due Amount</span>
                <span className="font-bold text-red-500">৳{Number(order.dueAmount).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Order Actions</h3>
          <div className="flex flex-col gap-2">
            {order.status === "PENDING" && (
              <button 
                onClick={() => handleStatusChange("CONFIRMED")}
                disabled={isUpdatingStatus}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors text-sm"
              >
                <Check className="w-4 h-4" /> Mark as Confirmed
              </button>
            )}
            {order.status === "PENDING" && (
              <button 
                onClick={() => handleStatusChange("DIAGNOSING")}
                disabled={isUpdatingStatus}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors text-sm"
              >
                <Tag className="w-4 h-4" /> Mark as Diagnosing
              </button>
            )}
            {(order.status === "CONFIRMED" || order.status === "PARCEL_BOOKED") && (
              <button 
                onClick={() => handleStatusChange("DELIVERED")}
                disabled={isUpdatingStatus}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                <Check className="w-4 h-4" /> Mark as Delivered
              </button>
            )}
            {(order.status === "DELIVERED" || order.status === "CONFIRMED") && (
              <button 
                onClick={() => handleStatusChange("COMPLETED")}
                disabled={isUpdatingStatus}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                <Check className="w-4 h-4" /> Mark as Completed
              </button>
            )}
            <button 
              onClick={() => window.print()}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm mt-2"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            {order.status !== "CANCELLED" && order.status !== "DELIVERED" && order.status !== "COMPLETED" && (
              <button 
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={isUpdatingStatus}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors text-sm mt-2"
              >
                <X className="w-4 h-4" /> Cancel Order
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
