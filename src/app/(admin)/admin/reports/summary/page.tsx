"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { ReportExportButtons } from "@/components/admin/ReportExportButtons";
import { ColoredStatCard } from "@/components/admin/ColoredStatCard";
import { FilterConfig } from "@/types/table";
import { ShoppingCart, Wrench, Receipt, ShoppingBag, Package, AlertCircle, TrendingUp, Layers, CheckCircle2, Clock } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function SummaryReport() {
  const { setTitle, setBadge, setDateFilter, selectedBranchId } = useAdminPage();
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [branches, setBranches] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTitle("Summary Report");
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
      const branchToFilter = filters.branch || selectedBranchId;
      if (branchToFilter) params.branch = branchToFilter;

      const res = await apiGet<any>("/reports/summary", params);
      setSummaryData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load summary report");
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "branch",
        label: "Branch / Warehouse",
        type: "select",
        options: [
          { label: "All Outlets", value: "" },
          ...branches.map((b) => ({ label: b.name, value: b.id })),
        ],
      },
    ],
    [branches],
  );

  const formatCurrency = (val: any) => `৳${Number(val || 0).toLocaleString()}`;

  if (isLoading && !summaryData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const s = summaryData || {
    salesSummary: { totalSales: 0, totalOrders: 0, completedOrders: 0, totalDue: 0, totalDiscount: 0 },
    serviceSummary: { totalServiceRevenue: 0, totalJobs: 0, completedJobs: 0, pendingJobs: 0 },
    expenseSummary: { totalExpenses: 0, totalCount: 0, paidExpenses: 0, pendingExpenses: 0 },
    purchaseSummary: { totalPurchases: 0, totalPOs: 0, receivedPOs: 0, dueAmount: 0 },
  };

  return (
    <div className="space-y-8">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 w-full md:w-auto">
          <FilterBar
            filters={filterConfigs}
            onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
            onReset={() => setFilters({})}
          />
        </div>
        <div className="shrink-0 flex gap-2">
          <ReportExportButtons data={summaryData} filename="financial-summary-report" />
        </div>
      </div>

      {/* Sales Summary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-emerald-700" />
          <h2 className="text-lg font-bold text-slate-800">Sales & E-Commerce Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColoredStatCard
            label="Total Sales Value"
            value={formatCurrency(s.salesSummary.totalSales)}
            icon={<ShoppingCart className="w-5 h-5" />}
            colorTint="green"
          />
          <ColoredStatCard
            label="Total Orders"
            value={s.salesSummary.totalOrders}
            icon={<Package className="w-5 h-5" />}
            colorTint="blue"
          />
          <ColoredStatCard
            label="Customer Due"
            value={formatCurrency(s.salesSummary.totalDue)}
            icon={<AlertCircle className="w-5 h-5" />}
            colorTint="red"
          />
          <ColoredStatCard
            label="Total Discounts"
            value={formatCurrency(s.salesSummary.totalDiscount)}
            icon={<TrendingUp className="w-5 h-5" />}
            colorTint="yellow"
          />
        </div>
      </section>

      {/* Service / Repair Summary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-blue-700" />
          <h2 className="text-lg font-bold text-slate-800">Repair & Technical Services Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColoredStatCard
            label="Service Revenue"
            value={formatCurrency(s.serviceSummary.totalServiceRevenue)}
            icon={<Wrench className="w-5 h-5" />}
            colorTint="blue"
          />
          <ColoredStatCard
            label="Total Repair Tickets"
            value={s.serviceSummary.totalJobs}
            icon={<Layers className="w-5 h-5" />}
            colorTint="purple"
          />
          <ColoredStatCard
            label="Delivered Repairs"
            value={s.serviceSummary.completedJobs}
            icon={<CheckCircle2 className="w-5 h-5" />}
            colorTint="green"
          />
          <ColoredStatCard
            label="In Progress / Active"
            value={s.serviceSummary.pendingJobs}
            icon={<Clock className="w-5 h-5" />}
            colorTint="orange"
          />
        </div>
      </section>

      {/* Expense Summary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-rose-700" />
          <h2 className="text-lg font-bold text-slate-800">Operating Expenses & Disbursements</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColoredStatCard
            label="Total Spend"
            value={formatCurrency(s.expenseSummary.totalExpenses)}
            icon={<Receipt className="w-5 h-5" />}
            colorTint="red"
          />
          <ColoredStatCard
            label="Total Expense Entries"
            value={s.expenseSummary.totalCount}
            icon={<Layers className="w-5 h-5" />}
            colorTint="purple"
          />
          <ColoredStatCard
            label="Paid Out"
            value={formatCurrency(s.expenseSummary.paidExpenses)}
            icon={<CheckCircle2 className="w-5 h-5" />}
            colorTint="green"
          />
          <ColoredStatCard
            label="Pending Claims"
            value={formatCurrency(s.expenseSummary.pendingExpenses)}
            icon={<Clock className="w-5 h-5" />}
            colorTint="yellow"
          />
        </div>
      </section>

      {/* Purchase Summary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-800">Procurement & Inventory Purchase</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColoredStatCard
            label="Total PO Value"
            value={formatCurrency(s.purchaseSummary.totalPurchases)}
            icon={<ShoppingBag className="w-5 h-5" />}
            colorTint="teal"
          />
          <ColoredStatCard
            label="Purchase Orders"
            value={s.purchaseSummary.totalPOs}
            icon={<Package className="w-5 h-5" />}
            colorTint="blue"
          />
          <ColoredStatCard
            label="Supplier Payables Due"
            value={formatCurrency(s.purchaseSummary.dueAmount)}
            icon={<AlertCircle className="w-5 h-5" />}
            colorTint="red"
          />
        </div>
      </section>

    </div>
  );
}
