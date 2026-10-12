"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { FilterConfig } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api-client";
import { PaymentSettlementDialog } from "@/components/admin/PaymentSettlementDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SupplierPaymentItem {
  id: string;
  referenceNo: string;
  amount: number | string;
  amountPaid?: number | string;
  method: string;
  createdAt: string;
  note: string | null;
  supplier?: { id: string; name: string; totalDue: number | string };
  walletType?: { id: string; name: string } | null;
  purchaseOrder?: { id: string; poNumber: string } | null;
  recordedBy?: { id: string; name: string };
}

export default function SupplierPaymentsPage() {
  const searchParams = useSearchParams();
  const initialSupplierId = searchParams.get("supplierId") || "";

  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<SupplierPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({
    supplier: initialSupplierId,
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<any | null>(null);
  const [pickerDialogOpen, setPickerDialogOpen] = useState(false);
  const [pickerSupplierId, setPickerSupplierId] = useState("");

  useEffect(() => {
    setTitle("Supplier Payments");
    setBadge("Accounting");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    apiGet<{ data: any[] }>("/suppliers", { limit: 100 })
      .then((supRes) => {
        if (supRes?.data) {
          setSuppliers(supRes.data);
          if (initialSupplierId) {
            const found = supRes.data.find((s) => s.id === initialSupplierId);
            if (found) {
              setSelectedSupplierForPayment(found);
            }
          }
        }
      })
      .catch(() => {});
  }, [initialSupplierId]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};

      if (filters.supplier) params.supplier = filters.supplier;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiGet<{ data: SupplierPaymentItem[] }>("/supplier-payments", params);
      setData(res?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load supplier payments");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenNewPayment = () => {
    if (suppliers.length > 0) {
      setPickerSupplierId(suppliers[0].id);
      setPickerDialogOpen(true);
    } else {
      toast.error("No suppliers found");
    }
  };

  const handleConfirmPicker = () => {
    const sup = suppliers.find((s) => s.id === pickerSupplierId);
    if (!sup) {
      toast.error("Please select a supplier");
      return;
    }
    setPickerDialogOpen(false);
    setSelectedSupplierForPayment(sup);
  };

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      type: "select",
      label: "Supplier",
      key: "supplier",
      options: suppliers.map((s) => ({ label: s.name, value: s.id })),
    },
  ], [suppliers]);

  const columns: ColumnDef<SupplierPaymentItem>[] = [
    {
      accessorKey: "referenceNo",
      header: "Reference No",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {row.original.referenceNo || row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-800 text-sm">{row.original.supplier?.name || "N/A"}</p>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount Paid",
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 text-base">
          ৳{Number(row.original.amount || row.original.amountPaid || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "method",
      header: "Payment Method",
      cell: ({ row }) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {row.original.method?.replace("_", " ")}
        </span>
      ),
    },
    {
      accessorKey: "walletType",
      header: "Wallet Account",
      cell: ({ row }) => (
        <span className="text-slate-600 text-xs font-medium">
          {row.original.walletType?.name || "Direct Cash / Bank"}
        </span>
      ),
    },
    {
      accessorKey: "purchaseOrder",
      header: "PO Reference",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 font-mono">
          {row.original.purchaseOrder?.poNumber || "Global Settlement"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-slate-500 text-xs">
          {new Date(row.original.createdAt).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      accessorKey: "recordedBy",
      header: "Recorded By",
      cell: ({ row }) => (
        <span className="text-slate-500 text-xs">
          {row.original.recordedBy?.name || "Admin"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Supplier Payments</h2>
          <p className="text-xs text-slate-500 mt-0.5">Disburse and track vendor settlement receipts</p>
        </div>
        <button
          onClick={handleOpenNewPayment}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Record Supplier Payment
        </button>
      </div>

      <FilterBar
        searchPlaceholder="Search by reference, supplier, note..."
        filters={filterConfigs}
        onSearchChange={(val) => setSearchQuery(val)}
        onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        onReset={() => {
          setSearchQuery("");
          setFilters({});
        }}
      />

      <DataTable columns={columns} data={data} pageSize={10} />

      {/* Supplier Select Modal (when clicking "+ Record Supplier Payment" from list without preset supplier) */}
      <Dialog open={pickerDialogOpen} onOpenChange={setPickerDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Select Supplier for Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Supplier *
              </label>
              <select
                value={pickerSupplierId}
                onChange={(e) => setPickerSupplierId(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Due: ৳{Number(s.totalDue || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPickerDialogOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPicker}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rich Live-Calculation Payment Settlement Dialog */}
      {selectedSupplierForPayment && (
        <PaymentSettlementDialog
          open={Boolean(selectedSupplierForPayment)}
          onOpenChange={(open) => {
            if (!open) setSelectedSupplierForPayment(null);
          }}
          entityType="supplier"
          entityId={selectedSupplierForPayment.id}
          entityName={selectedSupplierForPayment.name}
          totalDue={Number(selectedSupplierForPayment.totalDue || 0)}
          onPaymentSuccess={() => {
            loadData();
            // Refresh supplier details list
            apiGet<{ data: any[] }>("/suppliers", { limit: 100 }).then((res) => {
              if (res?.data) setSuppliers(res.data);
            }).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
