"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, StatusBadge, ActionDropdown } from "@/components/admin/DataTable";
import { FilterConfig, StatusVariant, TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, CheckCircle, PackageCheck, Plus, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet, apiPatch } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ServiceJobRecord {
  id: string;
  orderId: string;
  createdAt: string;
  device: string;
  issueDescription: string;
  serviceCharge: number | string;
  status: string;
  technician?: { id: string; name: string; phone: string };
  order?: {
    id: string;
    orderCode: string;
    customer?: { id: string; name: string; phone: string; email: string };
    branch?: { id: string; name: string };
    paymentStatus: string;
  };
}

export default function ServiceListPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const router = useRouter();
  
  const [data, setData] = useState<ServiceJobRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [branches, setBranches] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    setTitle("Service List");
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

      const res = await apiGet<{ data: ServiceJobRecord[] }>("/service-jobs", params);
      setData(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load service jobs");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (jobId: string, status: string) => {
    try {
      await apiPatch(`/service-jobs/${jobId}/status`, { status });
      toast.success(`Service status updated to ${status}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update service status");
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
      label: "Service Status",
      key: "status",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Ready for Pickup", value: "READY_FOR_PICKUP" },
        { label: "Delivered", value: "DELIVERED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
  ], [branches]);

  const createActions = (): TableAction[] => [
    {
      label: "View Order",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => router.push(`/admin/orders/${row.orderId || row.id}`),
    },
    {
      label: "Mark as Ready",
      icon: <PackageCheck className="w-4 h-4 text-purple-600" />,
      onClick: (row) => handleUpdateStatus(row.id, "READY_FOR_PICKUP"),
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
      case "IN_PROGRESS":
      case "In Progress": return "info";
      case "PENDING":
      case "Pending": return "warning";
      case "CANCELLED":
      case "Cancelled": return "danger";
      default: return "info";
    }
  };

  const columns: ColumnDef<ServiceJobRecord>[] = [
    {
      accessorKey: "order",
      header: "Order ID",
      cell: ({ row }) => (
        <span 
          onClick={() => router.push(`/admin/orders/${row.original.orderId}`)}
          className="font-mono font-bold text-slate-800 hover:text-emerald-600 cursor-pointer"
        >
          {row.original.order?.orderCode || row.original.orderId}
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
      cell: ({ row }) => <span className="text-slate-700">{row.original.order?.branch?.name || "Global"}</span>,
    },
    {
      accessorKey: "customer",
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
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => <span className="text-slate-700 font-medium">{row.original.device}</span>,
    },
    {
      accessorKey: "technician",
      header: "Technician",
      cell: ({ row }) => (
        <span className={!row.original.technician ? "text-slate-400 italic" : "text-slate-700 font-medium"}>
          {row.original.technician?.name || "Unassigned"}
        </span>
      ),
    },
    {
      accessorKey: "serviceCharge",
      header: "Service Charge",
      cell: ({ row }) => <span className="font-bold text-slate-800">৳{Number(row.original.serviceCharge).toLocaleString()}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const st = row.original.status;
        if (st === "READY_FOR_PICKUP" || st === "Ready for Pickup") {
          return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">Ready for Pickup</Badge>;
        }
        return (
          <StatusBadge 
            status={st} 
            type={getOrderStatusVariant(st)} 
          />
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            Servicing & Repair Jobs
          </h2>
          <p className="text-xs text-slate-500">Manage walk-in repair intakes, technician assignments, and parts history.</p>
        </div>
        <Button
          onClick={() => router.push("/admin/servicing/create")}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Service
        </Button>
      </div>

      <FilterBar 
        searchPlaceholder="Search ID, Customer, Device..."
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
