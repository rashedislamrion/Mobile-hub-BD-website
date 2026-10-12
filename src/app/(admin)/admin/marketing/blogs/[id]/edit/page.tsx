"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api-client";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const { setTitle, setBadge } = useAdminPage();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    author: "",
    category: "",
    coverImage: "",
    status: "PUBLISHED" as "PUBLISHED" | "DRAFT",
  });

  useEffect(() => {
    const fetchBlog = async () => {
      setIsLoading(true);
      try {
        const data = await apiGet<any>(`/blogs/${params.id}`);
        if (data) {
          setFormData({
            title: data.title || "",
            slug: data.slug || "",
            content: data.content || "",
            excerpt: data.excerpt || "",
            author: data.author || "",
            category: data.category || "",
            coverImage: data.coverImage || "",
            status: data.status || "PUBLISHED",
          });
          setTitle(`Edit: ${data.title}`);
        }
      } catch (err: any) {
        toast.error("Failed to load blog article");
      } finally {
        setIsLoading(false);
      }
    };

    setBadge("Marketing");
    if (params.id) {
      fetchBlog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setFormData({ ...formData, title, slug });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    setIsSaving(true);
    try {
      await apiPatch(`/blogs/${params.id}`, {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || undefined,
        author: formData.author.trim() || undefined,
        category: formData.category.trim() || undefined,
        coverImage: formData.coverImage.trim() || undefined,
        status: formData.status,
      });
      toast.success("Blog post updated successfully!");
      router.push("/admin/marketing/blogs");
    } catch (err: any) {
      toast.error(err.message || "Failed to update article");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Loading article...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/marketing/blogs")}
            className="text-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-base font-bold text-slate-800">Edit Blog Article</h2>
          </div>
        </div>

        <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-1.5"><Save className="w-4 h-4" /> Save Article</span>}
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl border space-y-4 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Article Title *</label>
          <Input
            value={formData.title}
            onChange={handleTitleChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">URL Slug</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Author Name</label>
            <Input
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Category</label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Status</label>
            <Select
              value={formData.status}
              onValueChange={(val: any) => setFormData({ ...formData, status: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Cover Image URL</label>
          <Input
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Excerpt / Preview Text</label>
          <Input
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Full HTML Content *</label>
          <Textarea
            rows={12}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
          />
        </div>
      </div>
    </form>
  );
}
