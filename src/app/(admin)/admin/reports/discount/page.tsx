"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable } from "@/components/admin/DataTable";
import { ReportExportButtons } from "@/components/admin/ReportExportButtons";
import { FilterConfig } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Tag, Percent, Receipt } from "lucide-react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export-utils";

interface DiscountOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  branch: string;
  orderTotal: number;
  discount: number;
  discountPercentage: number;
  promoCode: string;
  createdAt: string;
}

export default function DiscountReport() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<DiscountOrderItem[]>([]);
  const [summary, setSummary] = useState({ totalDiscountGiven: 0, ordersWithDiscountCount: 0, avgDiscountPercentage: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    setTitle("Discount Report");
    setBadge("Website");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    apiGet<any[]>("/branches/public")
      .then((res) => {
        if (Array.isArray(res)) setBranches(res);
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};

      if (filters.branch) params.branch = filters.branch;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiGet<{
        ordersWithDiscount: DiscountOrderItem[];
        summary: { totalDiscountGiven: number; ordersWithDiscountCount: number; avgDiscountPercentage: number };
      }>("/reports/discount", params);

      setData(res?.ordersWithDiscount || []);
      if (res?.summary) setSummary(res.summary);
    } catch (err: any) {
      toast.error(err.message || "Failed to load discount report");
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
      label: "Branch",
      key: "branch",
      options: branches.map((b) => ({ label: b.name, value: b.id })),
    },
  ], [branches]);

  const columns: ColumnDef<DiscountOrderItem>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order Code",
      cell: ({ row }) => (
        <Link 
          href={`/admin/sales/orders/${row.original.id}`}
          className="font-mono font-bold text-emerald-600 hover:underline"
        >
          {row.original.orderNumber}
        </Link>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-slate-600 text-sm whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800 leading-tight">
            {row.original.customerName}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {row.original.customerPhone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => <span className="text-slate-600 text-sm">{row.original.branch}</span>,
    },
    {
      accessorKey: "orderTotal",
      header: "Final Total",
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 text-sm">
          ৳{row.original.orderTotal.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "discount",
      header: "Discount Applied",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-600">
            -৳{row.original.discount.toLocaleString()}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            ({row.original.discountPercentage}%)
          </span>
        </div>
      ),
    },
    {
      accessorKey: "promoCode",
      header: "Promo / Type",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
          {row.original.promoCode}
        </span>
      ),
    },
  ];

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.info("No discount data available to export");
      return;
    }
    const headers = [
      "Order Code",
      "Date",
      "Customer Name",
      "Customer Phone",
      "Branch",
      "Final Total (BDT)",
      "Discount Applied (BDT)",
      "Discount %",
      "Promo / Type",
    ];
    const rows = data.map((d) => [
      d.orderNumber,
      new Date(d.createdAt).toLocaleDateString("en-GB"),
      d.customerName,
      d.customerPhone,
      d.branch,
      d.orderTotal,
      d.discount,
      d.discountPercentage,
      d.promoCode,
    ]);
    exportToCsv("discount-report", headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <FilterBar 
          searchPlaceholder="Search by order code, customer..."
          filters={filterConfigs}
          onSearchChange={(val) => setSearchQuery(val)}
          onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
          onReset={() => {
            setSearchQuery("");
            setFilters({});
          }}
          className="flex-1"
        />
        <ReportExportButtons onExportCsv={handleExport} filename="discount-report" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Discounts Given</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">৳{summary.totalDiscountGiven.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discounted Orders</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{summary.ordersWithDiscountCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Discount Rate</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.avgDiscountPercentage}%</p>
          </div>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        pageSize={10}
      />

    </div>
  );
}
