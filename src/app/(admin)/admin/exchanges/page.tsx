"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, StatusBadge, ActionDropdown } from "@/components/admin/DataTable";
import { FilterConfig, StatusVariant, TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, CheckCircle, PackageCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api-client";
import { toast } from "sonner";

interface ExchangeRecord {
  id: string;
  exchangeCode: string;
  orderId: string;
  createdAt: string;
  priceDifference: number | string;
  status: string;
  order?: {
    id: string;
    orderCode: string;
    customer?: { id: string; name: string };
    branch?: { id: string; name: string };
  };
  oldOrderItem?: {
    productNameSnapshot?: string;
    product?: { name: string };
  };
  newProduct?: {
    name: string;
  };
}

export default function ExchangesPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const router = useRouter();
  
  const [data, setData] = useState<ExchangeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setTitle("Exchanges");
    setBadge("Website");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};

      if (filters.status) params.status = (filters.status as string).toUpperCase();
      if (searchQuery) params.search = searchQuery;

      const res = await apiGet<{ data: ExchangeRecord[] }>("/exchanges", params);
      setData(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load exchanges");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (id: string, action: "approve" | "item-received" | "complete" | "reject") => {
    try {
      await apiPatch(`/exchanges/${id}/${action}`);
      toast.success(`Exchange status updated (${action})`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || `Failed to perform ${action}`);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      type: "select",
      label: "Exchange Status",
      key: "status",
      options: [
        { label: "Requested", value: "REQUESTED" },
        { label: "Approved", value: "APPROVED" },
        { label: "Item Received", value: "ITEM_RECEIVED" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Rejected", value: "REJECTED" },
      ],
    },
  ];

  const createActions = (): TableAction[] => [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => router.push(`/admin/exchanges/${row.id}`),
    },
    {
      label: "Approve",
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      onClick: (row) => handleAction(row.id, "approve"),
    },
    {
      label: "Mark Received",
      icon: <PackageCheck className="w-4 h-4 text-blue-600" />,
      onClick: (row) => handleAction(row.id, "item-received"),
    },
    {
      label: "Complete",
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      onClick: (row) => handleAction(row.id, "complete"),
    },
    {
      label: "Reject",
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      variant: "destructive",
      onClick: (row) => handleAction(row.id, "reject"),
    },
  ];

  const getStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "COMPLETED":
      case "Completed": return "success";
      case "ITEM_RECEIVED":
      case "Item Received": return "info";
      case "APPROVED":
      case "Approved": return "notice";
      case "REQUESTED":
      case "Requested": return "warning";
      case "REJECTED":
      case "Rejected": return "danger";
      default: return "info";
    }
  };

  const columns: ColumnDef<ExchangeRecord>[] = [
    {
      accessorKey: "exchangeCode",
      header: "Exchange ID",
      cell: ({ row }) => (
        <span 
          onClick={() => router.push(`/admin/exchanges/${row.original.id}`)}
          className="font-mono font-bold text-slate-800 hover:text-emerald-600 cursor-pointer"
        >
          {row.original.exchangeCode}
        </span>
      ),
    },
    {
      accessorKey: "orderId",
      header: "Order ID",
      cell: ({ row }) => (
        <Link 
          href={`/admin/orders/${row.original.orderId}`} 
          className="text-emerald-600 font-medium hover:underline font-mono"
        >
          {row.original.order?.orderCode || row.original.orderId}
        </Link>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-slate-700 whitespace-nowrap">
            {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}<br/>
            <span className="text-xs text-slate-400">{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => <span className="text-slate-700">{row.original.order?.branch?.name || "Global"}</span>,
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => <span className="text-slate-700 font-medium">{row.original.order?.customer?.name || "Customer"}</span>,
    },
    {
      accessorKey: "oldItem",
      header: "Old Item",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {row.original.oldOrderItem?.productNameSnapshot || row.original.oldOrderItem?.product?.name || "Old Item"}
        </span>
      ),
    },
    {
      accessorKey: "priceDifference",
      header: "Difference",
      cell: ({ row }) => {
        const diff = Number(row.original.priceDifference || 0);
        if (diff > 0) {
          return <span className="font-bold text-red-500">+৳{diff.toLocaleString()} (Due)</span>;
        } else if (diff < 0) {
          return <span className="font-bold text-emerald-600">-৳{Math.abs(diff).toLocaleString()} (Refund)</span>;
        }
        return <span className="font-bold text-slate-500">৳0</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          type={getStatusVariant(row.original.status)} 
        />
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ActionDropdown actions={createActions()} rowData={row.original} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FilterBar 
        searchPlaceholder="Search ID, Customer..."
        filters={filterConfigs}
        onSearchChange={(val) => setSearchQuery(val)}
        onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        onReset={() => {
          setSearchQuery("");
          setFilters({});
        }}
      />

      <DataTable 
        columns={columns} 
        data={data} 
        pageSize={10}
      />
    </div>
  );
}
