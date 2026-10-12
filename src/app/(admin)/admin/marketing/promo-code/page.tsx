"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable } from "@/components/admin/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client";
import { format } from "date-fns";

export interface PromoCodeRecord {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED" | string;
  discountValue: number;
  maxDiscountCap?: number | null;
  minOrderAmount?: number | null;
  perCustomerLimit?: number | null;
  singleUserLimit?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
}

export default function PromoCodePage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<PromoCodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<PromoCodeRecord[]>("/promo-codes");
      setData(res || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load promo codes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTitle("Promo Code");
    setBadge("Marketing");
    setDateFilter("");
    fetchPromoCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await apiDelete(`/promo-codes/${id}`);
      toast.success("Promo code deleted");
      fetchPromoCodes();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete promo code");
    }
  };

  const handleToggleStatus = async (promo: PromoCodeRecord) => {
    const nextStatus = promo.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiPatch(`/promo-codes/${promo.id}`, { status: nextStatus });
      toast.success(`Coupon is now ${nextStatus.toLowerCase()}`);
      setData((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, status: nextStatus } : p))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const columns: ColumnDef<PromoCodeRecord>[] = [
    {
      accessorKey: "code",
      header: "CODE",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "discountValue",
      header: "DISCOUNT",
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600">
          {row.original.discountType === "PERCENTAGE"
            ? `${row.original.discountValue}%`
            : `৳${Number(row.original.discountValue).toLocaleString()}`}
        </span>
      ),
    },
    {
      accessorKey: "minOrderAmount",
      header: "MIN AMOUNT",
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.original.minOrderAmount
            ? `৳${Number(row.original.minOrderAmount).toLocaleString()}`
            : "0"}
        </span>
      ),
    },
    {
      accessorKey: "validFrom",
      header: "STARTED AT",
      cell: ({ row }) => {
        try {
          return (
            <span className="text-xs text-slate-600">
              {format(new Date(row.original.validFrom), "dd MMM yyyy, hh:mm a")}
            </span>
          );
        } catch {
          return <span className="text-xs text-slate-400">-</span>;
        }
      },
    },
    {
      accessorKey: "validUntil",
      header: "EXPIRED AT",
      cell: ({ row }) => {
        try {
          return (
            <span className="text-xs text-slate-600">
              {format(new Date(row.original.validUntil), "dd MMM yyyy, hh:mm a")}
            </span>
          );
        } catch {
          return <span className="text-xs text-slate-400">-</span>;
        }
      },
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => (
        <Switch
          checked={row.original.status === "ACTIVE"}
          onCheckedChange={() => handleToggleStatus(row.original)}
        />
      ),
    },
    {
      id: "action",
      header: "ACTION",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete Promo Code"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header without KPI cards */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">Promo Code</h2>
          <p className="text-xs text-slate-500">Manage promotional discounts and coupon codes</p>
        </div>
        <Link href="/admin/marketing/promo-code/create">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9">
            <Plus className="w-4 h-4 mr-1.5" /> + Create New
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <DataTable columns={columns} data={data} isLoading={isLoading} />
      </div>
    </div>
  );
}
