"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { StatusTimeline } from "@/components/admin/StatusTimeline";
import { StatusBadge } from "@/components/admin/DataTable";
import { StatusVariant } from "@/types/table";
import { toast } from "sonner";
import { Check, X, RefreshCcw, Package, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { apiGet, apiPatch, getImageUrl } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesReturnDetail {
  id: string;
  returnCode: string;
  orderId: string;
  createdAt: string;
  branchId: string;
  reason: string;
  refundAmount: number | string;
  status: string;
  order?: {
    id: string;
    orderCode: string;
    customer?: { id: string; name: string; phone: string };
    branch?: { id: string; name: string };
  };
  items: Array<{
    id: string;
    quantity: number;
    orderItem?: {
      productNameSnapshot?: string;
      unitPrice?: number | string;
      product?: {
        name: string;
        images?: Array<{ url: string }>;
      };
      variant?: { color?: string; quality?: string };
    };
  }>;
}

export default function SalesReturnDetailsPage({ params }: { params: { id: string } }) {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const returnId = params.id;

  const [returnObj, setReturnObj] = useState<SalesReturnDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet<SalesReturnDetail>(`/sales-returns/${returnId}`);
      setReturnObj(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load sales return details");
    } finally {
      setIsLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (returnObj) {
      setTitle(`Return ${returnObj.returnCode}`);
      setBadge("Website");
      setDateFilter("");
    }
  }, [returnObj, setTitle, setBadge, setDateFilter]);

  const handleApprove = async () => {
    try {
      await apiPatch(`/sales-returns/${returnId}/approve`);
      toast.success("Return approved & stock restored");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve return");
    }
  };

  const handleRefund = async () => {
    try {
      await apiPatch(`/sales-returns/${returnId}/refund`);
      toast.success("Return marked as refunded");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as refunded");
    }
  };

  const handleReject = async () => {
    try {
      await apiPatch(`/sales-returns/${returnId}/reject`, { reason: "Rejected by admin" });
      toast.success("Return rejected");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject return");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        <div className="w-full lg:w-2/3 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="w-full lg:w-1/3 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!returnObj) {
    return <div className="p-6 text-slate-500">Return request not found.</div>;
  }

  const getStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "REFUNDED":
      case "Refunded": return "success";
      case "APPROVED":
      case "Approved": return "info";
      case "REQUESTED":
      case "Requested": return "warning";
      case "REJECTED":
      case "Rejected": return "danger";
      default: return "info";
    }
  };

  const timelineSteps = [
    { label: "Return Requested", timestamp: returnObj.createdAt, isCompleted: true, isCurrent: false },
    {
      label: "Approved",
      timestamp: undefined,
      isCompleted: ["APPROVED", "REFUNDED"].includes(returnObj.status),
      isCurrent: returnObj.status === "APPROVED",
    },
    {
      label: "Refunded",
      timestamp: undefined,
      isCompleted: returnObj.status === "REFUNDED",
      isCurrent: returnObj.status === "REFUNDED",
    },
  ];

  if (returnObj.status === "REJECTED") {
    timelineSteps[1] = { label: "Rejected", timestamp: undefined, isCompleted: true, isCurrent: true };
    timelineSteps.pop();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* LEFT COLUMN - Return Details */}
      <div className="w-full lg:w-2/3 space-y-6">
        
        {/* Returned Item Info */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6">
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-800 text-lg mb-1">Return Details</h3>
              <p className="text-slate-500 text-sm">
                Customer: {returnObj.order?.customer?.name || "Customer"} ({returnObj.order?.customer?.phone || "N/A"})
              </p>
            </div>
            <StatusBadge status={returnObj.status} type={getStatusVariant(returnObj.status)} />
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Item(s)
              </h4>
              <div className="space-y-4">
                {returnObj.items?.map((item) => {
                  const img = item.orderItem?.product?.images?.[0]?.url
                    ? getImageUrl(item.orderItem.product.images[0].url)
                    : "/images/placeholder.png";

                  return (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden relative bg-slate-100 shrink-0 border border-slate-200">
                        <Image src={img} alt="Return Item" fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.orderItem?.productNameSnapshot || item.orderItem?.product?.name || "Product"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-emerald-600 font-medium text-sm mt-4">
                Requested Refund: ৳{Number(returnObj.refundAmount).toLocaleString()}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Reason for Return
              </h4>
              <p className="text-amber-900 text-sm leading-relaxed">{returnObj.reason}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {returnObj.status === "REQUESTED" && (
            <button 
              onClick={handleApprove} 
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <Check className="w-4 h-4" /> Approve Return
            </button>
          )}
          {returnObj.status === "APPROVED" && (
            <button 
              onClick={handleRefund} 
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <RefreshCcw className="w-4 h-4" /> Mark as Refunded
            </button>
          )}
          {returnObj.status === "REQUESTED" && (
            <button 
              onClick={handleReject} 
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors text-sm"
            >
              <X className="w-4 h-4" /> Reject Return
            </button>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN - Meta & Timeline */}
      <div className="w-full lg:w-1/3 space-y-6">
        
        {/* Original Order Reference */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Original Order</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Order ID</span>
              <Link href={`/admin/orders/${returnObj.orderId}`} className="font-medium text-emerald-600 hover:underline font-mono">
                {returnObj.order?.orderCode || returnObj.orderId}
              </Link>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Branch</span>
              <span className="font-medium text-slate-800">{returnObj.order?.branch?.name || "Global"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Date Requested</span>
              <span className="font-medium text-slate-800">
                {new Date(returnObj.createdAt).toLocaleDateString("en-GB")}
              </span>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-5">
          <h3 className="font-semibold text-slate-800 mb-6">Return Status</h3>
          <StatusTimeline steps={timelineSteps} />
        </div>

      </div>
    </div>
  );
}
