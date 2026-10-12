"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable } from "@/components/admin/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, ArrowRight, ArrowLeftRight, Building } from "lucide-react";
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

interface TransferRecord {
  id: string;
  transferGroupId: string;
  referenceNo: string;
  amount: number | string;
  createdAt: string;
  note: string | null;
  transferType: "INTERNAL" | "BRANCH";
  targetBranch?: { id: string; name: string } | null;
  sourceWallet?: { id: string; name: string; kind: string; icon?: string; currentBalance?: number | string };
  targetWallet?: { id: string; name: string; kind: string; icon?: string; currentBalance?: number | string };
  recordedBy?: { id: string; name: string };
}

export default function FundTransfersPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [wallets, setWallets] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferTab, setTransferTab] = useState<"internal" | "branch">("internal");
  const [sourceWalletId, setSourceWalletId] = useState("");
  const [targetBranchId, setTargetBranchId] = useState("");
  const [targetWalletId, setTargetWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Fund Transfers");
    setBadge("Accounting");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    Promise.all([
      apiGet<any[]>("/wallet-types"),
      apiGet<{ data: any[] }>("/branches").catch(() => null),
    ])
      .then(([walletRes, branchRes]) => {
        if (Array.isArray(walletRes)) {
          setWallets(walletRes);
          if (walletRes.length > 0) {
            setSourceWalletId(walletRes[0].id);
          }
          if (walletRes.length > 1) {
            setTargetWalletId(walletRes[1].id);
          }
        }
        if (branchRes?.data && Array.isArray(branchRes.data)) {
          setBranches(branchRes.data);
        }
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet<{ data: TransferRecord[] }>("/wallet-transactions/transfers");
      setData(res?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transfer history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Branch tab filtered target wallets
  const branchFilteredWallets = useMemo(() => {
    if (!targetBranchId) return [];
    return wallets.filter((w) => w.branchId === targetBranchId && w.id !== sourceWalletId);
  }, [wallets, targetBranchId, sourceWalletId]);

  // Handle source wallet balance check
  const sourceWallet = wallets.find((w) => w.id === sourceWalletId);
  const sourceBalance = Number(sourceWallet?.currentBalance || 0);

  const handleOpenTransferDialog = () => {
    setTransferTab("internal");
    setAmount("");
    setNote("");
    setTargetBranchId("");
    if (wallets.length > 0) {
      setSourceWalletId(wallets[0].id);
      const second = wallets.find((w) => w.id !== wallets[0].id);
      if (second) setTargetWalletId(second.id);
    }
    setDialogOpen(true);
  };

  const handleTransfer = async () => {
    if (!sourceWalletId) {
      toast.error("Please select a source wallet");
      return;
    }
    if (!targetWalletId) {
      toast.error("Please select a target wallet");
      return;
    }
    if (sourceWalletId === targetWalletId) {
      toast.error("Source and target wallets must be different");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid transfer amount");
      return;
    }
    if (numAmount > sourceBalance) {
      toast.error(`Insufficient balance in source wallet (Available: ৳${sourceBalance.toLocaleString()})`);
      return;
    }

    try {
      setIsSubmitting(true);
      await apiPost("/wallet-transactions/transfer", {
        sourceWalletId,
        targetWalletId,
        targetBranchId: transferTab === "branch" && targetBranchId ? targetBranchId : undefined,
        amount: numAmount,
        note: note.trim() || undefined,
      });

      toast.success(`Successfully transferred ৳${numAmount.toLocaleString()}`);
      setDialogOpen(false);
      loadData();

      // Refresh wallet balances
      apiGet<any[]>("/wallet-types").then((res) => {
        if (Array.isArray(res)) setWallets(res);
      }).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || "Failed to process transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<TransferRecord>[] = [
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
      accessorKey: "sourceWallet",
      header: "SOURCE WALLET",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            {getWalletIconComponent(row.original.sourceWallet?.icon, row.original.sourceWallet?.kind, "w-3.5 h-3.5")}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-xs leading-tight">
              {row.original.sourceWallet?.name || "Source Account"}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">
              {row.original.sourceWallet?.kind?.replace("_", " ")}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "transferType",
      header: "TRANSFER TYPE",
      cell: ({ row }) => {
        const isBranch = Boolean(row.original.targetBranch?.name);
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            {isBranch ? (
              <>
                <Building className="w-3 h-3 text-slate-500" />
                {row.original.targetBranch?.name}
              </>
            ) : (
              "Internal Transfer"
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "targetWallet",
      header: "TARGET WALLET",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            {getWalletIconComponent(row.original.targetWallet?.icon, row.original.targetWallet?.kind, "w-3.5 h-3.5")}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-xs leading-tight">
              {row.original.targetWallet?.name || "Target Account"}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 uppercase">
              {row.original.targetWallet?.kind?.replace("_", " ")}
            </span>
          </div>
        </div>
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
          {row.original.note || "--"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Fund Transfers</h2>
          <p className="text-xs text-slate-500 mt-0.5">Move balances seamlessly across accounts and branch wallets</p>
        </div>
        <button
          onClick={handleOpenTransferDialog}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      <DataTable columns={columns} data={data} pageSize={10} />

      {/* Fund Transfer Dialog with 2-tab toggle */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
              Fund Transfer
            </DialogTitle>
          </DialogHeader>

          {/* 2-Tab Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 mt-2">
            <button
              type="button"
              onClick={() => {
                setTransferTab("internal");
                if (wallets.length > 1) {
                  const target = wallets.find((w) => w.id !== sourceWalletId);
                  if (target) setTargetWalletId(target.id);
                }
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                transferTab === "internal"
                  ? "bg-white text-emerald-800 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Internal
            </button>
            <button
              type="button"
              onClick={() => {
                setTransferTab("branch");
                setTargetWalletId("");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                transferTab === "branch"
                  ? "bg-white text-emerald-800 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Branch
            </button>
          </div>

          <div className="space-y-4 pt-3">
            {/* Source Wallet */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Source Wallet *
              </label>
              <select
                value={sourceWalletId}
                onChange={(e) => setSourceWalletId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-emerald-500"
                required
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Bal: ৳{Number(w.currentBalance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* If Branch tab: Target Branch */}
            {transferTab === "branch" && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Branch *
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => {
                    setTargetBranchId(e.target.value);
                    setTargetWalletId("");
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Target Branch...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Wallet */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Target Wallet *
              </label>
              {transferTab === "internal" ? (
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Target Wallet...</option>
                  {wallets
                    .filter((w) => w.id !== sourceWalletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Bal: ৳{Number(w.currentBalance).toLocaleString()})
                      </option>
                    ))}
                </select>
              ) : (
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  disabled={!targetBranchId}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                  required
                >
                  <option value="">
                    {targetBranchId ? "Select Branch Wallet..." : "First select a branch above"}
                  </option>
                  {branchFilteredWallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Bal: ৳{Number(w.currentBalance).toLocaleString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Amount *
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Max: ৳{sourceBalance.toLocaleString()}
                </span>
              </div>
              <Input
                type="number"
                min="1"
                max={sourceBalance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 text-sm font-bold text-emerald-700 rounded-xl"
                required
              />
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Note (Optional)
              </label>
              <Textarea
                placeholder="Transfer remarks / purpose..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none h-18 text-xs rounded-xl"
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
                disabled={isSubmitting}
                onClick={handleTransfer}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                {isSubmitting ? "Processing..." : "Transfer"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
