"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable, StatusBadge } from "@/components/admin/DataTable";
import { ColoredStatCard } from "@/components/admin/ColoredStatCard";
import { Building2, Phone, Mail, MapPin, CreditCard, ShoppingBag, ArrowLeft, Edit, Banknote } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { apiGet } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PaymentSettlementDialog } from "@/components/admin/PaymentSettlementDialog";

export default function SupplierProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setBadge, setDateFilter } = useAdminPage();

  const [supplier, setSupplier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"purchases" | "payments">("purchases");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const loadSupplier = () => {
    if (!params.id) return;
    setIsLoading(true);
    apiGet<any>(`/suppliers/${params.id}`)
      .then((res) => {
        setSupplier(res);
        if (res?.name) setTitle(res.name);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load supplier profile");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    setTitle("Supplier Profile");
    setBadge("Accounting");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    loadSupplier();
  }, [params.id, setTitle]);

  const poColumns: ColumnDef<any>[] = [
    {
      accessorKey: "poNumber",
      header: "PO Number",
      cell: ({ row }) => (
        <span 
          onClick={() => router.push(`/admin/accounting/purchase/${row.original.id}`)}
          className="font-bold text-emerald-600 cursor-pointer hover:underline"
        >
          {row.original.poNumber}
        </span>
      ),
    },
    {
      accessorKey: "orderDate",
      header: "Date",
      cell: ({ row }) => <span>{new Date(row.original.orderDate).toLocaleDateString("en-GB")}</span>,
    },
    {
      accessorKey: "grandTotal",
      header: "Total",
      cell: ({ row }) => <span className="font-bold">৳{Number(row.original.grandTotal).toLocaleString()}</span>,
    },
    {
      accessorKey: "dueAmount",
      header: "Due",
      cell: ({ row }) => {
        const due = Number(row.original.dueAmount || 0);
        return <span className={`font-semibold ${due > 0 ? "text-rose-600" : "text-emerald-600"}`}>৳{due.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          type={row.original.status === "RECEIVED" ? "success" : "warning"} 
        />
      ),
    },
  ];

  const paymentColumns: ColumnDef<any>[] = [
    {
      accessorKey: "receiptNo",
      header: "Receipt No",
      cell: ({ row }) => <span className="font-mono text-xs font-bold text-slate-800">{row.original.receiptNo}</span>,
    },
    {
      accessorKey: "paymentDate",
      header: "Date",
      cell: ({ row }) => <span>{new Date(row.original.paymentDate).toLocaleDateString("en-GB")}</span>,
    },
    {
      accessorKey: "amountPaid",
      header: "Amount Paid",
      cell: ({ row }) => <span className="font-bold text-emerald-600">৳{Number(row.original.amountPaid).toLocaleString()}</span>,
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => <span>{row.original.paymentMethod}</span>,
    },
    {
      accessorKey: "walletType",
      header: "Wallet",
      cell: ({ row }) => <span>{row.original.walletType?.name || "Direct Cash"}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!supplier) {
    return <div className="p-6 text-slate-500">Supplier not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Suppliers
        </button>
        <div className="flex items-center gap-2">
          {Number(supplier.totalDue || 0) > 0 && (
            <button 
              onClick={() => setPaymentDialogOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Banknote className="w-4 h-4" /> Make Payment
            </button>
          )}
          <button 
            onClick={() => router.push(`/admin/accounting/suppliers/${supplier.id}/edit`)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Supplier Info Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-2xl text-emerald-700">
            {supplier.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{supplier.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                supplier.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}>
                {supplier.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-4 flex-wrap">
              {supplier.contactPerson && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {supplier.contactPerson}</span>}
              <span className="flex items-center gap-1 font-mono"><Phone className="w-3.5 h-3.5" /> {supplier.phone}</span>
              {supplier.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {supplier.email}</span>}
              {supplier.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {supplier.address}</span>}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="text-right border-l border-slate-100 pl-6">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Outstanding Due</span>
            <p className={`text-2xl font-bold ${Number(supplier.totalDue) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              ৳{Number(supplier.totalDue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex border-b border-slate-100 gap-6">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "purchases" 
                ? "border-emerald-600 text-emerald-600" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Purchase Orders ({supplier.purchaseOrders?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "payments" 
                ? "border-emerald-600 text-emerald-600" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Payment Receipts ({supplier.payments?.length || 0})
          </button>
        </div>

        {activeTab === "purchases" ? (
          <DataTable columns={poColumns} data={supplier.purchaseOrders || []} pageSize={10} />
        ) : (
          <DataTable columns={paymentColumns} data={supplier.payments || []} pageSize={10} />
        )}
      </div>

      <PaymentSettlementDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        entityType="supplier"
        entityId={supplier.id}
        entityName={supplier.name}
        totalDue={Number(supplier.totalDue || 0)}
        onPaymentSuccess={loadSupplier}
      />
    </div>
  );
}
