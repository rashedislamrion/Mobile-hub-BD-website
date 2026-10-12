"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, StatusBadge, ActionDropdown } from "@/components/admin/DataTable";
import { FilterConfig, StatusVariant, TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, FileText, CheckCircle, Edit } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiGet, apiPatch } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
}

interface OrderRecord {
  id: string;
  orderCode: string;
  date: string;
  createdAt: string;
  branch?: { id: string; name: string };
  customer?: { id: string; name: string; phone: string; email: string };
  items: OrderItem[];
  totalAmount: number | string;
  subtotal: number | string;
  dueAmount: number | string;
  paidAmount: number | string;
  paymentStatus: string;
  status: string;
  staff?: { id: string; name: string };
}

export default function DiagnosingOrdersPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const router = useRouter();
  
  const [data, setData] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [branches, setBranches] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    setTitle("Diagnosing Orders");
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
      const params: Record<string, any> = {
        status: "DIAGNOSING",
      };

      if (filters.branch) params.branchId = filters.branch;
      if (filters.paymentStatus) params.paymentStatus = (filters.paymentStatus as string).toUpperCase();
      if (searchQuery) params.search = searchQuery;

      const dateRange = filters.dateRange as { from?: Date; to?: Date } | undefined;
      if (dateRange?.from) params.dateFrom = new Date(dateRange.from).toISOString();
      if (dateRange?.to) params.dateTo = new Date(dateRange.to).toISOString();

      const res = await apiGet<{ data: OrderRecord[] }>("/orders", params);
      setData(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load diagnosing orders");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await apiPatch(`/orders/${orderId}/status`, { status });
      toast.success(`Order status updated to ${status}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
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
      label: "Payment Status",
      key: "paymentStatus",
      options: [
        { label: "Paid", value: "PAID" },
        { label: "Due", value: "DUE" },
        { label: "Pending", value: "PENDING" },
      ],
    },
    {
      type: "dateRange",
      label: "Date Range",
      key: "dateRange",
    },
  ], [branches]);

  const createActions = (): TableAction[] => [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => router.push(`/admin/orders/${row.id}`),
    },
    {
      label: "Mark as Confirmed",
      icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
      onClick: (row) => handleUpdateStatus(row.id, "CONFIRMED"),
    },
    {
      label: "Mark as Completed",
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      onClick: (row) => handleUpdateStatus(row.id, "COMPLETED"),
    },
  ];

  const getPaymentStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "PAID":
      case "Paid": return "success";
      case "DUE":
      case "Due": return "danger";
      case "PENDING":
      case "Pending": return "warning";
      default: return "info";
    }
  };

  const getOrderStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "COMPLETED":
      case "Completed": return "success";
      case "DIAGNOSING":
      case "Diagnosing": return "info";
      case "CANCELLED":
      case "Cancelled": return "danger";
      default: return "info";
    }
  };

  const columns: ColumnDef<OrderRecord>[] = [
    {
      accessorKey: "orderCode",
      header: "ID",
      cell: ({ row }) => (
        <span 
          onClick={() => router.push(`/admin/orders/${row.original.id}`)}
          className="font-mono font-bold text-slate-800 hover:text-emerald-600 cursor-pointer"
        >
          {row.original.orderCode}
        </span>
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
      cell: ({ row }) => <span className="text-slate-700">{row.original.branch?.name || "Global"}</span>,
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const c = row.original.customer;
        return (
          <span className="text-slate-700 font-medium">
            {c?.name || "Walk-in Customer"}<br/>
            <span className="text-xs text-slate-400 font-normal">{c?.phone || "N/A"}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const itemsStr = row.original.items?.map((i) => i.productNameSnapshot).join(", ") || "No items";
        if (itemsStr.length > 25) {
          return (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger className="text-left max-w-[150px] truncate cursor-help">
                  {itemsStr}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{itemsStr}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return itemsStr;
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <span className="font-bold text-slate-800">৳{Number(row.original.totalAmount).toLocaleString()}</span>,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payments",
      cell: ({ row }) => {
        const due = Number(row.original.dueAmount || 0);
        return (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge 
              status={row.original.paymentStatus} 
              type={getPaymentStatusVariant(row.original.paymentStatus)} 
            />
            {due > 0 && (
              <span className="text-[10px] font-medium text-red-500">
                Due ৳{due.toLocaleString()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.status} 
          type={getOrderStatusVariant(row.original.status)} 
        />
      ),
    },
    {
      accessorKey: "staff",
      header: "Staff",
      cell: ({ row }) => (
        <span className={!row.original.staff ? "text-slate-400 italic" : "text-slate-700"}>
          {row.original.staff?.name || "N/A"}
        </span>
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
