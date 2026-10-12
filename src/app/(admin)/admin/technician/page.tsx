"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User, 
  Smartphone, 
  Loader2, 
  RefreshCw,
  Search,
  Filter,
  Eye,
  Layers,
  ShieldCheck,
  CreditCard,
  Calendar,
  Sparkles,
  MapPin,
  Tag,
  Receipt,
  Store,
  Trash2,
  Plus
} from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ServiceJobMaterial {
  id: string;
  partName: string;
  sourceType?: "OWN_STOCK" | "SUPPLIER" | "OTHER";
  supplierId?: string | null;
  sourcedFromName?: string | null;
  sourceNote?: string | null;
  cost: number | string;
  quantity: number;
  total: number | string;
  supplier?: {
    id?: string;
    name: string;
    phone?: string;
  } | null;
  product?: {
    id?: string;
    name: string;
  } | null;
}

interface ServiceJobPayment {
  id: string;
  method: string;
  amount: number | string;
  status: string;
  transactionId?: string | null;
  createdAt: string;
}

interface ServiceJob {
  id: string;
  orderId?: string | null;
  invoiceNo?: string | null;
  device: string;
  model?: string | null;
  deviceType?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  issueDescription: string;
  problems?: any;
  specialization: string | null;
  warrantyPeriod?: string | null;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  laborCost?: number | string;
  materialCost?: number | string;
  totalBill?: number | string;
  discount?: number | string;
  finalAmount?: number | string;
  paidAmount?: number | string;
  dueAmount?: number | string;
  serviceCharge: number;
  technicianProfitShare?: number | string;
  paymentDetails?: any;
  status: "PENDING" | "IN_PROGRESS" | "READY_FOR_PICKUP" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  materials?: ServiceJobMaterial[];
  customer?: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
  } | null;
  order?: {
    id?: string;
    orderCode: string;
    customer?: {
      name: string;
      phone: string;
      email?: string | null;
      address?: string | null;
    } | null;
    branch?: {
      name: string;
    } | null;
    payments?: ServiceJobPayment[];
  } | null;
}

export default function TechnicianWorkspacePage() {
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedJob, setSelectedJob] = useState<ServiceJob | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Material Consumption Modal State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialJob, setMaterialJob] = useState<ServiceJob | null>(null);
  const [editMaterials, setEditMaterials] = useState<any[]>([]);
  const [isSavingMaterials, setIsSavingMaterials] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<{ id: string; name: string; purchasePrice?: number; sellingPrice?: number }[]>([]);

  useEffect(() => {
    apiGet<any>("/suppliers?limit=100").then((res) => {
      const list = res?.data || res || [];
      if (Array.isArray(list)) setSuppliers(list);
    }).catch(() => {});
    apiGet<any>("/products?limit=100").then((res) => {
      const list = res?.data || res || [];
      if (Array.isArray(list)) setCatalogProducts(list);
    }).catch(() => {});
  }, []);

  const handleOpenMaterialModal = (job: ServiceJob, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMaterialJob(job);
    const initial = (job.materials && job.materials.length > 0)
      ? job.materials.map((m) => ({
          id: m.id || `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          partName: m.partName || "",
          productId: m.product?.id || (m as any).productId || "",
          sourceType: m.sourceType || "OWN_STOCK",
          supplierId: m.supplier?.id || m.supplierId || "",
          sourcedFromName: m.sourcedFromName || "",
          sourceNote: m.sourceNote || "",
          cost: Number(m.cost || 0),
          quantity: Number(m.quantity || 1),
          total: Number(m.total || (Number(m.cost || 0) * Number(m.quantity || 1))),
        }))
      : [
          {
            id: `mat-${Date.now()}`,
            partName: "",
            productId: "",
            sourceType: "OWN_STOCK",
            supplierId: "",
            sourcedFromName: "",
            sourceNote: "",
            cost: 0,
            quantity: 1,
            total: 0,
          },
        ];
    setEditMaterials(initial);
    setIsMaterialModalOpen(true);
  };

  const handleAddMaterialRow = () => {
    setEditMaterials((prev) => [
      ...prev,
      {
        id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        partName: "",
        productId: "",
        sourceType: "OWN_STOCK",
        supplierId: "",
        sourcedFromName: "",
        sourceNote: "",
        cost: 0,
        quantity: 1,
        total: 0,
      },
    ]);
  };

  const handleRemoveMaterialRow = (rowId: string) => {
    setEditMaterials((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rowId) : prev));
  };

  const handleUpdateMaterialRow = (rowId: string, field: string, value: any) => {
    setEditMaterials((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updated = { ...r, [field]: value };
        if (field === "productId" && value) {
          const prod = catalogProducts.find((p) => p.id === value);
          if (prod) {
            updated.partName = prod.name;
            const unitCost = Number(prod.purchasePrice) || Number(prod.sellingPrice) || 0;
            updated.cost = unitCost;
          }
        }
        if (field === "sourceType") {
          if (value === "SUPPLIER") {
            if (!updated.supplierId && suppliers.length > 0) {
              updated.supplierId = suppliers[0].id;
            }
            updated.sourcedFromName = "";
            updated.sourceNote = "";
          }
          if (value === "OWN_STOCK") {
            updated.supplierId = "";
            updated.sourcedFromName = "";
            updated.sourceNote = "";
          }
          if (value === "OTHER") {
            updated.supplierId = "";
          }
        }
        if (field === "cost" || field === "quantity" || field === "productId") {
          updated.total = Number(updated.cost || 0) * Number(updated.quantity || 1);
        }
        return updated;
      })
    );
  };

  const handleSaveMaterials = async () => {
    if (!materialJob) return;

    for (let i = 0; i < editMaterials.length; i++) {
      const mat = editMaterials[i];
      if (mat.cost > 0 || mat.partName.trim()) {
        if (!mat.partName.trim()) {
          toast.error(`Part name is required for Material Row #${i + 1}.`);
          return;
        }
        if (mat.sourceType === "SUPPLIER" && !mat.supplierId) {
          toast.error(`Please select a registered supplier for Material Row #${i + 1} (${mat.partName}).`);
          return;
        }
        if (mat.sourceType === "OTHER" && !mat.sourcedFromName?.trim()) {
          toast.error(`Please provide the sourced vendor/person name for Material Row #${i + 1} (${mat.partName}).`);
          return;
        }
      }
    }

    try {
      setIsSavingMaterials(true);
      const validMaterials = editMaterials
        .filter((m) => m.partName.trim().length > 0)
        .map((m) => ({
          partName: m.partName.trim(),
          productId: m.productId || undefined,
          sourceType: m.sourceType || "OWN_STOCK",
          supplierId: m.sourceType === "SUPPLIER" ? m.supplierId : undefined,
          sourcedFromName: m.sourceType === "OTHER" ? (m.sourcedFromName?.trim() || undefined) : undefined,
          sourceNote: m.sourceType === "OTHER" ? (m.sourceNote?.trim() || m.sourcedFromName?.trim() || undefined) : undefined,
          cost: Number(m.cost) || 0,
          quantity: Number(m.quantity) || 1,
          total: Number(m.cost || 0) * Number(m.quantity || 1),
        }));

      await apiPatch(`/service-jobs/${materialJob.id}`, {
        materials: validMaterials,
      });

      toast.success("Hardware parts and materials updated successfully!");
      setIsMaterialModalOpen(false);

      if (selectedJob && selectedJob.id === materialJob.id) {
        const refreshed = await apiGet<ServiceJob>(`/service-jobs/${materialJob.id}`);
        if (refreshed) setSelectedJob(refreshed);
      }
      fetchMyJobs();
    } catch (err: any) {
      toast.error(err.message || "Failed to update materials.");
    } finally {
      setIsSavingMaterials(false);
    }
  };

  const fetchMyJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<ServiceJob[]>("/service-jobs/my");
      setJobs(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load assigned service jobs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyJobs();
  }, [fetchMyJobs]);

  const handleOpenDetail = async (job: ServiceJob) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);

    try {
      // Fetch full job detail to load all deep relations (materials, warranty, payments)
      const fullJob = await apiGet<ServiceJob>(`/service-jobs/${job.id}`);
      if (fullJob) {
        setSelectedJob(fullJob);
        // Also update local job card list with freshest detail
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...fullJob } : j)));
      }
    } catch {
      // Fallback cleanly to job already loaded
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleStatusUpdate = async (jobId: string, newStatus: ServiceJob["status"], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUpdatingJobId(jobId);
    try {
      await apiPatch(`/service-jobs/${jobId}/status`, { status: newStatus });
      toast.success(`Job status updated to ${newStatus.replace(/_/g, " ")}`);
      // Update local state in jobs list
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      // Update selectedJob if currently open in modal
      setSelectedJob((prev) => (prev && prev.id === jobId ? { ...prev, status: newStatus } : prev));
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setUpdatingJobId(null);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== "ALL" && j.status !== statusFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchDevice = j.device?.toLowerCase().includes(s);
      const matchIssue = j.issueDescription?.toLowerCase().includes(s);
      const matchCustomer = (j.customer?.name || j.order?.customer?.name)?.toLowerCase().includes(s);
      const matchPhone = (j.customer?.phone || j.order?.customer?.phone)?.includes(s);
      const matchOrder = (j.invoiceNo || j.order?.orderCode)?.toLowerCase().includes(s);
      return matchDevice || matchIssue || matchCustomer || matchPhone || matchOrder;
    }
    return true;
  });

  const countByStatus = {
    ALL: jobs.length,
    PENDING: jobs.filter((j) => j.status === "PENDING").length,
    IN_PROGRESS: jobs.filter((j) => j.status === "IN_PROGRESS").length,
    READY_FOR_PICKUP: jobs.filter((j) => j.status === "READY_FOR_PICKUP").length,
    DELIVERED: jobs.filter((j) => j.status === "DELIVERED").length,
  };

  // Helper calculations for selected job in modal
  const modalTotalBill = Number(selectedJob?.finalAmount || selectedJob?.totalBill || selectedJob?.serviceCharge || 0);
  const modalMaterialCost = Number(selectedJob?.materialCost || 0);
  const modalLaborProfit = Math.max(0, modalTotalBill - modalMaterialCost);
  const modalTechnicianShare = Number(selectedJob?.technicianProfitShare || (modalLaborProfit * 0.5));

  // Resolved payments array from order.payments or paymentDetails JSON
  const modalPayments: Array<{ method: string; amount: number; transactionId?: string; date?: string }> = [];
  if (selectedJob?.order?.payments && Array.isArray(selectedJob.order.payments)) {
    selectedJob.order.payments.forEach((p) => {
      modalPayments.push({
        method: p.method,
        amount: Number(p.amount || 0),
        transactionId: p.transactionId || undefined,
        date: p.createdAt,
      });
    });
  } else if (selectedJob?.paymentDetails) {
    if (Array.isArray(selectedJob.paymentDetails)) {
      selectedJob.paymentDetails.forEach((p: any) => {
        modalPayments.push({
          method: p.method || p.type || "Cash",
          amount: Number(p.amount || 0),
          transactionId: p.transactionId || p.reference,
          date: p.date,
        });
      });
    } else if (typeof selectedJob.paymentDetails === "object") {
      Object.entries(selectedJob.paymentDetails).forEach(([k, v]: [string, any]) => {
        if (typeof v === "number" && v > 0) {
          modalPayments.push({ method: k.toUpperCase(), amount: v });
        }
      });
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Technician Workspace</h1>
              <p className="text-xs text-slate-500">
                Manage your assigned repair and servicing jobs with complete job detail views
              </p>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchMyJobs}
          className="gap-2 border-slate-200 text-slate-600 hover:text-slate-900"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Jobs
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "PENDING"
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold uppercase">Pending</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{countByStatus.PENDING}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "IN_PROGRESS"
              ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-semibold uppercase">In Progress</span>
            <Wrench className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{countByStatus.IN_PROGRESS}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("READY_FOR_PICKUP")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "READY_FOR_PICKUP"
              ? "bg-purple-50/80 border-purple-300 ring-2 ring-purple-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-semibold uppercase">Ready For Pickup</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{countByStatus.READY_FOR_PICKUP}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "ALL"
              ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold uppercase">Total Assigned</span>
            <Filter className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{countByStatus.ALL}</p>
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by device, issue, customer, order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-700 w-full sm:w-48"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="READY_FOR_PICKUP">Ready for Pickup</option>
          <option value="DELIVERED">Delivered / Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Wrench className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No Service Jobs Found</p>
          <p className="text-xs text-slate-400 mt-1">
            {jobs.length === 0
              ? "You currently have no service jobs assigned to you."
              : "No jobs match your current search or status filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const isUpdating = updatingJobId === job.id;
            const customerName = job.customer?.name || job.order?.customer?.name || "Walk-In Customer";
            const customerPhone = job.customer?.phone || job.order?.customer?.phone;
            const displayCode = job.invoiceNo || job.order?.orderCode || `SRV-${job.id.slice(-6)}`;

            return (
              <div
                key={job.id}
                onClick={() => handleOpenDetail(job)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Header with order code, detail indicator, and status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        ORDER CODE
                      </span>
                      <p className="font-mono font-bold text-emerald-600 text-sm group-hover:text-emerald-700">
                        #{displayCode}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 group-hover:text-emerald-600 font-medium flex items-center gap-1 ml-2 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View Detail
                    </span>
                  </div>

                  <Badge
                    variant="secondary"
                    className={`text-xs font-semibold ${
                      job.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : job.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800"
                        : job.status === "READY_FOR_PICKUP"
                        ? "bg-purple-100 text-purple-800"
                        : job.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {job.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                {/* Device & Issue details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-slate-900 text-sm">{job.device}</span>
                    {job.model && (
                      <span className="text-xs text-slate-500 font-normal">({job.model})</span>
                    )}
                    {job.specialization && (
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {job.specialization}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md leading-relaxed group-hover:bg-emerald-50/30 transition-colors">
                    <strong className="text-slate-700">Issue: </strong>
                    {job.issueDescription}
                  </p>
                </div>

                {/* Quick financial indicator if bill/material present */}
                {(Number(job.totalBill || job.serviceCharge || 0) > 0 || Number(job.materialCost || 0) > 0) && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Bill</span>
                      <span className="font-mono font-bold text-slate-800">
                        ৳{Number(job.finalAmount || job.totalBill || job.serviceCharge || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Material</span>
                      <span className="font-mono font-semibold text-blue-700">
                        ৳{Number(job.materialCost || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Your Share</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ৳{Math.round(Number(job.technicianProfitShare || ((Number(job.finalAmount || job.totalBill || job.serviceCharge || 0) - Number(job.materialCost || 0)) * 0.5))).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Customer info */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customerName}</span>
                  </div>
                  {customerPhone && (
                    <div className="flex items-center gap-1 font-mono text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Status Update Quick Action Controls */}
                <div 
                  className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">Update Status:</span>

                    {job.status === "PENDING" && (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={(e) => handleStatusUpdate(job.id, "IN_PROGRESS", e)}
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                      >
                        Start Repair
                      </Button>
                    )}

                    {job.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={(e) => handleStatusUpdate(job.id, "READY_FOR_PICKUP", e)}
                        className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
                      >
                        Ready for Pickup
                      </Button>
                    )}

                    {job.status === "READY_FOR_PICKUP" && (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={(e) => handleStatusUpdate(job.id, "DELIVERED", e)}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        Mark Completed
                      </Button>
                    )}

                    {job.status !== "PENDING" && job.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={(e) => handleStatusUpdate(job.id, "PENDING", e)}
                        className="h-7 text-xs text-slate-600 border-slate-200"
                      >
                        Reset to Pending
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleOpenMaterialModal(job, e)}
                      className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1 px-2 font-medium"
                      title="Consume / Record Materials"
                    >
                      <Wrench className="w-3.5 h-3.5 text-blue-600" />
                      Parts ({job.materials?.length || 0})
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDetail(job)}
                      className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 px-2 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL JOB DETAIL VIEW MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-emerald-600 font-bold uppercase tracking-wider block">
                  Service Ticket #{selectedJob?.invoiceNo || selectedJob?.order?.orderCode || selectedJob?.id}
                </span>
                <DialogTitle className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  {selectedJob?.device} {selectedJob?.model ? `(${selectedJob.model})` : ""}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Created on {selectedJob ? new Date(selectedJob.createdAt).toLocaleString("en-GB") : ""}
                </DialogDescription>
              </div>

              {selectedJob && (
                <Badge
                  className={`text-xs px-3 py-1 font-semibold ${
                    selectedJob.status === "PENDING"
                      ? "bg-amber-100 text-amber-800"
                      : selectedJob.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800"
                      : selectedJob.status === "READY_FOR_PICKUP"
                      ? "bg-purple-100 text-purple-800"
                      : selectedJob.status === "DELIVERED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {selectedJob.status.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs">Loading complete job history...</p>
            </div>
          ) : selectedJob ? (
            <div className="space-y-6 pt-2">
              {/* Section 1: Device Info & Problem Description */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-slate-600" />
                  Complete Device & Problem Information
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Device Name</span>
                    <span className="font-semibold text-slate-800">{selectedJob.device}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Model</span>
                    <span className="font-semibold text-slate-800">{selectedJob.model || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Device Type</span>
                    <span className="font-semibold text-slate-800">{selectedJob.deviceType?.name || "Smart Phone"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Brand</span>
                    <span className="font-semibold text-slate-800">{selectedJob.brand?.name || "Generic"}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px] mb-1">Issue Description</span>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed font-sans">
                    {selectedJob.issueDescription}
                  </p>
                </div>

                {/* Problem tags if present */}
                {selectedJob.problems && (
                  <div className="pt-1">
                    <span className="text-slate-400 block text-[11px] mb-1.5">Diagnosed Problems</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(selectedJob.problems) ? (
                        selectedJob.problems.map((p: any, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium"
                          >
                            <Tag className="w-3 h-3 text-emerald-600" />
                            {p.name || p.title || p}
                          </span>
                        ))
                      ) : typeof selectedJob.problems === "string" ? (
                        <span className="text-xs text-slate-600">{selectedJob.problems}</span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Material History (Parts Used & Costs) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Material History (Parts Used)
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {selectedJob.materials?.length || 0} part(s) recorded
                    </Badge>
                    {selectedJob.status !== "DELIVERED" && selectedJob.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMaterialModal(selectedJob)}
                        className="h-7 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-1 font-medium"
                      >
                        <Plus className="w-3 h-3" /> Record / Consume Parts
                      </Button>
                    )}
                  </div>
                </div>

                {!selectedJob.materials || selectedJob.materials.length === 0 ? (
                  <div className="bg-slate-50 p-4 rounded-lg text-center text-xs text-slate-400">
                    No hardware parts or materials sourced for this job.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Part Name</th>
                          <th className="py-2.5 px-3">Source & Supplier</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Unit Cost</th>
                          <th className="py-2.5 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedJob.materials.map((m) => (
                          <tr key={m.id}>
                            <td className="py-2 px-3 font-medium text-slate-800">{m.partName}</td>
                            <td className="py-2 px-3">
                              {m.sourceType === "OTHER" ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    Sourced From Outside
                                  </span>
                                  {m.sourcedFromName && (
                                    <p className="text-[11px] text-amber-950 font-semibold">
                                      Vendor: {m.sourcedFromName}
                                    </p>
                                  )}
                                  {m.sourceNote && (
                                    <p className="text-[11px] text-amber-900/90 font-medium italic">
                                      Note: {m.sourceNote}
                                    </p>
                                  )}
                                </div>
                              ) : m.sourceType === "SUPPLIER" || (!m.sourceType && m.supplier) ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                    From Supplier
                                  </span>
                                  <p className="text-[11px] text-slate-700 font-medium">
                                    {m.supplier?.name || "Registered Supplier"}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    From Own Stock
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">{m.quantity}</td>
                            <td className="py-2 px-3 text-right font-mono">৳{Number(m.cost || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              ৳{Number(m.total || Number(m.cost) * m.quantity || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-blue-50/50 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={4} className="py-2.5 px-3 text-blue-900">Total Material Cost</td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                            ৳{modalMaterialCost.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 3: Financial & Profit Breakdown (Matching 50% split) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-br from-slate-50 to-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Total Bill</span>
                  <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                    ৳{modalTotalBill.toLocaleString()}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Material Cost</span>
                  <span className="text-base font-bold font-mono text-blue-700 mt-1 block">
                    ৳{modalMaterialCost.toLocaleString()}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Labor Profit</span>
                  <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
                    ৳{modalLaborProfit.toLocaleString()}
                  </span>
                </div>

                <div className="bg-emerald-600 text-white p-3 rounded-lg shadow-xs">
                  <span className="text-[11px] text-emerald-100 block font-semibold">Your Share (50%)</span>
                  <span className="text-base font-bold font-mono text-white mt-1 block">
                    ৳{modalTechnicianShare.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Section 4: Warranty Info & Payment Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Warranty Info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                    Warranty Information
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Coverage:</span>
                      <span className="font-semibold">{selectedJob.warrantyPeriod || "None / Standard"}</span>
                    </div>
                    {selectedJob.warrantyStartDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Start Date:</span>
                        <span>{new Date(selectedJob.warrantyStartDate).toLocaleDateString("en-GB")}</span>
                      </div>
                    )}
                    {selectedJob.warrantyEndDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">End Date:</span>
                        <span>{new Date(selectedJob.warrantyEndDate).toLocaleDateString("en-GB")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Methods Used */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-600" />
                    Payment Method(s) Used
                  </h4>
                  {modalPayments.length === 0 ? (
                    <p className="text-xs text-slate-400">No payment transaction records linked.</p>
                  ) : (
                    <div className="space-y-1 text-xs">
                      {modalPayments.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                          <span className="font-semibold text-slate-700 uppercase">{p.method}</span>
                          <span className="font-mono font-bold text-slate-900">৳{p.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Paid Amount: ৳{Number(selectedJob.paidAmount || 0).toLocaleString()}</span>
                    <span className={`font-semibold ${Number(selectedJob.dueAmount || 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      Due: ৳{Number(selectedJob.dueAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Customer & Branch Info */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      {selectedJob.customer?.name || selectedJob.order?.customer?.name || "Walk-In Customer"}
                    </span>
                    {(selectedJob.customer?.phone || selectedJob.order?.customer?.phone) && (
                      <span className="text-slate-400 ml-2 font-mono">
                        ({selectedJob.customer?.phone || selectedJob.order?.customer?.phone})
                      </span>
                    )}
                  </div>
                </div>
                {selectedJob.order?.branch?.name && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Branch: {selectedJob.order.branch.name}</span>
                  </div>
                )}
              </div>

              {/* Section 6: Status Update Action Controls inside Modal */}
              <div className="bg-slate-100 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-700">Change Service Status:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedJob.status === "PENDING" && (
                    <Button
                      size="sm"
                      disabled={updatingJobId === selectedJob.id}
                      onClick={() => handleStatusUpdate(selectedJob.id, "IN_PROGRESS")}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
                    >
                      Start Repair (In Progress)
                    </Button>
                  )}

                  {selectedJob.status === "IN_PROGRESS" && (
                    <Button
                      size="sm"
                      disabled={updatingJobId === selectedJob.id}
                      onClick={() => handleStatusUpdate(selectedJob.id, "READY_FOR_PICKUP")}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1"
                    >
                      Ready for Pickup
                    </Button>
                  )}

                  {selectedJob.status === "READY_FOR_PICKUP" && (
                    <Button
                      size="sm"
                      disabled={updatingJobId === selectedJob.id}
                      onClick={() => handleStatusUpdate(selectedJob.id, "DELIVERED")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                    >
                      Mark Completed (Delivered)
                    </Button>
                  )}

                  {selectedJob.status !== "PENDING" && selectedJob.status !== "CANCELLED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingJobId === selectedJob.id}
                      onClick={() => handleStatusUpdate(selectedJob.id, "PENDING")}
                      className="text-xs text-slate-600 border-slate-300"
                    >
                      Reset to Pending
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsDetailOpen(false)}
                    className="text-xs text-slate-500"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Material Consumption Modal (Fix Pass 24) */}
      <Dialog open={isMaterialModalOpen} onOpenChange={setIsMaterialModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Technician Parts & Sourcing
                </span>
                <DialogTitle className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-emerald-600" />
                  Record / Consume Materials
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Job #{materialJob?.invoiceNo || materialJob?.id?.slice(-6)} • {materialJob?.device} • {materialJob?.customer?.name || materialJob?.order?.customer?.name || "Customer"}
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMaterialRow}
                className="text-xs h-8 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-medium"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Part / Material
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {editMaterials.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                No materials added yet. Click &quot;Add Part / Material&quot; to record spare parts.
              </div>
            ) : (
              editMaterials.map((row, idx) => (
                <div
                  key={row.id}
                  className={`p-3 rounded-lg border transition-all ${
                    row.sourceType === "OTHER"
                      ? "bg-amber-50/20 border-amber-300 shadow-xs"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                    {/* Part Name / Catalog Picker (3 cols) */}
                    <div className="md:col-span-3">
                      <Label className="text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                        <span>Part / Material Name *</span>
                        {catalogProducts.length > 0 && (
                          <span className="text-[10px] text-emerald-600 font-normal">Catalog:</span>
                        )}
                      </Label>
                      <div className="space-y-1">
                        <Input
                          placeholder="e.g. OLED Display Panel"
                          value={row.partName}
                          onChange={(e) => handleUpdateMaterialRow(row.id, "partName", e.target.value)}
                          className="h-8 text-xs bg-white font-medium"
                        />
                        {catalogProducts.length > 0 && (
                          <select
                            value={row.productId || ""}
                            onChange={(e) => handleUpdateMaterialRow(row.id, "productId", e.target.value)}
                            className="w-full h-7 text-[11px] rounded border border-slate-300 bg-white px-2 text-slate-700"
                          >
                            <option value="">Or Pick from Spare-Parts Catalog...</option>
                            {catalogProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (৳{Number(p.purchasePrice || p.sellingPrice || 0)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Source Type Selector (2 cols) */}
                    <div className="md:col-span-2">
                      <Label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                        Source Type *
                      </Label>
                      <select
                        value={row.sourceType}
                        onChange={(e) => handleUpdateMaterialRow(row.id, "sourceType", e.target.value)}
                        className={`w-full h-8 text-xs rounded-md border bg-white px-2 font-medium ${
                          row.sourceType === "OTHER"
                            ? "border-amber-400 focus:ring-amber-500 font-semibold text-amber-900"
                            : "border-slate-300 focus:ring-emerald-500 text-slate-800"
                        }`}
                      >
                        <option value="OWN_STOCK">From Own Stock</option>
                        <option value="SUPPLIER">From Supplier</option>
                        <option value="OTHER">Sourced From Outside</option>
                      </select>
                    </div>

                    {/* Sourcing Details (Supplier or Note or Own Stock Tag) (3 cols) */}
                    <div className="md:col-span-3">
                      {row.sourceType === "SUPPLIER" ? (
                        <div>
                          <Label className="text-[11px] font-semibold text-emerald-700 mb-1 flex items-center justify-between">
                            <span>Sourced Supplier *</span>
                            <span className="text-[10px] text-emerald-600 font-normal">Registered</span>
                          </Label>
                          <select
                            value={row.supplierId}
                            onChange={(e) => handleUpdateMaterialRow(row.id, "supplierId", e.target.value)}
                            className="w-full h-8 text-xs rounded-md border border-emerald-300 bg-white px-2 text-slate-800 focus:ring-emerald-500 font-medium"
                            required
                          >
                            <option value="">Select Supplier...</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : row.sourceType === "OTHER" ? (
                        <div>
                          <Label className="text-[11px] font-semibold text-amber-800 mb-1 block">
                            Sourcing Source
                          </Label>
                          <div className="h-8 flex items-center px-2.5 rounded-md bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-medium">
                            <Store className="w-3.5 h-3.5 mr-1.5 text-amber-700 flex-shrink-0" />
                            <span className="truncate font-semibold">Outside / Ad-hoc Vendor</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                            Sourcing Source
                          </Label>
                          <div className="h-8 flex items-center px-2.5 rounded-md bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                            <span className="truncate">In-House Inventory</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Unit Cost (2 cols) */}
                    <div className="md:col-span-2">
                      <Label className="text-[11px] font-semibold text-slate-600 mb-1">Unit Cost (৳) *</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.cost === 0 ? "" : row.cost}
                        onChange={(e) => handleUpdateMaterialRow(row.id, "cost", e.target.value)}
                        className="h-8 text-xs bg-white font-mono font-bold"
                      />
                    </div>

                    {/* Quantity (1 col) */}
                    <div className="md:col-span-1">
                      <Label className="text-[11px] font-semibold text-slate-600 mb-1">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handleUpdateMaterialRow(row.id, "quantity", e.target.value)}
                        className="h-8 text-xs bg-white text-center font-bold"
                      />
                    </div>

                    {/* Total & Action (1 col) */}
                    <div className="md:col-span-1 flex items-center justify-between gap-1">
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-600 mb-1">Total</Label>
                        <div className="text-xs font-mono font-bold text-slate-800 py-1">
                          ৳{Number(row.total || 0).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={editMaterials.length <= 1}
                        onClick={() => handleRemoveMaterialRow(row.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        title="Delete material row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Dedicated "Sourced From Outside" Box directly below this row */}
                  {row.sourceType === "OTHER" && (
                    <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 mt-2 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-200/80">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Store className="w-4 h-4 text-amber-700" />
                          <span>Sourced From Outside (Vendor & Sourcing Details)</span>
                        </div>
                        <span className="text-[10px] text-amber-800 bg-amber-200/60 border border-amber-300 px-2 py-0.5 rounded font-semibold">
                          Outside Sourcing Details
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Sourced From (Vendor/Person Name) - Required */}
                        <div className="md:col-span-5">
                          <Label className="text-xs font-bold text-amber-900 mb-1 flex items-center justify-between">
                            <span>Sourced From (Vendor/Person Name) *</span>
                            <span className="text-[10px] text-amber-700 font-semibold">(Required)</span>
                          </Label>
                          <Input
                            placeholder="e.g. Anwar Hardware, Elephant Road"
                            value={row.sourcedFromName || ""}
                            onChange={(e) => handleUpdateMaterialRow(row.id, "sourcedFromName", e.target.value)}
                            className="h-8 text-xs bg-white border-amber-300 text-slate-900 focus-visible:ring-amber-500 font-medium placeholder:text-slate-400"
                            required
                          />
                        </div>

                        {/* Note / Description - Optional */}
                        <div className="md:col-span-7">
                          <Label className="text-xs font-semibold text-amber-900 mb-1 flex items-center justify-between">
                            <span>Note / Description (Optional)</span>
                          </Label>
                          <Textarea
                            rows={2}
                            placeholder="e.g. Bought urgently, no warranty, cash payment"
                            value={row.sourceNote || ""}
                            onChange={(e) => handleUpdateMaterialRow(row.id, "sourceNote", e.target.value)}
                            className="min-h-[34px] h-[34px] text-xs bg-white border-amber-300 text-slate-900 focus-visible:ring-amber-500 font-medium resize-none py-1.5 placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Running Total & Save Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-lg">
            <div className="text-xs text-slate-600">
              <span>Total Material Cost: </span>
              <strong className="text-sm font-mono font-bold text-blue-700 ml-1">
                ৳{editMaterials.reduce((acc, r) => acc + (Number(r.total) || 0), 0).toLocaleString()}
              </strong>
              <span className="text-slate-400 ml-2">({editMaterials.filter((r) => r.partName.trim()).length} parts)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMaterialModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSavingMaterials}
                onClick={handleSaveMaterials}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isSavingMaterials ? "Saving..." : "Save Materials & Sourcing"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
