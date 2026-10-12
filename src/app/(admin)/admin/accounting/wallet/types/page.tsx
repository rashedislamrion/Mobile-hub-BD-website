"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Building,
  Layers,
  TrendingUp,
  Search,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { WALLET_PRESET_ICONS, getWalletIconComponent } from "@/components/admin/WalletIconHelper";

interface WalletRecord {
  id: string;
  name: string;
  kind: "CASH" | "BANK" | "MOBILE_BANKING";
  accountNumber?: string | null;
  icon?: string | null;
  isActive: boolean;
  currentBalance: number | string;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  status: string;
  _count?: { transactions: number; expenses: number; supplierPayments: number };
}

interface SummaryData {
  totalWallets: number;
  totalLiquidity: number;
  highestBalance: number;
}

export default function AllWalletsPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<WalletRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalWallets: 0,
    totalLiquidity: 0,
    highestBalance: 0,
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletRecord | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    accountNumber: "",
    kind: "BANK" as "CASH" | "BANK" | "MOBILE_BANKING",
    icon: "bank",
    branchId: "",
    initialBalance: 0,
    isActive: true,
  });

  useEffect(() => {
    setTitle("All Wallets");
    setBadge("Accounting");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [walletRes, summaryRes, branchRes] = await Promise.all([
        apiGet<WalletRecord[]>("/wallet-types"),
        apiGet<SummaryData>("/wallet-types/summary").catch(() => null),
        apiGet<{ data: any[] }>("/branches").catch(() => null),
      ]);

      const walletsList = Array.isArray(walletRes) ? walletRes : [];
      setData(walletsList);

      if (summaryRes && typeof summaryRes.totalWallets === "number") {
        setSummary(summaryRes);
      } else {
        // Fallback compute locally
        const totalWallets = walletsList.length;
        const totalLiquidity = walletsList.reduce((sum, w) => sum + Number(w.currentBalance || 0), 0);
        const highestBalance = walletsList.reduce((max, w) => Math.max(max, Number(w.currentBalance || 0)), 0);
        setSummary({ totalWallets, totalLiquidity, highestBalance });
      }

      if (branchRes?.data && Array.isArray(branchRes.data)) {
        setBranches(branchRes.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load wallets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setData((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isActive: !currentStatus } : w))
      );
      await apiPatch(`/wallet-types/${id}/toggle-active`, {});
      toast.success("Wallet active state updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle wallet active state");
      loadData();
    }
  };

  const handleOpenDialog = (wallet?: WalletRecord) => {
    if (wallet) {
      setEditingWallet(wallet);
      setFormData({
        name: wallet.name,
        accountNumber: wallet.accountNumber || "",
        kind: wallet.kind,
        icon: wallet.icon || "bank",
        branchId: wallet.branchId || "",
        initialBalance: Number(wallet.currentBalance),
        isActive: wallet.isActive !== false,
      });
    } else {
      setEditingWallet(null);
      setFormData({
        name: "",
        accountNumber: "",
        kind: "BANK",
        icon: "bank",
        branchId: "",
        initialBalance: 0,
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a wallet name");
      return;
    }

    try {
      if (editingWallet) {
        await apiPatch(`/wallet-types/${editingWallet.id}`, {
          name: formData.name.trim(),
          accountNumber: formData.accountNumber.trim() || null,
          kind: formData.kind,
          icon: formData.icon,
          branchId: formData.branchId || null,
          isActive: formData.isActive,
        });
        toast.success("Wallet updated successfully");
      } else {
        await apiPost("/wallet-types", {
          name: formData.name.trim(),
          accountNumber: formData.accountNumber.trim() || null,
          kind: formData.kind,
          icon: formData.icon,
          branchId: formData.branchId || null,
          initialBalance: Number(formData.initialBalance || 0),
          isActive: formData.isActive,
        });
        toast.success("New wallet created successfully");
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save wallet");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/wallet-types/${id}`);
      toast.success("Wallet removed successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete wallet");
    }
  };

  // Filtered Wallets
  const filteredData = useMemo(() => {
    return data.filter((w) => {
      const matchSearch =
        !searchQuery.trim() ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.accountNumber && w.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBranch =
        branchFilter === "ALL" ||
        (branchFilter === "NONE" ? !w.branchId : w.branchId === branchFilter);

      const matchType = typeFilter === "ALL" || w.kind === typeFilter;

      return matchSearch && matchBranch && matchType;
    });
  }, [data, searchQuery, branchFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Wallets */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Wallets
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary.totalWallets}
            </p>
            <span className="text-xs text-slate-400 mt-0.5 block">Configured accounts</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total Liquidity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Liquidity
            </span>
            <p className={`text-2xl font-extrabold mt-1 ${
              Number(summary.totalLiquidity) < 0 ? "text-rose-600" : "text-emerald-700"
            }`}>
              ৳{Number(summary.totalLiquidity).toLocaleString()}
            </p>
            <span className="text-xs text-slate-400 mt-0.5 block">Sum across active wallets</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Highest Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Highest Balance
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              ৳{Number(summary.highestBalance).toLocaleString()}
            </p>
            <span className="text-xs text-slate-400 mt-0.5 block">Top single account</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action and Filter Row */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search wallet name or A/C..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs font-medium bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>

          {/* All Branches Select */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            <option value="NONE">Headquarters / Unassigned</option>
          </select>

          {/* All Types Select */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Types</option>
            <option value="BANK">Bank Account</option>
            <option value="CASH">Cash Drawer</option>
            <option value="MOBILE_BANKING">Mobile Banking</option>
          </select>

          {/* Reset Button */}
          {(searchQuery || branchFilter !== "ALL" || typeFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setBranchFilter("ALL");
                setTypeFilter("ALL");
              }}
              className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New
        </button>
      </div>

      {/* 3-Column Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
          No wallets found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((wallet) => {
            const balance = Number(wallet.currentBalance || 0);
            const isNegative = balance < 0;

            return (
              <div
                key={wallet.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                {/* Card Header: A/C and Actions */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[11px] font-mono font-medium text-slate-500">
                      A/C: {wallet.accountNumber || "--"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={wallet.isActive !== false}
                        onCheckedChange={() => handleToggleActive(wallet.id, wallet.isActive !== false)}
                        className="scale-90"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => handleOpenDialog(wallet)}
                            className="text-xs font-semibold flex items-center gap-2 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit Wallet
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(wallet.id)}
                            className="text-xs font-semibold text-rose-600 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Card Body: Name + Kind Tag + Branch */}
                  <div className="pt-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-700 shrink-0">
                        {getWalletIconComponent(wallet.icon, wallet.kind, "w-5 h-5")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-base truncate">
                          {wallet.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {wallet.kind.replace("_", " ")}
                          </span>
                          {wallet.branch?.name && (
                            <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                              <Building className="w-3 h-3" />
                              {wallet.branch.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Balance */}
                <div className="pt-4 mt-2 flex items-baseline justify-between border-t border-slate-50">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Balance
                  </span>
                  <div className={`text-xl font-extrabold tracking-tight ${
                    isNegative ? "text-rose-600" : "text-slate-900"
                  }`}>
                    {isNegative ? `-৳${Math.abs(balance).toLocaleString()}` : `৳${balance.toLocaleString()}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingWallet ? "Edit Wallet" : "Create New Wallet"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Wallet Name *
              </label>
              <Input
                placeholder="e.g. City Bank Primary A/C"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Account Number
                </label>
                <Input
                  placeholder="e.g. 205012345678"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="h-10 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Wallet Kind *
                </label>
                <select
                  value={formData.kind}
                  onChange={(e) => setFormData({ ...formData, kind: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:border-emerald-500"
                >
                  <option value="BANK">Bank Account</option>
                  <option value="CASH">Cash Drawer</option>
                  <option value="MOBILE_BANKING">Mobile Banking</option>
                </select>
              </div>
            </div>

            {/* Select Icon Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Select Icon
              </label>
              <div className="grid grid-cols-4 gap-2">
                {WALLET_PRESET_ICONS.map((preset) => {
                  const IconC = preset.icon;
                  const isSelected = formData.icon === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: preset.id })}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/70 text-emerald-700 font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <IconC className="w-4 h-4" />
                      <span className="text-[10px] truncate max-w-full">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Branch (Optional) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Branch (Optional)
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:border-emerald-500"
              >
                <option value="">Headquarters / No Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {!editingWallet && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Opening Balance (৳)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.initialBalance || ""}
                  onChange={(e) => setFormData({ ...formData, initialBalance: Number(e.target.value) })}
                  className="h-10 text-xs font-bold text-emerald-700"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-800">Active Wallet Account</span>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
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
                onClick={handleSave}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                {editingWallet ? "Save Changes" : "Create Wallet"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
