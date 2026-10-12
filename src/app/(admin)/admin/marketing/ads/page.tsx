"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable } from "@/components/admin/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPatch, apiDelete, getImageUrl } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export interface AdRecord {
  id: string;
  title: string;
  imageUrl: string;
  mobileThumbnailUrl?: string | null;
  isFeatured: boolean;
  status: "ACTIVE" | "INACTIVE";
  placement?: string;
  linkUrl?: string | null;
  createdAt: string;
}

export default function AdsPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<AdRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<AdRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<AdRecord[]>("/ads");
      setData(res || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load ads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTitle("Ads");
    setBadge("Marketing");
    setDateFilter("");
    fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: "ACTIVE" | "INACTIVE") => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiPatch(`/ads/${id}`, { status: nextStatus });
      toast.success(`Ad is now ${nextStatus.toLowerCase()}`);
      setData((prev) => prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update ad status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    try {
      await apiDelete(`/ads/${id}`);
      toast.success("Ad deleted");
      fetchAds();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete ad");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingAd) return;
    setIsUpdating(true);
    try {
      await apiPatch(`/ads/${editingAd.id}`, {
        title: editingAd.title,
        isFeatured: editingAd.isFeatured,
      });
      toast.success("Ad updated successfully");
      setIsEditDialogOpen(false);
      fetchAds();
    } catch (err: any) {
      toast.error(err.message || "Failed to update ad");
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: ColumnDef<AdRecord>[] = [
    {
      accessorKey: "imageUrl",
      header: "THUMBNAIL",
      cell: ({ row }) => (
        <div className="w-16 h-10 rounded overflow-hidden relative border border-slate-200 bg-slate-50 flex items-center justify-center">
          {row.original.imageUrl ? (
            <img
              src={getImageUrl(row.original.imageUrl)}
              alt={row.original.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-4 h-4 text-slate-400" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "mobileThumbnailUrl",
      header: "MOBILE THUMBNAIL",
      cell: ({ row }) => {
        const url = row.original.mobileThumbnailUrl;
        if (!url) return <span className="text-slate-400 font-medium">-</span>;
        return (
          <div className="w-10 h-10 rounded overflow-hidden relative border border-slate-200 bg-slate-50 flex items-center justify-center">
            <img src={getImageUrl(url)} alt="Mobile ad" className="w-full h-full object-cover" />
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "TITLE",
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.title}</span>,
    },
    {
      accessorKey: "isFeatured",
      header: "IS FEATURED",
      cell: ({ row }) => {
        const isF = row.original.isFeatured;
        return isF ? (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs font-semibold">
            Yes
          </Badge>
        ) : (
          <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200 text-xs font-semibold">
            No
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => (
        <Switch
          checked={row.original.status === "ACTIVE"}
          onCheckedChange={() => handleToggleStatus(row.original.id, row.original.status)}
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
            onClick={() => {
              setEditingAd(row.original);
              setIsEditDialogOpen(true);
            }}
            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            title="Edit Ad"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete Ad"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Ads List <span className="text-xs font-normal text-slate-500">(max 2 ads show in home page)</span>
          </h2>
          <p className="text-xs text-slate-500">Manage your promotional advertisement campaigns</p>
        </div>
        <Link href="/admin/marketing/ads/create">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9">
            <Plus className="w-4 h-4 mr-1.5" /> + Create New
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <DataTable columns={columns} data={data} isLoading={isLoading} />
      </div>

      {/* Optional Edit Modal for quick title/featured updates */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Ad</DialogTitle>
          </DialogHeader>
          {editingAd && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Title</label>
                <Input
                  value={editingAd.title}
                  onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="edit-isFeatured"
                  checked={editingAd.isFeatured}
                  onCheckedChange={(checked) =>
                    setEditingAd({ ...editingAd, isFeatured: Boolean(checked) })
                  }
                />
                <label htmlFor="edit-isFeatured" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Is Featured (max 2 ads show in home page)
                </label>
              </div>

              <DialogFooter className="pt-3">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
