"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { FilterConfig } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Info, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost } from "@/lib/api-client";
import { getWalletIconComponent } from "@/components/admin/WalletIconHelper";

interface WalletDepositRecord {
  id: string;
  referenceNo: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number | string;
  balanceAfter: number | string;
  note: string | null;
  createdAt: string;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  walletType?: { id: string; name: string; kind: string; icon?: string };
  purpose?: { id: string; name: string; category: string } | null;
  recordedBy?: { id: string; name: string; employeeId?: string };
}

export default function DepositHistoryPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<WalletDepositRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const [wallets, setWallets] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [purposes, setPurposes] = useState<any[]>([]);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<WalletDepositRecord | null>(null);
  const [formData, setFormData] = useState({
    walletTypeId: "",
    branchId: "",
    purposeId: "",
    amount: "",
    note: "",
  });

  useEffect(() => {
    setTitle("Deposit History");
    setBadge("Accounting");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    Promise.all([
      apiGet<any[]>("/wallet-types"),
      apiGet<{ data: any[] }>("/branches").catch(() => null),
      apiGet<any[]>("/purposes"),
    ])
      .then(([walletRes, branchRes, purpRes]) => {
        if (Array.isArray(walletRes)) {
          setWallets(walletRes);
          if (walletRes.length > 0) {
            setFormData((prev) => ({ ...prev, walletTypeId: walletRes[0].id }));
          }
        }
        if (branchRes?.data && Array.isArray(branchRes.data)) {
          setBranches(branchRes.data);
        }
        if (Array.isArray(purpRes)) setPurposes(purpRes);
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        type: "DEPOSIT",
      };

      if (filters.walletType) params.walletType = filters.walletType;
      if (filters.branch) params.branch = filters.branch;
      if (filters.purpose) params.purpose = filters.purpose;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiGet<{ data: WalletDepositRecord[] }>("/wallet-transactions", params);
      setData(res?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load deposit transactions");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveDeposit = async () => {
    if (!formData.walletTypeId) {
      toast.error("Please select a wallet");
      return;
    }
    if (!formData.purposeId) {
      toast.error("Please select a deposit purpose");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }

    try {
      await apiPost("/wallet-transactions", {
        walletTypeId: formData.walletTypeId,
        type: "DEPOSIT",
        amount: Number(formData.amount),
        purposeId: formData.purposeId,
        branchId: formData.branchId || undefined,
        note: formData.note.trim() || undefined,
      });

      toast.success(`Deposit of ৳${Number(formData.amount).toLocaleString()} recorded successfully`);
      setDialogOpen(false);
      setFormData({
        walletTypeId: wallets[0]?.id || "",
        branchId: "",
        purposeId: "",
        amount: "",
        note: "",
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record deposit");
    }
  };

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      type: "select",
      label: "All Wallets",
      key: "walletType",
      options: wallets.map((w) => ({ label: w.name, value: w.id })),
    },
    {
      type: "select",
      label: "All Branches",
      key: "branch",
      options: branches.map((b) => ({ label: b.name, value: b.id })),
    },
    {
      type: "select",
      label: "All Purposes",
      key: "purpose",
      options: purposes.map((p) => ({ label: p.name, value: p.id })),
    },
  ], [wallets, branches, purposes]);

  const columns: ColumnDef<WalletDepositRecord>[] = [
    {
      accessorKey: "createdAt",
      header: "DATE",
      cell: ({ row }) => {
        const d = new Date(row.original.createdAt);
        return (
          <span className="text-slate-700 whitespace-nowrap text-xs font-medium">
            {d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            <span className="text-[10px] text-slate-400 block font-normal">
              {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </span>
        );
      },
    },
    {
      accessorKey: "walletType",
      header: "WALLET",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            {getWalletIconComponent(row.original.walletType?.icon, row.original.walletType?.kind, "w-3.5 h-3.5")}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-xs leading-tight">
              {row.original.walletType?.name || "Cash Drawer"}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">
              {row.original.walletType?.kind?.replace("_", " ")}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "branch",
      header: "BRANCH",
      cell: ({ row }) => (
        <span className="text-slate-700 text-xs font-medium">
          {row.original.branch?.name || "--"}
        </span>
      ),
    },
    {
      accessorKey: "purpose",
      header: "PURPOSE",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          {row.original.purpose?.name || "General Deposit"}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "AMOUNT",
      cell: ({ row }) => (
        <span className="font-bold text-xs text-emerald-600 whitespace-nowrap">
          +৳{Number(row.original.amount).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "note",
      header: "NOTE",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block">
          {row.original.note || "---"}
        </span>
      ),
    },
    {
      id: "info",
      header: "INFO",
      cell: ({ row }) => (
        <button
          onClick={() => setDetailItem(row.original)}
          className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100 transition-colors"
          title="View Details"
        >
          <Info className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Deposit History</h2>
          <p className="text-xs text-slate-500 mt-0.5">Audit log of all funds injected into company accounts</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Deposit
        </button>
      </div>

      <FilterBar
        searchPlaceholder="Search deposits by reference, note..."
        filters={filterConfigs}
        onSearchChange={(val) => setSearchQuery(val)}
        onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        onReset={() => {
          setSearchQuery("");
          setFilters({});
        }}
      />

      <DataTable columns={columns} data={data} pageSize={10} />

      {/* Add New Deposit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Add New Deposit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            {/* Select Wallet */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Select Wallet *
              </label>
              <select
                value={formData.walletTypeId}
                onChange={(e) => setFormData({ ...formData, walletTypeId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select Wallet Account...</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Bal: ৳{Number(w.currentBalance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Branch (Optional) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Select Branch
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-emerald-500"
              >
                <option value="">Select Branch (Optional)...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Deposit Purpose */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Deposit Purpose *
              </label>
              <select
                value={formData.purposeId}
                onChange={(e) => setFormData({ ...formData, purposeId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select Purpose...</option>
                {purposes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Deposit Amount */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Deposit Amount *
              </label>
              <Input
                type="number"
                min="1"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="h-10 text-sm font-bold text-emerald-700 rounded-xl"
                required
              />
            </div>

            {/* Remarks / Note */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Remarks / Note
              </label>
              <Textarea
                placeholder="Details of the deposit source or reference..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="resize-none h-20 text-xs rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDeposit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Details Modal */}
      {detailItem && (
        <Dialog open={Boolean(detailItem)} onOpenChange={(open) => !open && setDetailItem(null)}>
          <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Deposit Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Reference:</span>
                <span className="font-mono font-bold text-slate-800">{detailItem.referenceNo}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Wallet:</span>
                <span className="font-bold text-slate-800">{detailItem.walletType?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Branch:</span>
                <span className="font-semibold text-slate-800">{detailItem.branch?.name || "Headquarters"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Purpose:</span>
                <span className="font-semibold text-emerald-700">{detailItem.purpose?.name || "General"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Deposit Amount:</span>
                <span className="font-extrabold text-emerald-600 text-sm">৳{Number(detailItem.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Balance After:</span>
                <span className="font-bold text-slate-800">৳{Number(detailItem.balanceAfter).toLocaleString()}</span>
              </div>
              {detailItem.note && (
                <div className="py-1.5">
                  <span className="text-slate-500 font-medium block mb-1">Note:</span>
                  <p className="bg-slate-50 p-2 rounded-lg text-slate-700">{detailItem.note}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
