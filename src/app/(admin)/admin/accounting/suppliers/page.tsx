"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable, ActionDropdown } from "@/components/admin/DataTable";
import { TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Edit, Trash2, Eye, Banknote, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { apiGet, apiDelete } from "@/lib/api-client";
import { PaymentSettlementDialog } from "@/components/admin/PaymentSettlementDialog";

interface SupplierRecord {
  id: string;
  name: string;
  companyName: string | null;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  totalSpent?: number | string;
  advanceBalance?: number | string;
  totalDue?: number | string;
  status: string;
  _count?: { purchaseOrders: number; payments: number };
}

export default function SupplierListPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<SupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<SupplierRecord | null>(null);
  const router = useRouter();

  useEffect(() => {
    setTitle("All Suppliers");
    setBadge("Accounting");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = { limit: 100 };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiGet<{ data: SupplierRecord[] }>("/suppliers", params);
      setData(res?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, due: number) => {
    if (due > 0) {
      toast.error("Cannot delete supplier with outstanding due balance");
      return;
    }
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await apiDelete(`/suppliers/${id}`);
      toast.success("Supplier deleted successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete supplier");
    }
  };

  const createActions = (row: SupplierRecord): TableAction[] => [
    {
      label: "View Profile",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => router.push(`/admin/accounting/suppliers/${row.id}`),
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: () => router.push(`/admin/accounting/suppliers/${row.id}/edit`),
    },
    {
      label: "Record Payment",
      icon: <Banknote className="w-4 h-4 text-emerald-600" />,
      onClick: () => setSelectedSupplierForPayment(row),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      variant: "destructive",
      onClick: () => handleDelete(row.id, Number(row.totalDue || 0)),
      disabled: Number(row.totalDue || 0) > 0,
    },
  ];

  const columns: ColumnDef<SupplierRecord>[] = [
    {
      accessorKey: "name",
      header: "NAME & CONTACT",
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-slate-900 text-xs leading-tight">
            {row.original.name}
          </p>
          <span className="font-mono text-[11px] text-slate-500 block mt-0.5">
            {row.original.phone}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "companyName",
      header: "COMPANY & ADDRESS",
      cell: ({ row }) => {
        const hasCompany = Boolean(row.original.companyName);
        const hasAddress = Boolean(row.original.address);

        if (!hasCompany && !hasAddress) {
          return <span className="text-slate-400 text-xs">--</span>;
        }

        return (
          <div>
            {hasCompany && (
              <p className="font-semibold text-slate-800 text-xs">
                {row.original.companyName}
              </p>
            )}
            {hasAddress && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[200px]">{row.original.address}</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "totalSpent",
      header: "TOTAL SPENT",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900 text-xs whitespace-nowrap">
          ৳{Number(row.original.totalSpent || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "advanceBalance",
      header: "ADVANCE BALANCE",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-700 text-xs whitespace-nowrap">
          ৳{Number(row.original.advanceBalance || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "totalDue",
      header: "TOTAL DUE",
      cell: ({ row }) => {
        const due = Number(row.original.totalDue || 0);
        return (
          <span
            className={`font-bold text-xs whitespace-nowrap ${
              due > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            ৳{due.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "ACTION",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ActionDropdown actions={createActions(row.original)} rowData={row.original} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">All Suppliers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hardware distributors, vendors, and trade payable accounts
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/accounting/suppliers/create")}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New
        </button>
      </div>

      {/* Single Search Bar Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search supplier by name, company or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs font-medium bg-slate-50 border-slate-200 rounded-xl"
          />
        </div>
      </div>

      <DataTable columns={columns} data={data} pageSize={10} />

      {/* Pre-selected Supplier Payment Settlement Dialog */}
      {selectedSupplierForPayment && (
        <PaymentSettlementDialog
          open={Boolean(selectedSupplierForPayment)}
          onOpenChange={(open) => {
            if (!open) setSelectedSupplierForPayment(null);
          }}
          entityType="supplier"
          entityId={selectedSupplierForPayment.id}
          entityName={selectedSupplierForPayment.name}
          totalDue={Number(selectedSupplierForPayment.totalDue || 0)}
          contextLabels={{
            walletAccount: "PAYMENT ACCOUNT",
            transactionDate: "TRANSACTION DATE",
            paymentAmount: "PAYMENT AMOUNT",
            extraDiscount: "EXTRA DISCOUNT",
            settlementNotes: "SETTLEMENT NOTES",
            title: "Record Supplier Payment",
          }}
          onPaymentSuccess={loadData}
        />
      )}
    </div>
  );
}
