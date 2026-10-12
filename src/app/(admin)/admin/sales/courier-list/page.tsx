"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, StatusBadge, ActionDropdown } from "@/components/admin/DataTable";
import { FilterConfig, StatusVariant, TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, ExternalLink, CheckCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { apiGet, apiPatch } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ShipmentRecord {
  id: string;
  orderId: string;
  courierPartner: string;
  trackingNo: string;
  address: string;
  status: string;
  lastUpdated: string;
  order?: {
    id: string;
    orderCode: string;
    customer?: { id: string; name: string; phone: string };
    branch?: { id: string; name: string };
  };
}

export default function CourierListPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const router = useRouter();
  
  const [data, setData] = useState<ShipmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setTitle("Courier List");
    setBadge("Website");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};

      if (filters.courierPartner) params.courierPartner = filters.courierPartner;
      if (filters.status) params.status = (filters.status as string).toUpperCase();
      if (searchQuery) params.search = searchQuery;

      const res = await apiGet<{ data: ShipmentRecord[] }>("/shipments", params);
      setData(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load courier shipments");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (shipmentId: string, status: string) => {
    try {
      await apiPatch(`/shipments/${shipmentId}/status`, { status });
      toast.success(`Shipment status updated to ${status}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update shipment status");
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      type: "select",
      label: "Courier Partner",
      key: "courierPartner",
      options: [
        { label: "Pathao", value: "Pathao" },
        { label: "Steadfast", value: "Steadfast" },
        { label: "RedX", value: "RedX" },
        { label: "Paperfly", value: "Paperfly" },
      ],
    },
    {
      type: "select",
      label: "Status",
      key: "status",
      options: [
        { label: "Pending Pickup", value: "PENDING_PICKUP" },
        { label: "Picked Up", value: "PICKED_UP" },
        { label: "In Transit", value: "IN_TRANSIT" },
        { label: "Delivered", value: "DELIVERED" },
        { label: "Returned", value: "RETURNED" },
      ],
    },
  ];

  const createActions = (): TableAction[] => [
    {
      label: "View Order",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => router.push(`/admin/orders/${row.orderId || row.id}`),
    },
    {
      label: "Mark as Delivered",
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      onClick: (row) => handleUpdateStatus(row.id, "DELIVERED"),
    },
  ];

  const getOrderStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "DELIVERED":
      case "Delivered": return "success";
      case "IN_TRANSIT":
      case "PICKED_UP":
      case "In Transit": return "info";
      case "PENDING_PICKUP":
      case "Pending Pickup": return "warning";
      case "RETURNED":
      case "Returned": return "danger";
      default: return "info";
    }
  };

  const columns: ColumnDef<ShipmentRecord>[] = [
    {
      accessorKey: "trackingNo",
      header: "Tracking No.",
      cell: ({ row }) => <span className="font-mono font-bold text-slate-800">{row.original.trackingNo}</span>,
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
      accessorKey: "courierPartner",
      header: "Courier Partner",
      cell: ({ row }) => <span className="font-medium text-slate-700">{row.original.courierPartner}</span>,
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => <span className="font-medium text-slate-700">{row.original.order?.customer?.name || "Customer"}</span>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => {
        const addr = row.original.address;
        if (addr.length > 25) {
          return (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger className="text-left max-w-[180px] truncate cursor-help">
                  {addr}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{addr}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return addr;
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
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ row }) => {
        const date = new Date(row.original.lastUpdated);
        return (
          <span className="text-slate-600 text-sm whitespace-nowrap">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        );
      },
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
        searchPlaceholder="Search Tracking No, Customer..."
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
