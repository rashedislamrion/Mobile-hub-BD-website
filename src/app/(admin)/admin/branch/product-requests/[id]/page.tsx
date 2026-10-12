"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  CheckCheck,
  Building2,
  User,
  Calendar,
  Package,
  AlertCircle,
  RotateCw,
  Plus,
  Minus,
  Check,
  Ban,
  Truck,
  FileText,
  ShieldCheck,
  Boxes,
} from "lucide-react";
import { apiGet, apiPatch, getImageUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStaffAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface BranchInfo {
  id: string;
  name: string;
  code?: string;
  city?: string;
  phone?: string;
}

interface ProductRequestItemDetail {
  id: string;
  productId: string;
  productVariantId: string;
  requestedQty: number;
  approvedQty: number;
  fulfillingStock?: number;
  product: {
    id: string;
    name: string;
    code: string;
    images?: Array<{ url: string }>;
    category?: { id: string; name: string };
    brand?: { id: string; name: string };
  };
  productVariant: {
    id: string;
    color?: string | null;
    quality?: string | null;
    sku?: string | null;
  };
}

interface ProductRequestDetail {
  id: string;
  requestNumber: string;
  requestingBranchId: string;
  fulfillingBranchId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestedByUserId: string;
  approvedByUserId?: string | null;
  approvalDate?: string | null;
  note?: string | null;
  decisionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  requestingBranch: BranchInfo;
  fulfillingBranch: BranchInfo;
  requestedByUser?: { id: string; name: string; phone?: string | null; email?: string | null };
  approvedByUser?: { id: string; name: string; phone?: string | null; email?: string | null };
  updatedByUser?: { id: string; name: string };
  items: ProductRequestItemDetail[];
}

export default function ProductRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const requestId = params.id;
  const router = useRouter();
  const { user, isLoading: authLoading } = useStaffAuth();

  const [request, setRequest] = useState<ProductRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Case A: Fulfilling Branch editable approved quantities state
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, number>>({});
  const [decisionNote, setDecisionNote] = useState("");

  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<ProductRequestDetail>(`/product-requests/${requestId}`);
      setRequest(data);

      // Initialize approved quantities state with existing approvedQty or requestedQty
      const initialQtyMap: Record<string, number> = {};
      data.items?.forEach((item) => {
        initialQtyMap[item.id] = item.approvedQty ?? item.requestedQty;
      });
      setApprovedQuantities(initialQtyMap);
      if (data.decisionNote) {
        setDecisionNote(data.decisionNote);
      }
    } catch (err: any) {
      console.error("Failed to load product request:", err);
      toast.error(err.message || "Failed to load product request details");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const userBranchId = user?.branchId || "";
  const roleName = user?.role?.name?.toLowerCase() || "";
  const isBranchRole =
    roleName.includes("branch admin") || roleName.includes("branch manager");

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RotateCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isBranchRole || !userBranchId) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center max-w-xl mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-amber-900 mb-1">Access Restricted</h2>
          <p className="text-sm text-amber-700">
            The Product Requests module is strictly accessible to Branch Admin and Branch
            Manager roles assigned to an active branch.
          </p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-xl mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-rose-900 mb-1">Request Not Found</h2>
          <p className="text-sm text-rose-700 mb-4">
            The requested product transfer was not found or your branch is not authorized to view it.
          </p>
          <Link href="/admin/branch/product-requests">
            <Button variant="outline">Back to Product Requests</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Branch and role context
  const isFulfillingBranch = request.fulfillingBranchId === userBranchId;
  const isRequestingBranch = request.requestingBranchId === userBranchId;

  // Stepper handlers for Case A
  const handleApprovedQtyChange = (itemId: string, maxQty: number, nextVal: number) => {
    const clamped = Math.max(0, Math.min(maxQty, nextVal));
    setApprovedQuantities((prev) => ({ ...prev, [itemId]: clamped }));
  };

  // Case A: Approve
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const itemsPayload = Object.entries(approvedQuantities).map(([itemId, approvedQty]) => ({
        itemId,
        approvedQty,
      }));

      await apiPatch(`/product-requests/${requestId}/approve`, {
        items: itemsPayload,
        decisionNote: decisionNote.trim() || undefined,
      });

      toast.success("Product request approved successfully!");
      setApproveModalOpen(false);
      await loadDetail();
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error(err.message || "Failed to approve product request");
    } finally {
      setActionLoading(false);
    }
  };

  // Case A: Reject
  const handleReject = async () => {
    setActionLoading(true);
    try {
      await apiPatch(`/product-requests/${requestId}/reject`, {
        decisionNote: decisionNote.trim() || undefined,
      });

      toast.success("Product request rejected.");
      setRejectModalOpen(false);
      await loadDetail();
    } catch (err: any) {
      console.error("Rejection error:", err);
      toast.error(err.message || "Failed to reject product request");
    } finally {
      setActionLoading(false);
    }
  };

  // Case B: Complete Transfer
  const handleCompleteTransfer = async () => {
    setActionLoading(true);
    try {
      await apiPatch(`/product-requests/${requestId}/complete`, {});

      toast.success(
        "Stock transfer completed! Inventory has been updated at both branches atomically.",
        { duration: 5000 },
      );
      setCompleteModalOpen(false);
      await loadDetail();
    } catch (err: any) {
      console.error("Transfer completion error:", err);
      toast.error(err.message || "Failed to complete stock transfer");
    } finally {
      setActionLoading(false);
    }
  };

  // Status badges & text
  const totalReqUnits = request.items.reduce((acc, i) => acc + i.requestedQty, 0);
  const totalAppUnits = request.items.reduce(
    (acc, i) =>
      acc + (request.status === "PENDING" ? approvedQuantities[i.id] ?? i.requestedQty : i.approvedQty),
    0,
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/branch/product-requests">
            <Button variant="ghost" size="sm" className="p-2 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">{request.requestNumber}</h1>
              {request.status === "PENDING" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Pending Review
                </span>
              )}
              {request.status === "APPROVED" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Approved / In Transit
                </span>
              )}
              {request.status === "COMPLETED" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  Transfer Completed
                </span>
              )}
              {request.status === "REJECTED" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Rejected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Created on{" "}
              {new Date(request.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDetail}
            className="flex items-center gap-1.5 text-slate-600"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Case B: Ready for Transfer Banner (Sent + Approved) */}
      {isRequestingBranch && request.status === "APPROVED" && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Truck className="w-6 h-6 text-blue-200 animate-pulse" />
              <span>Ready for Physical Stock Transfer</span>
            </div>
            <p className="text-sm text-blue-100 max-w-2xl">
              This request was approved by <strong>{request.fulfillingBranch.name}</strong> for{" "}
              <strong>{totalAppUnits} units</strong>. Confirm receipt only after you have physically
              received and verified the goods.
            </p>
          </div>

          <Button
            onClick={() => setCompleteModalOpen(true)}
            className="bg-white hover:bg-slate-100 text-blue-700 font-bold px-6 py-2.5 shadow-lg flex-shrink-0"
          >
            <CheckCheck className="w-4 h-4 mr-2 text-emerald-600" />
            Complete Transfer
          </Button>
        </div>
      )}

      {/* Case C: Completed Banner */}
      {request.status === "COMPLETED" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 text-base">
              Stock Transfer Successfully Completed
            </h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              Live inventory balances at both branches were updated in a single atomic transaction.
              Fulfilling branch stock was decremented and requesting branch stock was incremented by{" "}
              <strong>{request.items.reduce((a, b) => a + b.approvedQty, 0)} units</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Case D: Rejected Banner */}
      {request.status === "REJECTED" && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl flex-shrink-0">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-rose-900 text-base">Request Rejected</h3>
            <p className="text-xs text-rose-700 mt-0.5">
              This request was declined by the fulfilling branch. No inventory movements took place.
            </p>
            {request.decisionNote && (
              <div className="mt-2 p-2.5 bg-white/80 rounded-lg border border-rose-200 text-xs text-rose-800">
                <strong>Decision Note:</strong> {request.decisionNote}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overview Cards (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Requesting Branch Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Requesting Branch (Destination)
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base">
              {request.requestingBranch.name}
            </div>
            {request.requestingBranch.city && (
              <div className="text-xs text-slate-500">{request.requestingBranch.city}</div>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1 text-slate-500">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Requested by:{" "}
              <span className="font-semibold text-slate-800">
                {request.requestedByUser?.name || "Staff"}
              </span>
            </div>
            {request.requestedByUser?.phone && (
              <div className="text-slate-400 pl-4">{request.requestedByUser.phone}</div>
            )}
          </div>
        </div>

        {/* Fulfilling Branch Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            Fulfilling Branch (Source)
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base">
              {request.fulfillingBranch.name}
            </div>
            {request.fulfillingBranch.city && (
              <div className="text-xs text-slate-500">{request.fulfillingBranch.city}</div>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            {request.approvedByUser ? (
              <div className="flex items-center gap-1 text-slate-500">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Reviewed by:{" "}
                <span className="font-semibold text-slate-800">{request.approvedByUser.name}</span>
              </div>
            ) : (
              <div className="text-slate-400 italic">Awaiting review from branch manager</div>
            )}
            {request.approvalDate && (
              <div className="text-slate-400 pl-4">
                {new Date(request.approvalDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Notes & Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-purple-600" />
            Transfer Notes
          </div>

          <div className="text-xs space-y-2">
            <div>
              <span className="font-semibold text-slate-700 block">Requester Note:</span>
              <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                {request.note || "No requester note provided."}
              </p>
            </div>

            {request.decisionNote && (
              <div>
                <span className="font-semibold text-slate-700 block">Decision Note:</span>
                <p className="text-slate-600 bg-blue-50/50 p-2 rounded border border-blue-100 italic">
                  {request.decisionNote}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Case A: Review & Approve Request Panel (Received + Pending) */}
      {isFulfillingBranch && request.status === "PENDING" && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <Boxes className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Review & Approve Request</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Your branch was requested to fulfill these items. Adjust the approved quantity for
                each item as needed (up to requested quantity). Stock will NOT move until the
                requesting branch confirms receipt.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModalOpen(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold"
              >
                <Ban className="w-4 h-4 mr-1.5" />
                Reject Request
              </Button>
              <Button
                onClick={() => setApproveModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Approve Request ({totalAppUnits})
              </Button>
            </div>
          </div>

          {/* Items review table with stepper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Product Item</th>
                  <th className="px-4 py-3">Variant</th>
                  <th className="px-4 py-3 text-center">Your Stock</th>
                  <th className="px-4 py-3 text-center">Requested</th>
                  <th className="px-4 py-3 text-center">Approved Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {request.items.map((item) => {
                  const currentApproved = approvedQuantities[item.id] ?? item.requestedQty;
                  const liveStock = item.fulfillingStock ?? 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.product.name}</div>
                        <div className="text-xs text-slate-400">Code: {item.product.code}</div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        {item.productVariant.color || "Standard"}
                        {item.productVariant.quality ? ` • ${item.productVariant.quality}` : ""}
                        {item.productVariant.sku && (
                          <div className="text-slate-400 font-mono text-[11px]">
                            {item.productVariant.sku}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold ${
                            liveStock >= item.requestedQty
                              ? "bg-emerald-50 text-emerald-700"
                              : liveStock > 0
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {liveStock} Available
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                        {item.requestedQty}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={currentApproved <= 0}
                            onClick={() =>
                              handleApprovedQtyChange(
                                item.id,
                                item.requestedQty,
                                currentApproved - 1,
                              )
                            }
                            className="h-6 w-6 p-0 text-slate-600 hover:text-slate-900"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>

                          <input
                            type="number"
                            min={0}
                            max={item.requestedQty}
                            value={currentApproved}
                            onChange={(e) =>
                              handleApprovedQtyChange(
                                item.id,
                                item.requestedQty,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-12 text-center font-bold text-emerald-700 text-sm bg-transparent focus:outline-none"
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={currentApproved >= item.requestedQty}
                            onClick={() =>
                              handleApprovedQtyChange(
                                item.id,
                                item.requestedQty,
                                currentApproved + 1,
                              )
                            }
                            className="h-6 w-6 p-0 text-slate-600 hover:text-slate-900"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Decision Note (Optional explanation to the requesting branch)
            </label>
            <Textarea
              placeholder="e.g. Approved 2 units from display stock, remaining 1 unit out of stock..."
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>
        </div>
      )}

      {/* Requested Items List Table (General View for Cases B & C) */}
      {!(isFulfillingBranch && request.status === "PENDING") && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Requested Items</h3>
            </div>
            <div className="text-xs text-slate-500">
              Total Requested: <span className="font-bold text-slate-800">{totalReqUnits}</span>
              {request.status !== "PENDING" && (
                <>
                  {" "}
                  • Total Approved:{" "}
                  <span className="font-bold text-emerald-700">{totalAppUnits}</span>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Variant</th>
                  <th className="px-5 py-3.5 text-center">Req. Qty</th>
                  <th className="px-5 py-3.5 text-center">Approved Qty</th>
                  <th className="px-5 py-3.5 text-center">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {request.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{item.product.name}</div>
                      <div className="text-xs text-slate-400">Code: {item.product.code}</div>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <div className="font-medium text-slate-800">
                        {item.productVariant.color || "Standard"}
                        {item.productVariant.quality ? ` • ${item.productVariant.quality}` : ""}
                      </div>
                      {item.productVariant.sku && (
                        <div className="text-slate-400 font-mono text-[11px]">
                          {item.productVariant.sku}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center font-bold text-slate-800">
                      {item.requestedQty}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`font-bold ${
                          request.status === "REJECTED"
                            ? "text-rose-600 line-through"
                            : "text-emerald-700"
                        }`}
                      >
                        {item.approvedQty}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {request.status === "COMPLETED" && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                          Transferred
                        </Badge>
                      )}
                      {request.status === "APPROVED" && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Approved
                        </Badge>
                      )}
                      {request.status === "PENDING" && (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          Pending
                        </Badge>
                      )}
                      {request.status === "REJECTED" && (
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                          Declined
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Approve Confirmation */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirm Request Approval
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              You are approving this transfer of {totalAppUnits} units to{" "}
              <strong>{request.requestingBranch.name}</strong>. Stock will only leave your
              inventory when they confirm receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
              {request.items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-slate-600">{i.product.name}:</span>
                  <span className="font-bold text-slate-900">
                    {approvedQuantities[i.id] ?? i.requestedQty} / {i.requestedQty} units
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApproveModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {actionLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Reject Confirmation */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <Ban className="w-5 h-5 text-rose-600" />
              Reject Product Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Are you sure you want to decline this stock transfer? This will mark the request as
              rejected. No stock movements will take place.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Reason / Decision Note (Optional)
            </label>
            <Textarea
              placeholder="e.g. Products needed for local walk-in orders, no surplus available..."
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {actionLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Complete Transfer Confirmation */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Truck className="w-5 h-5 text-blue-600" />
              Confirm Physical Goods Receipt
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              By completing this transfer, you verify that you have physically received and inspected
              all items from <strong>{request.fulfillingBranch.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 text-xs bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Atomic Stock Execution
            </div>
            <p className="text-[11px] text-blue-700">
              This will decrement {totalAppUnits} units from {request.fulfillingBranch.name}&apos;s
              inventory and add them to your branch ({request.requestingBranch.name}) in a single
              database transaction.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompleteModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCompleteTransfer}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {actionLoading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm & Update Inventory"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
