"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable } from "@/components/admin/DataTable";
import { ReportExportButtons } from "@/components/admin/ReportExportButtons";
import { FilterConfig } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Package, DollarSign, TrendingUp, Tag, Star } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiGet } from "@/lib/api-client";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductAnalyticsRecord {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  rating: number;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
  currentStock: number;
  revenueContributionPct: number;
}

export default function ProductAnalyticsReport() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<ProductAnalyticsRecord[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const [branches, setBranches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    setTitle("Product Analytics Report");
    setBadge("Website");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    Promise.all([
      apiGet<any[]>("/branches/public"),
      apiGet<any[]>("/categories/tree"),
    ])
      .then(([branchRes, catRes]) => {
        if (Array.isArray(branchRes)) setBranches(branchRes);
        if (Array.isArray(catRes)) setCategories(catRes);
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};

      if (filters.branch) params.branch = filters.branch;
      if (filters.category) params.category = filters.category;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiGet<{
        topProducts: ProductAnalyticsRecord[];
        categoryTrends: any[];
      }>("/reports/product-analytics", params);

      setData(res?.topProducts || []);
      setCategoryTrends(res?.categoryTrends || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load product analytics report");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived KPIs
  const totalRevenue = data.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalUnitsSold = data.reduce((sum, p) => sum + p.totalSold, 0);
  const totalProfit = data.reduce((sum, p) => sum + p.totalProfit, 0);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      type: "select",
      label: "Branch",
      key: "branch",
      options: branches.map((b) => ({ label: b.name, value: b.id })),
    },
    {
      type: "select",
      label: "Category",
      key: "category",
      options: categories.map((c) => ({ label: c.name, value: c.id })),
    },
  ], [branches, categories]);

  const columns: ColumnDef<ProductAnalyticsRecord>[] = [
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            {row.original.name}
            {row.original.rating > 0 && (
              <span className="flex items-center text-xs text-amber-500 font-normal">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" /> {row.original.rating}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {row.original.brand} • {row.original.category}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "totalSold",
      header: "Units Sold",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-700">
          {row.original.totalSold.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "currentStock",
      header: "Current Stock",
      cell: ({ row }) => (
        <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
          row.original.currentStock < 10 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
        }`}>
          {row.original.currentStock} in stock
        </span>
      ),
    },
    {
      accessorKey: "totalRevenue",
      header: "Revenue Generated",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">
          ৳{row.original.totalRevenue.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "totalProfit",
      header: "Est. Gross Profit",
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-600">
          ৳{row.original.totalProfit.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "revenueContributionPct",
      header: "Share of Rev",
      cell: ({ row }) => (
        <div className="w-24">
          <div className="flex justify-between text-xs mb-1 font-medium">
            <span>{row.original.revenueContributionPct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full" 
              style={{ width: `${Math.min(100, row.original.revenueContributionPct)}%` }}
            />
          </div>
        </div>
      ),
    },
  ];

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.info("No product analytics data available to export");
      return;
    }
    const headers = [
      "Product Name",
      "Category",
      "Brand",
      "Rating",
      "Total Units Sold",
      "Total Revenue (BDT)",
      "Total Profit (BDT)",
      "Current Stock",
      "Revenue Contribution %",
    ];
    const rows = data.map((d) => [
      d.name,
      d.category,
      d.brand,
      d.rating,
      d.totalSold,
      d.totalRevenue,
      d.totalProfit,
      d.currentStock,
      d.revenueContributionPct,
    ]);
    exportToCsv("product-analytics-report", headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <FilterBar 
          searchPlaceholder="Search product by name, brand..."
          filters={filterConfigs}
          onSearchChange={(val) => setSearchQuery(val)}
          onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
          onReset={() => {
            setSearchQuery("");
            setFilters({});
          }}
          className="flex-1"
        />
        <ReportExportButtons onExportCsv={handleExport} filename="product-analytics-report" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales Revenue</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">৳{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Units Dispatched</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalUnitsSold.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Gross Margin</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">৳{totalProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Category Performance Trends Chart */}
      {categoryTrends.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Category Sales Performance Trend</h3>
            <p className="text-xs text-slate-400">Monthly breakdown of units sold across top product categories</p>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Smartphones" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Accessories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Audio" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Laptops" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Table */}
      <DataTable 
        columns={columns} 
        data={data} 
        pageSize={10}
      />

    </div>
  );
}
