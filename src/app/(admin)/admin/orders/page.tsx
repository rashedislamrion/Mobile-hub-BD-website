"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, StatusBadge, ActionDropdown } from "@/components/admin/DataTable";
import { FilterConfig, StatusVariant, TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, CheckCircle, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api-client";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  quantity: number;
}

interface OrderRecord {
  id: string;
  orderCode: string;
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
  needsStockReview?: boolean;
  stockReviewNote?: string;
  staff?: { id: string; name: string };
}

export default function OrdersPage() {
  const { setTitle, setBadge, setDateFilter, selectedBranchId } = useAdminPage();
  const router = useRouter();
  
  const [data, setData] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [branches, setBranches] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    setTitle("Orders");
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

      const branchToFilter = filters.branch || selectedBranchId;
      if (branchToFilter) params.branchId = branchToFilter;
      if (filters.paymentStatus) params.paymentStatus = (filters.paymentStatus as string).toUpperCase();
      if (filters.status) params.status = (filters.status as string).toUpperCase();
      if (filters.needsStockReview) params.needsStockReview = filters.needsStockReview;
      if (searchQuery) params.search = searchQuery;

      const dateRange = filters.dateRange as { from?: Date; to?: Date } | undefined;
      if (dateRange?.from) params.dateFrom = new Date(dateRange.from).toISOString();
      if (dateRange?.to) params.dateTo = new Date(dateRange.to).toISOString();

      const res = await apiGet<{ data: OrderRecord[] }>("/orders", params);
      setData(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery, selectedBranchId]);

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
      type: "select",
      label: "Order Status",
      key: "status",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Confirmed", value: "CONFIRMED" },
        { label: "Parcel Booked", value: "PARCEL_BOOKED" },
        { label: "Delivered", value: "DELIVERED" },
        { label: "Returned", value: "RETURNED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
    {
      type: "select",
      label: "Stock Review",
      key: "needsStockReview",
      options: [
        { label: "All Orders", value: "" },
        { label: "Needs Stock Review", value: "true" },
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
      label: "Mark Confirmed",
      icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
      onClick: (row) => handleUpdateStatus(row.id, "CONFIRMED"),
    },
    {
      label: "Mark Delivered",
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      onClick: (row) => handleUpdateStatus(row.id, "DELIVERED"),
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
      case "DELIVERED":
      case "COMPLETED":
      case "Delivered":
      case "Completed": return "success";
      case "CONFIRMED":
      case "PARCEL_BOOKED":
      case "Confirmed":
      case "Parcel Booked": return "info";
      case "PENDING":
      case "Pending": return "warning";
      case "RETURNED":
      case "Returned": return "notice";
      case "CANCELLED":
      case "Cancelled": return "danger";
      default: return "info";
    }
  };

  const columns: ColumnDef<OrderRecord>[] = [
    {
      accessorKey: "orderCode",
      header: "Order ID",
      cell: ({ row }) => (
        <span 
          onClick={() => router.push(`/admin/orders/${row.original.id}`)}
          className="font-semibold text-slate-800 hover:text-emerald-600 cursor-pointer font-mono"
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
          <span className="text-slate-600 whitespace-nowrap">
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
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">
          {row.original.customer?.name || "Walk-in Customer"}
        </span>
      ),
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const count = row.original.items?.reduce((acc, i) => acc + i.quantity, 0) || row.original.items?.length || 0;
        return <span className="text-slate-600">{count} item{count !== 1 ? "s" : ""}</span>;
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <span className="font-semibold text-slate-800">৳{Number(row.original.totalAmount).toLocaleString()}</span>,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.paymentStatus} 
          type={getPaymentStatusVariant(row.original.paymentStatus)} 
        />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge 
            status={row.original.status} 
            type={getOrderStatusVariant(row.original.status)} 
          />
          {row.original.needsStockReview && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300"
              title={row.original.stockReviewNote || "Payment received but inventory was exhausted. Requires manual stock review."}
            >
              ⚠️ Needs Stock Review
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "staff",
      header: "Staff",
      cell: ({ row }) => <span className="text-slate-600">{row.original.staff?.name || "Online / POS"}</span>,
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
