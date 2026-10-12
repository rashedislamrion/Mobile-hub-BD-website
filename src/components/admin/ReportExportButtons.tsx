"use client";

import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export-utils";

interface ReportExportButtonsProps {
  data?: any;
  filename?: string;
  headers?: string[];
  rows?: (string | number | boolean | null | undefined)[][];
  onExportCsv?: () => void;
  onExportPdf?: () => void;
}

export function ReportExportButtons({
  data,
  filename = "report",
  headers,
  rows,
  onExportCsv,
  onExportPdf,
}: ReportExportButtonsProps = {}) {
  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }

    if (headers && rows && rows.length > 0) {
      exportToCsv(filename, headers, rows);
      toast.success("CSV file downloaded successfully");
      return;
    }

    if (Array.isArray(data) && data.length > 0) {
      const keys = Object.keys(data[0]);
      const tableRows = data.map((item) =>
        keys.map((k) => (item[k] !== undefined && item[k] !== null ? String(item[k]) : ""))
      );
      exportToCsv(filename, keys, tableRows);
      toast.success("CSV file downloaded successfully");
      return;
    }

    if (data && typeof data === "object") {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const tableRows = entries.map(([key, val]) => [
          key,
          typeof val === "object" ? JSON.stringify(val) : String(val),
        ]);
        exportToCsv(filename, ["Metric", "Value"], tableRows);
        toast.success("Summary CSV downloaded successfully");
        return;
      }
    }

    toast.info("No data available to export.");
  };

  const handleExportPdf = () => {
    if (onExportPdf) {
      onExportPdf();
      return;
    }
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        type="button"
        onClick={handleExportCsv}
        className="flex items-center gap-2 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm cursor-pointer shadow-xs"
      >
        <Download className="w-4 h-4 text-emerald-600" /> Export CSV
      </button>
      <button 
        type="button"
        onClick={handleExportPdf}
        className="flex items-center gap-2 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm cursor-pointer shadow-xs"
      >
        <FileText className="w-4 h-4 text-blue-600" /> Export PDF
      </button>
    </div>
  );
}
