import React from "react";
import { PosInvoiceReceipt } from "@/components/admin/pos/PosInvoiceReceipt";
import { headers } from "next/headers";

interface InvoicePrintPageProps {
  params: { orderId: string };
  searchParams: { token?: string };
}

export default async function InvoicePrintPage({
  params,
  searchParams,
}: InvoicePrintPageProps) {
  const { orderId } = params;
  const headerList = headers();
  const authHeader = headerList.get("authorization");
  const token =
    searchParams?.token ||
    (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

  const backendUrl =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:4000";

  let order: any = null;
  let shopSettings: any = null;
  let errorMessage: string | null = null;

  try {
    const fetchHeaders: Record<string, string> = {};
    if (token) {
      fetchHeaders["Authorization"] = `Bearer ${token}`;
    }

    const [orderRes, settingsRes] = await Promise.all([
      fetch(`${backendUrl}/api/v1/orders/${orderId}`, {
        headers: fetchHeaders,
        cache: "no-store",
      }),
      fetch(`${backendUrl}/api/v1/business-settings`, {
        cache: "no-store",
      }).catch(() => null),
    ]);

    if (!orderRes.ok) {
      if (orderRes.status === 401 || orderRes.status === 403) {
        errorMessage =
          "Unauthorized: Access token missing or invalid for this invoice.";
      } else if (orderRes.status === 404) {
        errorMessage = `Order #${orderId} not found.`;
      } else {
        errorMessage = `Failed to load order: HTTP ${orderRes.status}`;
      }
    } else {
      order = await orderRes.json();
    }

    if (settingsRes && settingsRes.ok) {
      shopSettings = await settingsRes.json();
    }
  } catch (err: any) {
    errorMessage = `Error fetching invoice data: ${err?.message || err}`;
  }

  if (errorMessage || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8 text-center">
        <div className="border border-rose-300 bg-rose-50 text-rose-800 p-6 rounded-xl max-w-md">
          <h2 className="text-lg font-bold mb-2">Invoice Print Error</h2>
          <p className="text-sm">{errorMessage || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex justify-center items-start p-0 m-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          width: 210mm !important;
        }
        #printable-receipt-wrapper {
          padding: 0 !important;
          margin: 0 !important;
          background: #ffffff !important;
          display: block !important;
          width: 210mm !important;
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
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `,
        }}
      />
      <div id="printable-receipt-wrapper">
        <PosInvoiceReceipt order={order} shopSettings={shopSettings} />
      </div>
    </main>
  );
}
