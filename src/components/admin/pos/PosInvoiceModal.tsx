"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Printer,
  CheckCircle2,
  ArrowRight,
  Download,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, API_BASE_URL, getStaffToken } from "@/lib/api-client";
import { PosInvoiceReceipt } from "./PosInvoiceReceipt";

export interface PosInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onNewSale: () => void;
}

export function PosInvoiceModal({
  open,
  onOpenChange,
  order,
  onNewSale,
}: PosInvoiceModalProps) {
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "png" | null>(null);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target as Node)) {
        setIsFormatDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFormatDropdownOpen(false);
      }
    };
    if (isFormatDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFormatDropdownOpen]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<any>("/business-settings");
        if (res) setShopSettings(res);
      } catch {
        // Fallback gracefully
      }
    })();
  }, []);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      setDownloadFormat("pdf");
      const token = getStaffToken();
      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/invoice.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${order.orderCode || "Receipt"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded successfully");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Using browser print as fallback.");
      window.print();
    } finally {
      setIsDownloading(false);
      setDownloadFormat(null);
    }
  };

  const handleDownloadPng = async () => {
    try {
      setIsDownloading(true);
      setDownloadFormat("png");
      const token = getStaffToken();
      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/invoice.png`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${order.orderCode || "Receipt"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Invoice PNG image downloaded successfully");
    } catch (err) {
      console.error("PNG generation failed:", err);
      toast.error("Failed to generate PNG image.");
    } finally {
      setIsDownloading(false);
      setDownloadFormat(null);
    }
  };

  const isDiagnosing = order.status === "DIAGNOSING" || order.saleType === "DIAGNOSING";

  // Template Selection (for modal notification header label)
  const isMobileDeviceOrder = Boolean(
    order.items?.some((item: any) => {
      const hasPhoneUnits = Array.isArray(item.phoneUnits) && item.phoneUnits.length > 0;
      return (
        hasPhoneUnits ||
        Boolean(item.phoneUnit) ||
        Boolean(item.phoneUnitId) ||
        Boolean(item.isPhone) ||
        Boolean(item.product?.isPhone)
      );
    })
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[880px] h-[92vh] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 print:bg-white print:border-none print:shadow-none print:max-w-full print:max-h-none print:h-auto print:m-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            body > *:not([data-radix-portal]) {
              display: none !important;
            }
            [data-radix-dialog-overlay] {
              display: none !important;
            }
            [data-radix-dialog-close] {
              display: none !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            [role="dialog"] {
              position: static !important;
              transform: none !important;
              max-width: 100% !important;
              max-height: none !important;
              width: 100% !important;
              height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              overflow: visible !important;
            }
            #printable-receipt-wrapper {
              padding: 0 !important;
              margin: 0 !important;
              background: transparent !important;
              overflow: visible !important;
              display: block !important;
            }
            #printable-receipt {
              width: 210mm !important;
              min-height: 297mm !important;
              max-width: 210mm !important;
              margin: 0 auto !important;
              padding: 10mm 12mm !important;
              box-shadow: none !important;
              border: none !important;
              overflow: visible !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />
        {/* Screen Only Top Notification Header */}
        <div className="bg-emerald-600 px-6 py-3.5 text-white print:hidden shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/80 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {isDiagnosing ? "Diagnostic Order Registered!" : "Sale Completed Successfully!"}
                </h3>
                <p className="text-xs text-emerald-100">
                  Invoice Ref: <span className="font-mono font-bold text-white">{order.orderCode}</span> •{" "}
                  Format: <span className="underline font-semibold">{isMobileDeviceOrder ? "Template A (Mobile Device)" : "Template B (Normal Purchase)"}</span>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 uppercase tracking-wider">
              {order.saleType || "POS"}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE RECEIPT CONTENT (Fixed A4 Dimensions: 210mm x 297mm)             */}
        {/* ========================================================================= */}
        <div
          id="printable-receipt-wrapper"
          className="flex-1 overflow-y-auto overflow-x-auto min-h-0 p-4 sm:p-6 bg-slate-200/70 flex justify-center items-start print:p-0 print:m-0 print:bg-white print:overflow-visible"
        >
          <PosInvoiceReceipt order={order} shopSettings={shopSettings} />
        </div>

        {/* ========================================================================= */}
        {/* MODAL ACTIONS (Screen View Only - Hidden when printing or saving as PDF)  */}
        {/* ========================================================================= */}
        <div className="shrink-0 z-20 bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={onNewSale}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" /> Start New Sale
          </button>

          <div className="flex items-center gap-2">
            {/* Split Download Button with Dropdown (PDF and PNG) */}
            <div ref={formatDropdownRef} className="relative inline-flex rounded-xl shadow-xs">
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 rounded-l-xl text-xs font-semibold text-slate-700 transition-colors disabled:opacity-60 cursor-pointer"
                title="Download invoice as PDF"
              >
                {isDownloading && downloadFormat === "pdf" ? (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-600" />
                )}
                {isDownloading && downloadFormat === "pdf" ? "Generating PDF..." : "Download PDF"}
              </button>

              <button
                type="button"
                disabled={isDownloading}
                onClick={() => setIsFormatDropdownOpen((prev) => !prev)}
                className="inline-flex items-center px-2.5 py-2 border border-l-0 border-slate-300 bg-white hover:bg-slate-50 rounded-r-xl text-xs font-semibold text-slate-700 transition-colors disabled:opacity-60 cursor-pointer"
                title="Choose download format"
                aria-expanded={isFormatDropdownOpen}
              >
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isFormatDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isFormatDropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 bottom-full mb-2 w-56 bg-white shadow-2xl border border-slate-200 rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsFormatDropdownOpen(false);
                      handleDownloadPdf();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">PDF Document</span>
                      <span className="text-[10px] text-slate-500">Vector print-ready (.pdf)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsFormatDropdownOpen(false);
                      handleDownloadPng();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors text-left"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">PNG Image</span>
                      <span className="text-[10px] text-slate-500">High-res 300dpi (.png)</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
