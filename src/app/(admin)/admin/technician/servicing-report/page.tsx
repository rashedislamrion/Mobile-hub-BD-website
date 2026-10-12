"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { useStaffAuth } from "@/context/AuthContext";
import {
  Wrench,
  DollarSign,
  TrendingUp,
  Layers,
  Search,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { exportToCsv } from "@/lib/export-utils";

interface ServicingMaterialItem {
  id: string;
  partName: string;
  sourceType?: "OWN_STOCK" | "SUPPLIER" | "OTHER";
  sourcedFromName?: string | null;
  sourceNote?: string | null;
  cost: number | string;
  quantity: number;
  total: number | string;
  supplier?: {
    name: string;
  } | null;
}

interface ServicingJobItem {
  id: string;
  invoiceNo: string;
  serviceDetails: string;
  device: string;
  model?: string | null;
  customerName: string;
  customerPhone: string;
  totalCost: number;
  materialCost: number;
  profit: number;
  profitShare: number;
  materials?: ServicingMaterialItem[];
  status: string;
  createdAt: string;
}

interface ServicingReportData {
  technician: {
    id: string;
    name: string;
    branch: string;
    phone?: string;
    profitShareRate: number;
  };
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalJobs: number;
    completedJobs: number;
    totalCollection: number;
    totalMaterialCost: number;
    totalProfit: number;
    technicianEarnings: number;
    ownerProfit: number;
  };
  materialCost: number;
  profit: number;
  technicianShare: number;
  details: ServicingJobItem[];
}

export default function TechnicianServicingReportPage() {
  const { setTitle, setBadge, dateFilter } = useAdminPage();
  const { user } = useStaffAuth();

  // Filters State
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Data State
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<ServicingReportData | null>(null);

  useEffect(() => {
    setTitle("Servicing Report");
    setBadge("Financial");
  }, [setTitle, setBadge]);

  // Sync date filter with topbar if topbar period changes and custom dates are not set
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
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (search.trim()) params.search = search.trim();

      const data = await apiGet<ServicingReportData>("/reports/servicing-technician", params);
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load servicing report.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, search]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Filter details by status and search
  const filteredDetails = useMemo(() => {
    if (!report?.details) return [];
    return report.details.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const matchDevice = item.device?.toLowerCase().includes(s);
        const matchInvoice = item.invoiceNo?.toLowerCase().includes(s);
        const matchCustomer = item.customerName?.toLowerCase().includes(s);
        const matchDetails = item.serviceDetails?.toLowerCase().includes(s);
        return matchDevice || matchInvoice || matchCustomer || matchDetails;
      }
      return true;
    });
  }, [report, statusFilter, search]);

  // Calculate table totals from the filtered rows
  const tableTotals = useMemo(() => {
    return filteredDetails.reduce(
      (acc, j) => {
        acc.totalBill += Number(j.totalCost || 0);
        acc.materialCost += Number(j.materialCost || 0);
        acc.profit += Number(j.profit || 0);
        acc.yourProfit += Number(j.profitShare || 0);
        return acc;
      },
      { totalBill: 0, materialCost: 0, profit: 0, yourProfit: 0 }
    );
  }, [filteredDetails]);

  // Reference video exact calculation: 50% split of Profit
  const shareRate = report?.technician?.profitShareRate || 50;
  const exactYourProfit = Math.round(tableTotals.profit * (shareRate / 100));

  const handleExportCsv = () => {
    if (!filteredDetails.length) {
      toast.info("No servicing records to export.");
      return;
    }
    const filename = `my_servicing_report_${new Date().toISOString().slice(0, 10)}.csv`;
    const headers = [
      "Invoice / Code",
      "Date",
      "Device",
      "Details / Issue",
      "Total Bill (Cost)",
      "Material Cost",
      "Profit",
      "Your Profit (Share)",
      "Status",
    ];
    const rows = filteredDetails.map((j) => [
      j.invoiceNo,
      new Date(j.createdAt).toLocaleDateString("en-GB"),
      j.device,
      j.serviceDetails,
      j.totalCost,
      j.materialCost,
      j.profit,
      j.profitShare,
      j.status,
    ]);
    // Append Total Row
    rows.push([
      "TOTAL",
      "",
      "",
      "",
      tableTotals.totalBill,
      tableTotals.materialCost,
      tableTotals.profit,
      exactYourProfit,
      "",
    ]);
    exportToCsv(filename, headers, rows);
    toast.success("Servicing report exported successfully.");
  };

  const handlePrint = () => {
    window.print();
  };

  const periodLabel = useMemo(() => {
    if (dateFrom && dateTo) {
      return `${dateFrom} to ${dateTo}`;
    }
    return dateFilter || "This Month";
  }, [dateFrom, dateTo, dateFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 print:p-0">
      {/* Top Header matching reference video styling */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
              Technician Servicing Financial Report
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Real DB Aggregations</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {report?.technician?.name || user?.name || "Technician"} — Servicing Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Period: <span className="font-semibold text-slate-700">{periodLabel}</span> | Branch:{" "}
            <span className="font-semibold text-slate-700">{report?.technician?.branch || "Main"}</span> | Profit Share:{" "}
            <span className="font-semibold text-emerald-600">{shareRate}%</span>
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

      {/* Date Filter & Status Filter Bar */}
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
          <label className="text-xs font-semibold text-slate-600 block mb-1">Job Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 w-full"
          >
            <option value="ALL">All Statuses</option>
            <option value="DELIVERED">Completed / Delivered</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING">Pending</option>
          </select>
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
              setStatusFilter("ALL");
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

      {/* Two Summary Cards matching the Reference Video: Material Cost and Profit (+ Your Profit) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Material Cost */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-blue-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-xs font-bold uppercase tracking-wider">Material Cost</span>
              <div className="p-2 rounded-lg bg-blue-100/80">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-900 mt-3">
              ৳{tableTotals.materialCost.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sum of parts and hardware used for servicing jobs in this period
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Labor Profit (Total Bill - Material Cost) */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Servicing Profit</span>
              <div className="p-2 rounded-lg bg-emerald-100/80">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-700 mt-3">
              ৳{tableTotals.profit.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Formula: <code className="font-mono text-slate-600">Total Bill (৳{tableTotals.totalBill.toLocaleString()}) − Material Cost (৳{tableTotals.materialCost.toLocaleString()})</code>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Your Profit (50% Exact Share) */}
        <Card className="border-emerald-300 shadow-sm bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-emerald-100">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                Your Profit ({shareRate}%)
              </span>
              <div className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white">
                50/50 Split
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono text-white mt-3">
              ৳{exactYourProfit.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-100/90 mt-1">
              Your exact 50% commission share: <code className="font-mono">৳{tableTotals.profit.toLocaleString()} × 50% = ৳{exactYourProfit.toLocaleString()}</code>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* "My Servicing Details" Table matching reference video */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-600" />
              My Servicing Details
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Itemized service and repair records completed by {report?.technician?.name || "you"}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                placeholder="Search details, invoice, device..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {filteredDetails.length} record(s)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Cost (Total Bill)</th>
                  <th className="py-3 px-4 text-right">Material Cost</th>
                  <th className="py-3 px-4 text-right">Profit</th>
                  <th className="py-3 px-4 text-right">Your Share (50%)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      Loading servicing records...
                    </td>
                  </tr>
                ) : filteredDetails.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Wrench className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">No Servicing Details Found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        No jobs match the selected period or filters for this technician account.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDetails.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Details Column: Device, Model, Issue Description & Invoice */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2">
                          <Smartphone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {job.device} {job.model ? `(${job.model})` : ""}
                            </span>
                            <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                              {job.serviceDetails}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                #{job.invoiceNo}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {job.customerName} ({job.customerPhone})
                              </span>
                            </div>

                            {/* Parts Used with Source Type Badges & Notes */}
                            {job.materials && job.materials.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
                                <span className="text-[10px] font-semibold text-slate-500">Parts Used:</span>
                                {job.materials.map((m) => (
                                  <span
                                    key={m.id}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                                  >
                                    <span>{m.partName}</span>
                                    {m.sourceType === "OTHER" ? (
                                      <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded">
                                        Outside: {m.sourcedFromName || "Ad-hoc"}{m.sourceNote ? ` (${m.sourceNote})` : ""}
                                      </span>
                                    ) : m.sourceType === "SUPPLIER" || m.supplier ? (
                                      <span className="text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1 rounded">
                                        {m.supplier?.name || "Supplier"}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 rounded">
                                        Own Stock
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(job.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Cost (The bill / labor price) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ৳{Number(job.totalCost || 0).toLocaleString()}
                      </td>

                      {/* Cost (Material cost for that job) */}
                      <td className="py-3.5 px-4 text-right font-mono text-blue-700 font-semibold">
                        ৳{Number(job.materialCost || 0).toLocaleString()}
                      </td>

                      {/* Profit (Total Bill - Material) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        ৳{Number(job.profit || 0).toLocaleString()}
                      </td>

                      {/* Your Share (50% of Profit) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        ৳{Math.round(Number(job.profitShare || (job.profit * (shareRate / 100)))).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold ${
                            job.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : job.status === "READY_FOR_PICKUP"
                              ? "bg-purple-100 text-purple-800"
                              : job.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {job.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Exact Total Row summing all columns */}
              {filteredDetails.length > 0 && (
                <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                  <tr>
                    <td className="py-3.5 px-4 uppercase tracking-wider text-slate-700">
                      Total ({filteredDetails.length} Jobs)
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">—</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900">
                      ৳{tableTotals.totalBill.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-800">
                      ৳{tableTotals.materialCost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-800">
                      ৳{tableTotals.profit.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-900 bg-emerald-50">
                      ৳{exactYourProfit.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">—</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Reference Video Highlight Footer: Big "Your Profit" Figure */}
          {filteredDetails.length > 0 && (
            <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                    Financial Summary For {periodLabel}
                  </span>
                  <span className="text-xs text-slate-300">
                    Total Bill: <strong className="text-white">৳{tableTotals.totalBill.toLocaleString()}</strong> | Material: <strong className="text-blue-300">৳{tableTotals.materialCost.toLocaleString()}</strong> | Total Profit: <strong className="text-emerald-400">৳{tableTotals.profit.toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 px-6 py-2.5 rounded-xl text-center sm:text-right">
                <span className="text-xs font-semibold text-emerald-300 uppercase block tracking-wider">
                  Your Profit (50% Share)
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  ৳{exactYourProfit.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
