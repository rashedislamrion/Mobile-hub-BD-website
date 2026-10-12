"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { FilterBar } from "@/components/admin/FilterBar";
import { DataTable, StatusBadge, ActionDropdown } from "@/components/admin/DataTable";
import { FilterConfig, StatusVariant, TableAction } from "@/types/table";
import { ColumnDef } from "@tanstack/react-table";
import { Search, CheckCircle, Trash2, Plus, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { toast } from "sonner";

export interface WantedProductItem {
  id: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  requestedDate: string;
  status: string;
  notes?: string | null;
}

export default function WantedProductsPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  
  const [data, setData] = useState<WantedProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  
  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Wanted Products");
    setBadge("Website");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet<{ data: WantedProductItem[] }>("/wanted-products", { limit: 100 });
      if (res?.data && Array.isArray(res.data)) {
        setData(res.data);
      } else if (Array.isArray(res)) {
        setData(res as unknown as WantedProductItem[]);
      } else {
        setData([]);
      }
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newCustomerName.trim() || !newCustomerPhone.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiPost("/wanted-products", {
        productName: newProductName.trim(),
        customerName: newCustomerName.trim(),
        customerPhone: newCustomerPhone.trim(),
        notes: newNotes.trim() || undefined,
        status: "NEW",
      });
      toast.success("Wanted product request added successfully!");
      setIsAddOpen(false);
      setNewProductName("");
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewNotes("");
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create wanted product request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (item: WantedProductItem, newStatus: string) => {
    try {
      await apiPatch(`/wanted-products/${item.id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleDelete = async (item: WantedProductItem) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete wanted product request for "${item.productName}"?`)) {
      return;
    }
    try {
      await apiDelete(`/wanted-products/${item.id}`);
      toast.success("Wanted product request deleted successfully!");
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete request");
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      type: "select",
      label: "Status",
      key: "status",
      options: [
        { label: "New", value: "NEW" },
        { label: "Sourcing", value: "SOURCING" },
        { label: "Fulfilled", value: "FULFILLED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
    {
      type: "dateRange",
      label: "Date Range",
      key: "dateRange",
    },
  ];

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.productName.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      );
    }

    if (filters.status) {
      const statusFilter = String(filters.status).toUpperCase();
      result = result.filter((o) => (o.status || "").toUpperCase() === statusFilter);
    }

    const dateRange = filters.dateRange as { from?: Date; to?: Date } | undefined;
    if (dateRange?.from) {
      const from = new Date(dateRange.from).getTime();
      const to = dateRange.to ? new Date(dateRange.to).getTime() : from;
      
      result = result.filter((o) => {
        const orderTime = new Date(o.requestedDate).getTime();
        return orderTime >= from && orderTime <= to + 86400000;
      });
    }

    return result;
  }, [data, searchQuery, filters]);

  const createActions = (row: WantedProductItem): TableAction[] => [
    { 
      label: "Mark as Sourcing", 
      icon: <Search className="w-4 h-4 text-blue-600" />, 
      onClick: () => handleUpdateStatus(row, "SOURCING") 
    },
    { 
      label: "Mark as Fulfilled", 
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, 
      onClick: () => handleUpdateStatus(row, "FULFILLED") 
    },
    { 
      label: "Delete", 
      icon: <Trash2 className="w-4 h-4 text-red-500" />, 
      variant: "destructive", 
      onClick: () => handleDelete(row) 
    },
  ];

  const getStatusVariant = (status: string): StatusVariant => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "FULFILLED": return "success";
      case "SOURCING": return "info";
      case "NEW": return "notice";
      case "CANCELLED": return "danger";
      default: return "info";
    }
  };

  const formatStatusDisplay = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "FULFILLED": return "Fulfilled";
      case "SOURCING": return "Sourcing";
      case "NEW": return "New";
      case "CANCELLED": return "Cancelled";
      default: return status || "New";
    }
  };

  const columns: ColumnDef<WantedProductItem>[] = [
    {
      accessorKey: "productName",
      header: "Requested Product",
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.productName}</span>,
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {row.original.customerName}<br/>
          <span className="text-xs text-slate-400 font-normal">{row.original.customerPhone}</span>
        </span>
      ),
    },
    {
      accessorKey: "requestedDate",
      header: "Requested Date",
      cell: ({ row }) => {
        const date = new Date(row.original.requestedDate);
        return (
          <span className="text-slate-700 whitespace-nowrap">
            {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
            <span className="text-xs text-slate-400">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge 
          status={formatStatusDisplay(row.original.status)} 
          type={getStatusVariant(row.original.status)} 
        />
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.original.notes;
        if (!notes) return <span className="text-slate-400 text-xs italic">No notes</span>;
        if (notes.length > 30) {
          return (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger className="text-left max-w-[200px] truncate cursor-help text-slate-600 text-sm">
                  {notes}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{notes}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return <span className="text-slate-600 text-sm">{notes}</span>;
      }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <FilterBar 
          searchPlaceholder="Search product, customer..."
          filters={filterConfigs}
          onSearchChange={(val) => setSearchQuery(val)}
          onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
          onReset={() => {
            setSearchQuery("");
            setFilters({});
          }}
        />

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0 self-start sm:self-auto">
              <Plus className="w-4 h-4" /> Add Wanted Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Customer Wanted Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="wp-name">Product Name *</Label>
                <Input
                  id="wp-name"
                  placeholder="e.g. Pixel 8 Pro 128GB Bay Blue"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="wp-cname">Customer Name *</Label>
                  <Input
                    id="wp-cname"
                    placeholder="e.g. Rahim Ahmed"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wp-phone">Customer Phone *</Label>
                  <Input
                    id="wp-phone"
                    placeholder="01XXXXXXXXX"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="wp-notes">Notes / Requirements</Label>
                <Textarea
                  id="wp-notes"
                  placeholder="Any customer preferences, price target, or sourcing notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-sm text-slate-500">Loading wanted products...</span>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={filteredData} 
          pageSize={10}
        />
      )}
    </div>
  );
}
