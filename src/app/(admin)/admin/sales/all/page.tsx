"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, StatusBadge, ActionDropdown } from "@/components/admin/DataTable";
import { FilterConfig, StatusVariant, TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  quantity: number;
}

interface SaleRecord {
  id: string;
  orderCode: string;
  createdAt: string;
  branch?: { id: string; name: string };
  saleType: string;
  customer?: { id: string; name: string; phone: string; email: string };
  items: OrderItem[];
  totalAmount: number | string;
  paymentStatus: string;
  status: string;
  staff?: { id: string; name: string };
}

export default function AllSalesPage() {
  const { setTitle, setBadge, setDateFilter, selectedBranchId } = useAdminPage();
  const router = useRouter();
  
  const [data, setData] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [branches, setBranches] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    setTitle("All Sales");
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
      if (filters.saleType) params.saleType = filters.saleType;
      if (filters.paymentStatus) params.paymentStatus = (filters.paymentStatus as string).toUpperCase();
      if (filters.status) params.status = (filters.status as string).toUpperCase();
      if (searchQuery) params.search = searchQuery;

      const dateRange = filters.dateRange as { from?: Date; to?: Date } | undefined;
      if (dateRange?.from) params.dateFrom = new Date(dateRange.from).toISOString();
      if (dateRange?.to) params.dateTo = new Date(dateRange.to).toISOString();

      const res = await apiGet<{ data: SaleRecord[] }>("/orders", params);
      setData(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load sales");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery, selectedBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      type: "select",
      label: "Branch",
      key: "branch",
      options: branches,
    },
    {
      type: "select",
      label: "Sale Type",
      key: "saleType",
      options: [
        { label: "POS", value: "POS" },
        { label: "Courier", value: "COURIER" },
        { label: "Diagnosing", value: "DIAGNOSING" },
        { label: "Website", value: "WEBSITE" },
      ],
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
        { label: "Confirmed", value: "CONFIRMED" },
        { label: "Delivered", value: "DELIVERED" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Pending", value: "PENDING" },
        { label: "Parcel Booked", value: "PARCEL_BOOKED" },
        { label: "Diagnosing", value: "DIAGNOSING" },
        { label: "Returned", value: "RETURNED" },
        { label: "Cancelled", value: "CANCELLED" },
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
      case "DELIVERED":
      case "Completed":
      case "Delivered": return "success";
      case "CONFIRMED":
      case "PARCEL_BOOKED":
      case "DIAGNOSING":
      case "Confirmed":
      case "Diagnosing": return "info";
      case "PENDING":
      case "Pending": return "warning";
      case "RETURNED":
      case "CANCELLED":
      case "Returned":
      case "Cancelled": return "danger";
      default: return "info";
    }
  };

  const columns: ColumnDef<SaleRecord>[] = [
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
      accessorKey: "saleType",
      header: "Sale Type",
      cell: ({ row }) => {
        const type = row.original.saleType;
        let variant: "default" | "secondary" | "outline" = "outline";
        if (type === "POS") variant = "default";
        if (type === "WEBSITE") variant = "secondary";
        return <Badge variant={variant} className="text-[10px]">{type}</Badge>;
      },
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
        if (itemsStr.length > 20) {
          return (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger className="text-left max-w-[120px] truncate cursor-help">
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
