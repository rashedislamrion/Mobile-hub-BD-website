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

interface PurposeRecord {
  id: string;
  name: string;
  category: "INCOME" | "EXPENSE";
  _count?: { transactions: number };
}

// Color palette for initial-letter circular badge
const BADGE_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-teal-100 text-teal-700 border-teal-200",
];

function getBadgeColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

export default function PurposePage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<PurposeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPurpose, setEditingPurpose] = useState<PurposeRecord | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    setTitle("Purposes");
    setBadge("Accounting");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet<PurposeRecord[]>("/purposes");
      setData(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load purposes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (purpose?: PurposeRecord) => {
    if (purpose) {
      setEditingPurpose(purpose);
      setName(purpose.name);
    } else {
      setEditingPurpose(null);
      setName("");
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a purpose name");
      return;
    }

    try {
      if (editingPurpose) {
        await apiPatch(`/purposes/${editingPurpose.id}`, {
          name: name.trim(),
        });
        toast.success("Purpose updated successfully");
      } else {
        await apiPost("/purposes", {
          name: name.trim(),
          category: "EXPENSE",
        });
        toast.success("Purpose created successfully");
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save purpose");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purpose?")) return;
    try {
      await apiDelete(`/purposes/${id}`);
      toast.success("Purpose deleted successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete purpose");
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

  const columns: ColumnDef<PurposeRecord>[] = [
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
      cell: ({ row }) => {
        const initialLetter = (row.original.name || "P").trim().charAt(0).toUpperCase();
        const colorClass = getBadgeColor(row.original.name);

        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${colorClass}`}>
              {initialLetter}
            </div>
            <span className="font-bold text-slate-800 text-xs">
              {row.original.name}
            </span>
          </div>
        );
      },
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
          <h2 className="text-lg font-bold text-slate-900">Purposes</h2>
          <p className="text-xs text-slate-500 mt-0.5">Classification tags for deposits and fund allocations</p>
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
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingPurpose ? "Edit Purpose" : "Create Purpose"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Purpose Name *
              </label>
              <Input
                placeholder="e.g. B2B, Bank Withdrawal, Balance Adjustment"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-xs font-medium"
              />
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
