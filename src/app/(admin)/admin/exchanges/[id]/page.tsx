"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { StatusTimeline } from "@/components/admin/StatusTimeline";
import { StatusBadge } from "@/components/admin/DataTable";
import { StatusVariant } from "@/types/table";
import { toast } from "sonner";
import { Check, X, PackageCheck, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { apiGet, apiPatch, getImageUrl } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface ExchangeDetail {
  id: string;
  exchangeCode: string;
  orderId: string;
  createdAt: string;
  priceDifference: number | string;
  status: string;
  order?: {
    id: string;
    orderCode: string;
    customer?: { id: string; name: string; phone: string };
    branch?: { id: string; name: string };
  };
  oldOrderItem?: {
    id: string;
    productNameSnapshot: string;
    unitPrice: number | string;
    quantity: number;
    product?: { name: string; images?: Array<{ url: string }> };
  };
  newProduct?: {
    id: string;
    name: string;
    regularPrice: number | string;
    images?: Array<{ url: string }>;
  };
  newVariant?: {
    id: string;
    color?: string;
    quality?: string;
    price: number | string;
  };
}

export default function ExchangeDetailsPage({ params }: { params: { id: string } }) {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const exchangeId = params.id;

  const [exchange, setExchange] = useState<ExchangeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet<ExchangeDetail>(`/exchanges/${exchangeId}`);
      setExchange(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load exchange details");
    } finally {
      setIsLoading(false);
    }
  }, [exchangeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (exchange) {
      setTitle(`Exchange ${exchange.exchangeCode}`);
      setBadge("Website");
      setDateFilter("");
    }
  }, [exchange, setTitle, setBadge, setDateFilter]);

  const handleAction = async (action: "approve" | "item-received" | "complete" | "reject") => {
    try {
      await apiPatch(`/exchanges/${exchangeId}/${action}`);
      toast.success(`Exchange action "${action}" completed successfully`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || `Failed to perform ${action}`);
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

  if (!exchange) {
    return <div className="p-6 text-slate-500">Exchange request not found.</div>;
  }

  const getStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "COMPLETED":
      case "Completed": return "success";
      case "ITEM_RECEIVED":
      case "Item Received": return "info";
      case "APPROVED":
      case "Approved": return "notice";
      case "REQUESTED":
      case "Requested": return "warning";
      case "REJECTED":
      case "Rejected": return "danger";
      default: return "info";
    }
  };

  const timelineSteps = [
    { label: "Requested", timestamp: exchange.createdAt, isCompleted: true, isCurrent: false },
    {
      label: "Approved",
      timestamp: undefined,
      isCompleted: ["APPROVED", "ITEM_RECEIVED", "COMPLETED"].includes(exchange.status),
      isCurrent: exchange.status === "APPROVED",
    },
    {
      label: "Old Item Received",
      timestamp: undefined,
      isCompleted: ["ITEM_RECEIVED", "COMPLETED"].includes(exchange.status),
      isCurrent: exchange.status === "ITEM_RECEIVED",
    },
    {
      label: "Completed",
      timestamp: undefined,
      isCompleted: exchange.status === "COMPLETED",
      isCurrent: exchange.status === "COMPLETED",
    },
  ];

  if (exchange.status === "REJECTED") {
    timelineSteps[1] = { label: "Rejected", timestamp: undefined, isCompleted: true, isCurrent: true };
    timelineSteps.splice(2, 2);
  }

  const oldImg = exchange.oldOrderItem?.product?.images?.[0]?.url
    ? getImageUrl(exchange.oldOrderItem.product.images[0].url)
    : "/images/placeholder.png";

  const newImg = exchange.newProduct?.images?.[0]?.url
    ? getImageUrl(exchange.newProduct.images[0].url)
    : "/images/placeholder.png";

  const oldPrice = Number(exchange.oldOrderItem?.unitPrice || 0);
  const newPrice = Number(exchange.newVariant?.price || exchange.newProduct?.regularPrice || 0);
  const diff = Number(exchange.priceDifference || 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* LEFT COLUMN - Exchange Comparison */}
      <div className="w-full lg:w-2/3 space-y-6">
        
        {/* Item Comparison */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">Exchange Details</h3>
              <p className="text-sm text-slate-500">Comparing Old vs New item</p>
            </div>
            <StatusBadge status={exchange.status} type={getStatusVariant(exchange.status)} />
          </div>

          <div className="p-6 flex flex-col md:flex-row items-center gap-6">
            {/* Old Item */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm w-full">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 mb-4 overflow-hidden relative border border-slate-200">
                <Image src={oldImg} alt="Old Item" fill className="object-cover" />
              </div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Old Item</h4>
              <p className="font-semibold text-slate-800 text-lg">
                {exchange.oldOrderItem?.productNameSnapshot || exchange.oldOrderItem?.product?.name || "Old Product"}
              </p>
              <p className="text-slate-500 mt-2 line-through decoration-red-400">৳{oldPrice.toLocaleString()}</p>
            </div>

            {/* Exchange Icon */}
            <div className="hidden md:flex w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center shrink-0">
              <ArrowRightLeft className="w-6 h-6" />
            </div>

            {/* New Item */}
            <div className="flex-1 bg-emerald-50/30 border border-emerald-100 rounded-xl p-5 text-center shadow-sm w-full">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white mb-4 overflow-hidden relative border border-emerald-200">
                <Image src={newImg} alt="New Item" fill className="object-cover" />
              </div>
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">New Item</h4>
              <p className="font-semibold text-slate-800 text-lg">{exchange.newProduct?.name || "New Product"}</p>
              <p className="text-emerald-700 font-bold mt-2">৳{newPrice.toLocaleString()}</p>
            </div>
          </div>

          {/* Price Difference Summary */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center">
            <span className="text-slate-600 font-medium">Price Difference Summary</span>
            <div className="text-right">
              {diff > 0 ? (
                <>
                  <p className="text-sm text-slate-500">Customer pays</p>
                  <p className="text-xl font-bold text-red-500">+৳{diff.toLocaleString()}</p>
                </>
              ) : diff < 0 ? (
                <>
                  <p className="text-sm text-slate-500">Refund to customer</p>
                  <p className="text-xl font-bold text-emerald-600">-৳{Math.abs(diff).toLocaleString()}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500">No difference</p>
                  <p className="text-xl font-bold text-slate-800">৳0</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {exchange.status === "REQUESTED" && (
            <button 
              onClick={() => handleAction("approve")} 
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <Check className="w-4 h-4" /> Approve Exchange
            </button>
          )}
          {exchange.status === "APPROVED" && (
            <button 
              onClick={() => handleAction("item-received")} 
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <PackageCheck className="w-4 h-4" /> Mark Old Item Received
            </button>
          )}
          {exchange.status === "ITEM_RECEIVED" && (
            <button 
              onClick={() => handleAction("complete")} 
              className="flex items-center gap-2 px-5 py-2.5 border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-lg transition-colors text-sm"
            >
              <Check className="w-4 h-4" /> Mark Completed
            </button>
          )}
          {exchange.status !== "COMPLETED" && exchange.status !== "REJECTED" && (
            <button 
              onClick={() => handleAction("reject")} 
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors text-sm"
            >
              <X className="w-4 h-4" /> Reject
            </button>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN - Meta & Timeline */}
      <div className="w-full lg:w-1/3 space-y-6">
        
        {/* Customer & Order Reference */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Customer & Order</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Customer</span>
              <span className="font-medium text-slate-800">{exchange.order?.customer?.name || "Customer"}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Order ID</span>
              <Link href={`/admin/orders/${exchange.orderId}`} className="font-medium text-emerald-600 hover:underline font-mono">
                {exchange.order?.orderCode || exchange.orderId}
              </Link>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-slate-500">Branch</span>
              <span className="font-medium text-slate-800">{exchange.order?.branch?.name || "Global"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Date Requested</span>
              <span className="font-medium text-slate-800">
                {new Date(exchange.createdAt).toLocaleDateString("en-GB")}
              </span>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-5">
          <h3 className="font-semibold text-slate-800 mb-6">Exchange Status</h3>
          <StatusTimeline steps={timelineSteps} />
        </div>

      </div>
    </div>
  );
}
