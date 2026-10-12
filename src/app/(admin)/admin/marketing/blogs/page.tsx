"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable } from "@/components/admin/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPatch, apiDelete, getImageUrl } from "@/lib/api-client";
import { format, formatDistanceToNow } from "date-fns";

export interface BlogAdminRecord {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  thumbnailUrl?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  tags?: string[];
  views: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
}

export default function BlogsPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<BlogAdminRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/blogs/admin");
      const list = Array.isArray(res) ? res : res?.data || [];
      setData(list);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load blogs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTitle("Blogs");
    setBadge("Marketing");
    setDateFilter("");
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await apiDelete(`/blogs/${id}`);
      toast.success("Blog post deleted");
      fetchBlogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete blog post");
    }
  };

  const handleToggleStatus = async (blog: BlogAdminRecord) => {
    const nextStatus = blog.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await apiPatch(`/blogs/${blog.id}`, { status: nextStatus });
      toast.success(`Post is now ${nextStatus.toLowerCase()}`);
      setData((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, status: nextStatus } : b))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const columns: ColumnDef<BlogAdminRecord>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-500">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "coverImage",
      header: "THUMBNAIL",
      cell: ({ row }) => {
        const img = row.original.coverImage || row.original.thumbnailUrl;
        return (
          <div className="w-16 h-10 rounded overflow-hidden relative border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
            {img ? (
              <img
                src={getImageUrl(img)}
                alt={row.original.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-4 h-4 text-slate-400" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "TITLE",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-800 line-clamp-1 max-w-[280px]">
          {row.original.title}
        </span>
      ),
    },
    {
      id: "category",
      header: "CATEGORY",
      cell: ({ row }) => {
        const catName = row.original.category?.name || "Uncategorized";
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200 text-xs font-medium">
            {catName}
          </Badge>
        );
      },
    },
    {
      accessorKey: "views",
      header: "VIEWS",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-600">
          {(row.original.views || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "CREATED DATE",
      cell: ({ row }) => {
        try {
          const date = new Date(row.original.createdAt);
          return (
            <div>
              <span className="text-xs text-slate-700 font-medium">
                {format(date, "dd MMM yyyy")}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {formatDistanceToNow(date, { addSuffix: true })}
              </span>
            </div>
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
          checked={row.original.status === "PUBLISHED"}
          onCheckedChange={() => handleToggleStatus(row.original)}
        />
      ),
    },
    {
      id: "action",
      header: "ACTION",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <a
            href={`/blog/${row.original.slug}`}
            target="_blank"
            rel="noreferrer"
            title="View on Website"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </a>
          <Link href={`/admin/marketing/blogs/create?editId=${row.original.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              title="Edit Blog"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete Blog"
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
          <h2 className="text-base font-bold text-slate-800">Blogs</h2>
          <p className="text-xs text-slate-500">Publish articles, tech guides, and updates</p>
        </div>
        <Link href="/admin/marketing/blogs/create">
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
