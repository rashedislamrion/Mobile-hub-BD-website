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

interface ExpenseCategoryRecord {
  id: string;
  name: string;
  icon?: string | null;
  monthlyBudget?: number | string | null;
  thisMonthSpend?: number;
  _count?: { expenses: number };
}

export default function ExpenseCategoriesPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<ExpenseCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryRecord | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    setTitle("Expense Categories");
    setBadge("Accounting");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet<ExpenseCategoryRecord[]>("/expense-categories");
      setData(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load expense categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (cat?: ExpenseCategoryRecord) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
    } else {
      setEditingCategory(null);
      setName("");
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      if (editingCategory) {
        await apiPatch(`/expense-categories/${editingCategory.id}`, {
          name: name.trim(),
        });
        toast.success("Category updated successfully");
      } else {
        await apiPost("/expense-categories", {
          name: name.trim(),
        });
        toast.success("Category created successfully");
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense category?")) return;
    try {
      await apiDelete(`/expense-categories/${id}`);
      toast.success("Category deleted successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
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

  const columns: ColumnDef<ExpenseCategoryRecord>[] = [
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
          <h2 className="text-lg font-bold text-slate-900">Expense Categories</h2>
          <p className="text-xs text-slate-500 mt-0.5">Classification headers for operating costs and bills</p>
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
              {editingCategory ? "Edit Expense Category" : "Create Expense Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Name *
              </label>
              <Input
                placeholder="e.g. Office Rent, Utilities, Courier"
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
