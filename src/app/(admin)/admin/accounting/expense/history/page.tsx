"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable } from "@/components/admin/DataTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { FilterConfig } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { apiGet } from "@/lib/api-client";
import { getWalletIconComponent } from "@/components/admin/WalletIconHelper";

interface ExpenseHistoryRecord {
  id: string;
  referenceNo: string;
  amount: number | string;
  description: string;
  date: string;
  status: string;
  branch?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  walletType?: { id: string; name: string; kind: string; icon?: string } | null;
}

export default function ExpenseHistoryPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<ExpenseHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    setTitle("Expense History");
    setBadge("Accounting");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    Promise.all([
      apiGet<any[]>("/expense-categories"),
      apiGet<{ data: any[] }>("/branches").catch(() => null),
    ])
      .then(([catRes, branchRes]) => {
        if (Array.isArray(catRes)) setCategories(catRes);
        if (branchRes?.data && Array.isArray(branchRes.data)) setBranches(branchRes.data);
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        limit: 100,
      };

      if (filters.category) params.category = filters.category;
      if (filters.branch) params.branch = filters.branch;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiGet<{ data: ExpenseHistoryRecord[] }>("/expenses", params);
      setData(res?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load expense history");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      type: "select",
      label: "All Branches",
      key: "branch",
      options: branches.map((b) => ({ label: b.name, value: b.id })),
    },
    {
      type: "select",
      label: "All Categories",
      key: "category",
      options: categories.map((c) => ({ label: c.name, value: c.id })),
    },
    {
      type: "dateRange",
      label: "Select Date Range",
      key: "dateRange",
    },
  ], [branches, categories]);

  const columns: ColumnDef<ExpenseHistoryRecord>[] = [
    {
      accessorKey: "date",
      header: "DATE",
      cell: ({ row }) => {
        const d = new Date(row.original.date);
        return (
          <span className="text-slate-700 whitespace-nowrap text-xs font-medium">
            {d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        );
      },
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
      accessorKey: "category",
      header: "CATEGORY",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
          {row.original.category?.name || "General Expense"}
        </span>
      ),
    },
    {
      accessorKey: "walletType",
      header: "WALLET",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            {getWalletIconComponent(row.original.walletType?.icon, row.original.walletType?.kind, "w-3.5 h-3.5")}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-xs leading-tight">
              {row.original.walletType?.name || "Direct Cash"}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">
              {row.original.walletType?.kind?.replace("_", " ") || "CASH"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "AMOUNT",
      cell: ({ row }) => (
        <span className="font-bold text-xs text-rose-600 whitespace-nowrap">
          -৳{Number(row.original.amount).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "NOTE",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block">
          {row.original.description || row.original.referenceNo || "--"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Expense History</h2>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive journal of recorded operational disbursements</p>
        </div>
      </div>

      {/* 4 Filters: search, branch, category, date range */}
      <FilterBar
        searchPlaceholder="Search by description or reference..."
        filters={filterConfigs}
        onSearchChange={(val) => setSearchQuery(val)}
        onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        onReset={() => {
          setSearchQuery("");
          setFilters({});
        }}
      />

      <DataTable columns={columns} data={data} pageSize={10} />
    </div>
  );
}
