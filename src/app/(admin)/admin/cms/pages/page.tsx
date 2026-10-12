"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { apiGet, apiDelete } from "@/lib/api-client";
import { AccessDenied } from "@/components/admin/AccessDenied";

export interface PageRecord {
  id: string;
  title: string;
  slug: string;
  content: string;
  isSystem: boolean;
  status: "PUBLISHED" | "DRAFT";
  updatedAt: string;
}

// 5 hardcoded system-route rows per Eastern Mobile reference
const SYSTEM_PAGES = [
  { id: "sys-1", title: "Products", url: "/category/all", isSystemRoute: true },
  { id: "sys-2", title: "Most Popular", url: "/category/all?filter=popular", isSystemRoute: true },
  { id: "sys-3", title: "Best Deal", url: "/category/all?filter=deals", isSystemRoute: true },
  { id: "sys-4", title: "Contact", url: "/contact", isSystemRoute: true },
  { id: "sys-5", title: "Blogs", url: "/blog", isSystemRoute: true },
];

const PROTECTED_SLUGS = new Set([
  "about",
  "about-us",
  "privacy",
  "privacy-policy",
  "terms",
  "terms-conditions",
  "terms-of-service",
  "refund-policy",
]);

export default function PagesManagementPage() {
  const router = useRouter();
  const { setTitle } = useAdminPage();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<PageRecord[]>("/pages");
      setPages(data || []);
    } catch (e: any) {
      if (e.status === 403 || e.message?.includes("Forbidden") || e.message?.includes("restricted")) {
        setIsForbidden(true);
      } else {
        toast.error(e.message || "Failed to load CMS pages");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isForbidden) {
    return (
      <AccessDenied
        moduleName="CMS"
        message="Access restricted: Only Global Administrators can access or modify CMS pages."
      />
    );
  }

  useEffect(() => {
    setTitle("Pages");
    fetchPages();
  }, [setTitle]);

  const handleDelete = async (page: PageRecord) => {
    if (page.isSystem || PROTECTED_SLUGS.has(page.slug)) {
      toast.error("Protected system page cannot be deleted");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${page.title}"?`)) return;

    try {
      await apiDelete(`/pages/${page.id}`);
      toast.success(`Page "${page.title}" deleted successfully`);
      fetchPages();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete page");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pages</h1>
          <p className="text-xs text-slate-500">Manage standard routing pages and custom rich CMS content</p>
        </div>
        <Button
          onClick={() => router.push("/admin/cms/pages/create")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 gap-2 rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New
        </Button>
      </div>

      {/* Pages Table Card */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-16 font-bold text-xs text-slate-600">SL</TableHead>
                <TableHead className="font-bold text-xs text-slate-600">NAME</TableHead>
                <TableHead className="font-bold text-xs text-slate-600">URL</TableHead>
                <TableHead className="w-32 text-right font-bold text-xs text-slate-600">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 1. System routes (Products, Most Popular, Best Deal, Contact, Blogs) */}
              {SYSTEM_PAGES.map((sp, idx) => (
                <TableRow key={sp.id} className="hover:bg-slate-50/40 bg-slate-50/20">
                  <TableCell className="text-xs font-medium text-slate-400">{idx + 1}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">{sp.title}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-500">{sp.url}</TableCell>
                  <TableCell className="text-right">
                    <span className="italic text-slate-400 text-xs font-normal">No action</span>
                  </TableCell>
                </TableRow>
              ))}

              {/* 2. CMS Database pages */}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((p, idx) => {
                  const isProtected = p.isSystem || PROTECTED_SLUGS.has(p.slug);
                  const pageUrl = `/pages/${p.slug}`;

                  return (
                    <TableRow key={p.id} className="hover:bg-slate-50/60">
                      <TableCell className="text-xs font-medium text-slate-500">
                        {SYSTEM_PAGES.length + idx + 1}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {p.title}
                        {p.status === "DRAFT" && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Draft
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{pageUrl}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={pageUrl}
                            target="_blank"
                            title="View Page"
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/admin/cms/pages/create?edit=${p.id}`}
                            title="Edit Page"
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 flex items-center justify-center transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>

                          {!isProtected && (
                            <button
                              onClick={() => handleDelete(p)}
                              title="Delete Page"
                              className="w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
