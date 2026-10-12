"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { useStaffAuth } from "@/context/AuthContext";
import {
  Wrench,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Users,
  Search,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  Layers,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { exportToCsv } from "@/lib/export-utils";
import { useRouter } from "next/navigation";

interface TechnicianSummaryRow {
  technicianId: string;
  technicianName: string;
  phone?: string;
  branchName: string;
  servicesCount: number;
  collection: number;
  materialCost: number;
  profit: number;
  profitShare?: number;
  ownerProfit?: number;
}

interface CollectionMethodItem {
  method: string;
  amount: number;
  count: number;
}

interface GlobalServiceReportData {
  summary: {
    totalServices: number;
    totalCollection: number;
    totalMaterialCost: number;
    grossProfit: number;
    ownerProfit: number;
    totalTechProfitShare: number;
  };
  collectionMethods: CollectionMethodItem[];
  technicians: TechnicianSummaryRow[];
  rawJobsCount: number;
}

export default function ServiceSalesReportPage() {
  const { setTitle, setBadge, dateFilter } = useAdminPage();
  const { user } = useStaffAuth();
  const router = useRouter();

  const roleName = user?.role?.name?.toLowerCase() || "";
  const isTechnician = roleName.includes("technician");

  // Filters State
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  // Data States
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<GlobalServiceReportData | null>(null);

  useEffect(() => {
    setTitle("Service Sales Report");
    setBadge("Admin Summary");
  }, [setTitle, setBadge]);

  // If a technician somehow lands here, redirect to their dedicated servicing report
  useEffect(() => {
    if (isTechnician) {
      router.replace("/admin/technician/servicing-report");
    }
  }, [isTechnician, router]);

  // Sync date filter with topbar if custom date range is empty
  useEffect(() => {
    if (!dateFrom && !dateTo && dateFilter) {
      const now = new Date();
      if (dateFilter === "Today") {
        const d = now.toISOString().slice(0, 10);
        setDateFrom(d);
        setDateTo(d);
      } else if (dateFilter === "This Week") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        setDateFrom(start.toISOString().slice(0, 10));
        setDateTo(now.toISOString().slice(0, 10));
      } else if (dateFilter === "This Month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setDateFrom(start.toISOString().slice(0, 10));
        setDateTo(now.toISOString().slice(0, 10));
      } else if (dateFilter === "This Year") {
        const start = new Date(now.getFullYear(), 0, 1);
        setDateFrom(start.toISOString().slice(0, 10));
        setDateTo(now.toISOString().slice(0, 10));
      }
    }
  }, [dateFilter]);

  const loadReport = useCallback(async () => {
    if (isTechnician) return;
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (search.trim()) params.search = search.trim();

      const data = await apiGet<GlobalServiceReportData>("/reports/service-global", params);
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load service report.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, search, isTechnician]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Filter technicians by search string
  const filteredTechnicians = useMemo(() => {
    if (!report?.technicians) return [];
    if (!search.trim()) return report.technicians;
    const q = search.toLowerCase();
    return report.technicians.filter(
      (t) =>
        t.technicianName?.toLowerCase().includes(q) ||
        t.branchName?.toLowerCase().includes(q) ||
        t.phone?.includes(q)
    );
  }, [report, search]);

  // Aggregate totals across technicians
  const technicianTotals = useMemo(() => {
    return filteredTechnicians.reduce(
      (acc, t) => {
        acc.servicesCount += Number(t.servicesCount || 0);
        acc.collection += Number(t.collection || 0);
        acc.materialCost += Number(t.materialCost || 0);
        acc.profit += Number(t.profit || 0);
        return acc;
      },
      { servicesCount: 0, collection: 0, materialCost: 0, profit: 0 }
    );
  }, [filteredTechnicians]);

  // Standard collection methods mapping (Cash, bKash, Card, Bank Transfer, SSLCommerz)
  const collectionMethods = useMemo(() => {
    const defaultMethods = ["CASH", "BKASH", "CARD", "BANK_TRANSFER", "SSLCOMMERZ"];
    const returnedMap = new Map<string, { amount: number; count: number }>();

    if (report?.collectionMethods) {
      report.collectionMethods.forEach((cm) => {
        returnedMap.set(cm.method.toUpperCase(), {
          amount: Number(cm.amount || 0),
          count: Number(cm.count || 0),
        });
      });
    }

    return defaultMethods.map((m) => {
      const found = returnedMap.get(m) || { amount: 0, count: 0 };
      return {
        method: m.replace(/_/g, " "),
        amount: found.amount,
        count: found.count,
      };
    });
  }, [report]);

  const handleExportCsv = () => {
    if (!filteredTechnicians.length) {
      toast.info("No technician data to export.");
      return;
    }
    const filename = `service_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
    const headers = [
      "Technician Name",
      "Branch",
      "Services Count",
      "Collection (৳)",
      "Material Cost (৳)",
      "Profit (৳)",
    ];
    const rows = filteredTechnicians.map((t) => [
      t.technicianName,
      t.branchName,
      t.servicesCount,
      t.collection,
      t.materialCost,
      t.profit,
    ]);
    // Append Total Row
    rows.push([
      "TOTAL",
      "",
      technicianTotals.servicesCount,
      technicianTotals.collection,
      technicianTotals.materialCost,
      technicianTotals.profit,
    ]);
    exportToCsv(filename, headers, rows);
    toast.success("Service report exported successfully.");
  };

  const handlePrint = () => {
    window.print();
  };

  if (isTechnician) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="font-semibold text-slate-800">Technician Scoped Access</p>
        <p className="text-xs text-slate-400">Redirecting to your personal Servicing Report...</p>
      </div>
    );
  }

  const periodLabel = useMemo(() => {
    if (dateFrom && dateTo) {
      return `${dateFrom} to ${dateTo}`;
    }
    return dateFilter || "This Month";
  }, [dateFrom, dateTo, dateFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold px-2.5 py-0.5">
              Shop-Wide Servicing Summary
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Global / Branch Admin View</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Service Sales Report</h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of completed services, collection methods breakdown, and technician performance for{" "}
            <span className="font-semibold text-slate-700">{periodLabel}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs border-slate-300 gap-1.5 text-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs border-slate-300 gap-1.5 text-emerald-700 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={loadReport}
            disabled={isLoading}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date & Search Filter Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end print:hidden">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">From Date</label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 pl-8 text-xs bg-white border-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">To Date</label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 pl-8 text-xs bg-white border-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Search Technician</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Filter by name, branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-white border-slate-200"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setSearch("");
            }}
            className="text-xs text-slate-500 hover:text-slate-800 h-8 flex-1"
          >
            Clear Filters
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={loadReport}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white h-8 px-4"
          >
            Filter
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards: Total Services count, Collection, Material, Profit */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Services Count */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Services</span>
              <Wrench className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-700 mt-2">
              {Number(report?.summary?.totalServices || technicianTotals.servicesCount).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Completed servicing jobs</div>
          </CardContent>
        </Card>

        {/* Card 2: Total Collection */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Collection</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-2">
              ৳{Number(report?.summary?.totalCollection || technicianTotals.collection).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Gross billings across all jobs</div>
          </CardContent>
        </Card>

        {/* Card 3: Material Cost */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wider">Material Cost</span>
              <Layers className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-800 mt-2">
              ৳{Number(report?.summary?.totalMaterialCost || technicianTotals.materialCost).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Hardware parts sourced</div>
          </CardContent>
        </Card>

        {/* Card 4: Profit (Collection - Material) */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Profit</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
              ৳{Number(report?.summary?.grossProfit || technicianTotals.profit).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Net servicing labor margin</div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Methods Breakdown: totals per payment method (Cash, bKash, Card, Bank Transfer, SSLCommerz) */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Collection Methods Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Settled payments across Cash, bKash, Card, Bank Transfer, and SSLCommerz
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {collectionMethods.map((cm) => (
              <div
                key={cm.method}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-center hover:bg-white hover:shadow-xs transition-all"
              >
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {cm.method}
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                  ৳{cm.amount.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {cm.count} transaction(s)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technician Service Report List */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Technician Service Report
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Summary of services completed, collections, parts cost, and profit per technician
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {filteredTechnicians.length} technician(s)
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-center">Services Count</th>
                  <th className="py-3 px-4 text-right">Collection (৳)</th>
                  <th className="py-3 px-4 text-right">Material (৳)</th>
                  <th className="py-3 px-4 text-right">Profit (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      Loading technician reports...
                    </td>
                  </tr>
                ) : filteredTechnicians.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No technician service records found in this period.
                    </td>
                  </tr>
                ) : (
                  filteredTechnicians.map((t) => (
                    <tr key={t.technicianId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div>{t.technicianName}</div>
                        {t.phone && <div className="text-[10px] text-slate-400 font-mono">{t.phone}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.branchName || "Main"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {t.servicesCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ৳{Number(t.collection || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700">
                        ৳{Number(t.materialCost || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ৳{Number(t.profit || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredTechnicians.length > 0 && (
                <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                  <tr>
                    <td className="py-3.5 px-4 uppercase tracking-wider text-slate-700">Total</td>
                    <td className="py-3.5 px-4 text-slate-400">—</td>
                    <td className="py-3.5 px-4 text-center font-mono text-purple-700">
                      {technicianTotals.servicesCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-800">
                      ৳{technicianTotals.collection.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-800">
                      ৳{technicianTotals.materialCost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-800">
                      ৳{technicianTotals.profit.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
