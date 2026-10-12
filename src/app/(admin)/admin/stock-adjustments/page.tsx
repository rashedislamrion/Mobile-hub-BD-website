"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, ActionDropdown } from "@/components/admin/DataTable";
import { FilterConfig, TableAction } from "@/types/table";
import { StockAdjustment, AdjustmentType } from "@/lib/mock-data/stock-adjustments";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Trash2, Plus, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { apiGet } from "@/lib/api-client";

export default function StockAdjustmentsPage() {
  const { setTitle, setBadge, setDateFilter, selectedBranchId } = useAdminPage();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [data, setData] = useState<StockAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    setTitle("Stock Adjustments");
    setBadge("Inventory");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    apiGet<any[]>("/branches/public")
      .then((res) => {
        if (Array.isArray(res)) setBranches(res);
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = { limit: 100 };
      if (selectedBranchId && selectedBranchId !== "all") {
        params.branch = selectedBranchId;
      }
      if (filters.branch) {
        params.branch = filters.branch;
      }
      if (filters.type) {
        const typeMap: Record<string, string> = {
          Increase: "INCREASE",
          Decrease: "DECREASE",
          "Recount/Correction": "RECOUNT",
        };
        params.type = typeMap[filters.type as string] || filters.type;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await apiGet<{ data: any[] }>("/stock-adjustments", params);
      if (res?.data && res.data.length > 0) {
        const mapped: StockAdjustment[] = res.data.map((item: any) => {
          let adjType: AdjustmentType = "Increase";
          if (item.type === "DECREASE" || item.type === "Decrease") adjType = "Decrease";
          else if (item.type === "RECOUNT" || item.type === "Recount/Correction") adjType = "Recount/Correction";

          return {
            id: item.referenceNo || item.id,
            date: item.createdAt || item.date || new Date().toISOString(),
            branch: item.branch?.name || item.branch || "Global",
            productId: item.productId,
            productName: item.product?.name || item.productName || "Product",
            productSku: item.variant?.sku || item.productSku || "SKU-N/A",
            productImage: item.product?.images?.[0]?.url || item.productImage || "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=200&h=200&fit=crop",
            type: adjType,
            quantityChange: Number(item.quantityChange || 0),
            stockBefore: Number(item.stockBefore || 0),
            stockAfter: Number(item.stockAfter || 0),
            reason: item.reason,
            notes: item.notes,
            adjustedBy: item.adjustedBy?.name || item.adjustedBy || "Admin Staff",
          };
        });
        setData(mapped);
      } else {
        setData([]);
      }
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId, filters, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      type: "select",
      label: "Branch",
      key: "branch",
      options: branches.map((b) => ({ label: b.name, value: b.name })),
    },
    {
      type: "select",
      label: "Type",
      key: "type",
      options: [
        { label: "Increase", value: "Increase" },
        { label: "Decrease", value: "Decrease" },
        { label: "Recount/Correction", value: "Recount/Correction" },
      ],
    },
    {
      type: "dateRange",
      label: "Date Range",
      key: "dateRange",
    },
  ], [branches]);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.productName.toLowerCase().includes(q) ||
          o.productSku.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }

    if (filters.branch) {
      result = result.filter((o) => o.branch === filters.branch);
    }
    if (filters.type) {
      result = result.filter((o) => o.type === filters.type);
    }

    const dateRange = filters.dateRange as { from?: Date; to?: Date } | undefined;
    if (dateRange?.from) {
      const from = new Date(dateRange.from).getTime();
      const to = dateRange.to ? new Date(dateRange.to).getTime() : from;
      
      result = result.filter((o) => {
        const orderTime = new Date(o.date).getTime();
        return orderTime >= from && orderTime <= to + 86400000;
      });
    }

    return result;
  }, [searchQuery, filters, data]);

  const createActions = (row: StockAdjustment): TableAction[] => {
    const hoursSince = (new Date().getTime() - new Date(row.date).getTime()) / (1000 * 60 * 60);
    const isLocked = hoursSince > 24;

    return [
      { label: "View Details", icon: <Eye className="w-4 h-4" />, onClick: () => toast.info(`Viewing details for ${row.id}: ${row.reason}${row.notes ? ` (${row.notes})` : ""}`) },
      { 
        label: "Delete", 
        icon: <Trash2 className="w-4 h-4 text-red-500" />, 
        variant: "destructive", 
        onClick: () => {
          if (isLocked) {
            toast.error("Adjustment locked after 24h");
            return;
          }
          toast.success("Adjustment record archived");
          setData(prev => prev.filter(a => a.id !== row.id));
        }
      },
    ];
  };

  const getAdjustmentTag = (type: AdjustmentType) => {
    if (type === "Increase") {
      return (
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full w-fit text-xs font-semibold">
          <ArrowUpRight className="w-3.5 h-3.5" /> Increase
        </div>
      );
    }
    if (type === "Decrease") {
      return (
        <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full w-fit text-xs font-semibold">
          <ArrowDownRight className="w-3.5 h-3.5" /> Decrease
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full w-fit text-xs font-semibold">
        <RefreshCw className="w-3.5 h-3.5" /> Recount
      </div>
    );
  };

  const columns: ColumnDef<StockAdjustment>[] = [
    {
      accessorKey: "id",
      header: "Ref No.",
      cell: ({ row }) => <span className="font-mono text-sm font-semibold text-slate-700">{row.original.id}</span>
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return (
          <span className="text-slate-600 whitespace-nowrap text-xs">
            {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        );
      }
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => <span className="text-slate-700 font-medium text-sm">{row.original.branch}</span>
    },
    {
      id: "product",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 max-w-[220px]">
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200 relative">
            <Image src={row.original.productImage} alt="Product" fill className="object-cover" />
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-slate-800 text-sm truncate" title={row.original.productName}>{row.original.productName}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{row.original.productSku}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => getAdjustmentTag(row.original.type)
    },
    {
      accessorKey: "quantityChange",
      header: "Change",
      cell: ({ row }) => {
        const val = row.original.quantityChange;
        const color = val > 0 ? "text-emerald-600" : val < 0 ? "text-red-600" : "text-slate-600";
        const sign = val > 0 ? "+" : "";
        return <span className={`font-bold ${color}`}>{sign}{val}</span>;
      }
    },
    {
      id: "beforeAfter",
      header: "Stock (Before → After)",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{row.original.stockBefore}</span>
          <span className="text-slate-300">→</span>
          <span className="font-semibold text-slate-800">{row.original.stockAfter}</span>
        </div>
      )
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <div>
          <span className="text-slate-700 text-sm font-medium">{row.original.reason}</span>
          {row.original.notes && (
            <p className="text-xs text-slate-400 truncate max-w-[150px]" title={row.original.notes}>
              {row.original.notes}
            </p>
          )}
        </div>
      )
    },
    {
      accessorKey: "adjustedBy",
      header: "Adjusted By",
      cell: ({ row }) => <span className="text-slate-600 text-xs font-medium">{row.original.adjustedBy}</span>
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ActionDropdown actions={createActions(row.original)} rowData={row.original} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inventory Adjustments</h2>
          <p className="text-xs text-slate-500 mt-0.5">Audit and adjust stock balances across outlet branches</p>
        </div>
        <Link
          href="/admin/stock-adjustments/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Adjustment
        </Link>
      </div>

      <FilterBar 
        searchPlaceholder="Search product, reference..."
        filters={filterConfigs}
        onSearchChange={(val) => setSearchQuery(val)}
        onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
        onReset={() => {
          setSearchQuery("");
          setFilters({});
        }}
      />

      <DataTable 
        columns={columns} 
        data={filteredData} 
        pageSize={10}
      />
    </div>
  );
}
