"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { apiGet, apiPost, apiPatch } from "@/lib/api-client";
import Link from "next/link";

function PageCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const { setTitle } = useAdminPage();
  const [title, setPageTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(editId ? "Edit Page" : "Add New Page");
    if (editId) {
      loadPage(editId);
    }
  }, [editId, setTitle]);

  const loadPage = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>(`/pages/${id}`);
      if (data) {
        setPageTitle(data.title || "");
        setContent(data.content || "");
        setStatus(data.status || "PUBLISHED");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load page data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Page Name is required");
      return;
    }
    if (!content.trim() || content === "<p></p>") {
      toast.error("Page content is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editId) {
        await apiPatch(`/pages/${editId}`, {
          title: title.trim(),
          content,
          status,
        });
        toast.success("Page updated successfully");
      } else {
        await apiPost("/pages", {
          title: title.trim(),
          content,
          status,
        });
        toast.success("Page created successfully");
      }
      router.push("/admin/cms/pages");
    } catch (err: any) {
      toast.error(err.message || "Failed to save page");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/cms/pages"
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {editId ? "Edit Page" : "Add New Page"}
            </h1>
            <p className="text-xs text-slate-500">
              {editId ? "Update custom CMS page information" : "Create a new custom CMS page with rich formatting"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6">
            <CardTitle className="text-sm font-bold text-slate-800">Page Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Page Name</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="e.g. Return & Refund Policy"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Status</Label>
                <Select
                  value={status}
                  onValueChange={(val: "PUBLISHED" | "DRAFT") => setStatus(val)}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Content</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write page content with headings, bold text, lists..."
                minHeight="min-h-[260px]"
                maxHeight="max-h-[480px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/cms/pages")}
            className="text-xs h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-8 gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Submit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function PageCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <PageCreateForm />
    </Suspense>
  );
}
