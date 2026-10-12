"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable, ActionDropdown } from "@/components/admin/DataTable";
import { TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { WALLET_PRESET_ICONS, getWalletIconComponent } from "@/components/admin/WalletIconHelper";

interface LookupTypeRecord {
  id: string;
  name: string;
  kind: string;
  icon?: string | null;
  isActive: boolean;
  _count?: { transactions: number };
}

export default function WalletLookupTypesPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<LookupTypeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupTypeRecord | null>(null);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("bank");

  useEffect(() => {
    setTitle("Wallet Types");
    setBadge("Accounting");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet<LookupTypeRecord[]>("/wallet-types");
      setData(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load wallet types");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (item?: LookupTypeRecord) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setSelectedIcon(item.icon || "bank");
    } else {
      setEditingItem(null);
      setName("");
      setSelectedIcon("bank");
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a wallet type name");
      return;
    }

    try {
      if (editingItem) {
        await apiPatch(`/wallet-types/${editingItem.id}`, {
          name: name.trim(),
          icon: selectedIcon,
        });
        toast.success("Wallet type updated");
      } else {
        await apiPost("/wallet-types", {
          name: name.trim(),
          kind: "BANK",
          icon: selectedIcon,
          initialBalance: 0,
        });
        toast.success("Wallet type created");
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save wallet type");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/wallet-types/${id}`);
      toast.success("Wallet type deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete wallet type");
    }
  };

  const createActions = (): TableAction[] => [
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: (row) => handleOpenDialog(row),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      variant: "destructive",
      onClick: (row) => handleDelete(row.id),
    },
  ];

  const columns: ColumnDef<LookupTypeRecord>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-500 text-xs">
          {row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "NAME",
      cell: ({ row }) => (
        <span className="font-bold text-slate-800 text-sm">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "icon",
      header: "ICON",
      cell: ({ row }) => (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
          {getWalletIconComponent(row.original.icon, row.original.kind, "w-4 h-4")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "ACTION",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ActionDropdown actions={createActions()} rowData={row.original} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Wallet Types</h2>
          <p className="text-xs text-slate-500 mt-0.5">Catalog of payment method and institution categories</p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New
        </button>
      </div>

      <DataTable columns={columns} data={data} pageSize={10} />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingItem ? "Edit Wallet Type" : "Create Wallet Type"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Name *
              </label>
              <Input
                placeholder="e.g. Cash, Bank Transfer, DBBL"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Select Icon *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {WALLET_PRESET_ICONS.map((preset) => {
                  const IconC = preset.icon;
                  const isSelected = selectedIcon === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedIcon(preset.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-xs ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <IconC className="w-5 h-5" />
                      <span className="text-[10px] truncate max-w-full">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50 text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Submit
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
