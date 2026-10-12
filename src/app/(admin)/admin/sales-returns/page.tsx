"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, StatusBadge, ActionDropdown } from "@/components/admin/DataTable";
import { FilterConfig, StatusVariant, TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, CheckCircle, XCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api-client";
import { toast } from "sonner";

interface SalesReturnRecord {
  id: string;
  returnCode: string;
  orderId: string;
  createdAt: string;
  branchId: string;
  reason: string;
  refundAmount: number | string;
  status: string;
  order?: {
    id: string;
    orderCode: string;
    customer?: { id: string; name: string; phone: string };
    branch?: { id: string; name: string };
  };
  items?: Array<{
    id: string;
    quantity: number;
    orderItem?: {
      productNameSnapshot?: string;
      product?: { name: string };
    };
  }>;
}

export default function SalesReturnsPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const router = useRouter();
  
  const [data, setData] = useState<SalesReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [branches, setBranches] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    setTitle("Sales Returns");
    setBadge("Website");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    apiGet<any[]>("/branches/public")
      .then((res) => {
        if (Array.isArray(res)) {
          setBranches(res.map((b) => ({ label: b.name, value: b.id })));
        }
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};

      if (filters.branch) params.branch = filters.branch;
      if (filters.status) params.status = (filters.status as string).toUpperCase();
      if (searchQuery) params.search = searchQuery;

      const res = await apiGet<{ data: SalesReturnRecord[] }>("/sales-returns", params);
      setData(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load sales returns");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    try {
      await apiPatch(`/sales-returns/${id}/approve`);
      toast.success("Sales return approved & stock restored");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve return");
    }
  };

  const handleRefund = async (id: string) => {
    try {
      await apiPatch(`/sales-returns/${id}/refund`);
      toast.success("Sales return marked as refunded");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark refunded");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiPatch(`/sales-returns/${id}/reject`, { reason: "Rejected by admin" });
      toast.success("Sales return rejected");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject return");
    }
  };

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      type: "select",
      label: "Branch",
      key: "branch",
      options: branches,
    },
    {
      type: "select",
      label: "Return Status",
      key: "status",
      options: [
        { label: "Requested", value: "REQUESTED" },
        { label: "Approved", value: "APPROVED" },
        { label: "Refunded", value: "REFUNDED" },
        { label: "Rejected", value: "REJECTED" },
      ],
    },
  ], [branches]);

  const createActions = (): TableAction[] => [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => router.push(`/admin/sales-returns/${row.id}`),
    },
    {
      label: "Approve",
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      onClick: (row) => handleApprove(row.id),
    },
    {
      label: "Mark as Refunded",
      icon: <RefreshCcw className="w-4 h-4 text-blue-600" />,
      onClick: (row) => handleRefund(row.id),
    },
    {
      label: "Reject",
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      variant: "destructive",
      onClick: (row) => handleReject(row.id),
    },
  ];

  const getStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "REFUNDED":
      case "Refunded": return "success";
      case "APPROVED":
      case "Approved": return "info";
      case "REQUESTED":
      case "Requested": return "warning";
      case "REJECTED":
      case "Rejected": return "danger";
      default: return "info";
    }
  };

  const columns: ColumnDef<SalesReturnRecord>[] = [
    {
      accessorKey: "returnCode",
      header: "Return ID",
      cell: ({ row }) => (
        <span 
          onClick={() => router.push(`/admin/sales-returns/${row.original.id}`)}
          className="font-mono font-bold text-slate-800 hover:text-emerald-600 cursor-pointer"
        >
          {row.original.returnCode}
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
      cell: ({ row }) => {
        const c = row.original.order?.customer;
        return (
          <span className="text-slate-700 font-medium">
            {c?.name || "Customer"}<br/>
            <span className="text-xs text-slate-400 font-normal">{c?.phone || "N/A"}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="text-sm text-slate-600">{row.original.reason}</span>,
    },
    {
      accessorKey: "refundAmount",
      header: "Refund Amount",
      cell: ({ row }) => <span className="font-bold text-slate-800">৳{Number(row.original.refundAmount).toLocaleString()}</span>,
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
