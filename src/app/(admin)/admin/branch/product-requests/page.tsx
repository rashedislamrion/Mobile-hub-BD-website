"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  Eye,
  RotateCw,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  CheckCheck,
  Building2,
  Package,
  Layers,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStaffAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface BranchInfo {
  id: string;
  name: string;
  code?: string;
  city?: string;
}

interface ProductRequestItem {
  id: string;
  productId: string;
  productVariantId: string;
  requestedQty: number;
  approvedQty: number;
  product?: {
    id: string;
    name: string;
    code: string;
  };
  productVariant?: {
    id: string;
    color?: string | null;
    quality?: string | null;
    sku?: string | null;
  };
}

interface ProductRequest {
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
  requestedByUser?: { id: string; name: string; phone?: string | null };
  approvedByUser?: { id: string; name: string };
  updatedByUser?: { id: string; name: string };
  items: ProductRequestItem[];
  itemsCount: number;
  totalQuantity: number;
  approvedQuantity: number;
}

export default function ProductRequestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useStaffAuth();

  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SENT" | "RECEIVED">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load available branches for filter dropdown
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await apiGet<any>("/branches");
        const list = Array.isArray(res) ? res : res?.data || [];
        setBranches(list);
      } catch (err) {
        console.error("Failed to load branches", err);
      }
    }
    loadBranches();
  }, []);

  const loadRequests = useCallback(async () => {
    if (!user?.branchId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (branchFilter !== "ALL") params.append("branchId", branchFilter);
      params.append("page", String(page));
      params.append("limit", String(limit));

      const res = await apiGet<{
        data: ProductRequest[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/product-requests?${params.toString()}`);

      setRequests(res.data || []);
      setTotalCount(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      console.error("Error loading product requests:", err);
      toast.error(err.message || "Failed to load product requests");
    } finally {
      setLoading(false);
    }
  }, [user?.branchId, debouncedSearch, typeFilter, statusFilter, branchFilter, page, limit]);

  useEffect(() => {
    if (user?.branchId) {
      loadRequests();
    }
  }, [user?.branchId, loadRequests]);

  const userBranchId = user?.branchId || "";
  const roleName = user?.role?.name?.toLowerCase() || "";
  const isBranchRole =
    roleName.includes("branch admin") || roleName.includes("branch manager");

  if (authLoading) {
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

  // Calculate summary stats relative to current branch
  const sentCount = requests.filter((r) => r.requestingBranchId === userBranchId).length;
  const receivedCount = requests.filter((r) => r.fulfillingBranchId === userBranchId).length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Product Requests</h1>
              <p className="text-sm text-slate-500">
                Inter-Branch Stock Requests for{" "}
                <span className="font-semibold text-slate-800">
                  {user?.branch?.name || "Your Branch"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRequests()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/admin/branch/product-requests/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm font-medium">
              <Plus className="w-4 h-4" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Page Requests
            </div>
            <div className="text-xl font-bold text-slate-900">{totalCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Sent (Outbound)
            </div>
            <div className="text-xl font-bold text-slate-900">{sentCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
              Received (Inbound)
            </div>
            <div className="text-xl font-bold text-slate-900">{receivedCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Pending Action
            </div>
            <div className="text-xl font-bold text-slate-900">{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by Request ID, Branch, Note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {/* Type Filter */}
          <div>
            <Select
              value={typeFilter}
              onValueChange={(val: any) => {
                setTypeFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="SENT">Sent (We Requested)</SelectItem>
                <SelectItem value="RECEIVED">Received (From Other Branch)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Branch Filter */}
          <div>
            <Select
              value={branchFilter}
              onValueChange={(val) => {
                setBranchFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>
                {branches
                  .filter((b) => b.id !== userBranchId)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Request ID</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Partner Branch</th>
                <th className="px-4 py-3.5 text-center">Items</th>
                <th className="px-4 py-3.5 text-center">Quantity</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Updated At</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading product requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto" />
                      <div className="font-semibold text-slate-700">No requests found</div>
                      <p className="text-xs text-slate-400">
                        There are no product requests matching your selected filters. Create a
                        new request to ask for inventory from another branch.
                      </p>
                      <Link href="/admin/branch/product-requests/create">
                        <Button size="sm" className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                          <Plus className="w-4 h-4 mr-1" /> Create Request
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const isSent = req.requestingBranchId === userBranchId;
                  const partnerBranch = isSent ? req.fulfillingBranch : req.requestingBranch;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/admin/branch/product-requests/${req.id}`)}
                    >
                      {/* Request ID */}
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {req.requestNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        <div className="text-[11px] text-slate-400">
                          {new Date(req.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Type (Computed relative to user's branch) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            Received
                          </span>
                        )}
                      </td>

                      {/* Partner Branch */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {partnerBranch?.name || "Unknown Branch"}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {partnerBranch?.city || isSent ? "Fulfilling" : "Requesting"}
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="px-4 py-3.5 text-center font-medium text-slate-700 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs font-normal">
                          {req.itemsCount} {req.itemsCount === 1 ? "item" : "items"}
                        </Badge>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="font-bold text-slate-900">{req.totalQuantity} units</div>
                        {req.status === "APPROVED" || req.status === "COMPLETED" ? (
                          <div className="text-[11px] text-emerald-600 font-medium">
                            {req.approvedQuantity} approved
                          </div>
                        ) : null}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {req.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Approved
                          </span>
                        )}
                        {req.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Completed
                          </span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Updated At */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-xs">
                        {new Date(req.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        <div className="text-[11px] text-slate-400">
                          {new Date(req.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/branch/product-requests/${req.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing page <span className="font-semibold text-slate-900">{page}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span> (
              <span className="font-semibold text-slate-900">{totalCount}</span> total requests)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs"
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-slate-700">{page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
