"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import Image from "next/image";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  FolderTree,
  Upload,
  Search,
  Check,
  Layers,
  Sparkles,
  ExternalLink,
  Edit2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete, getImageUrl } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { slugify } from "@/lib/utils";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon?: string | null;
  image?: string | null;
  altTag?: string | null;
  description?: string | null;
  isGadget?: boolean;
  featured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  status: "ACTIVE" | "INACTIVE";
  _count?: { products: number; children?: number };
  children?: CategoryNode[];
}

export default function CategoryManagementPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();

  const [categoriesTree, setCategoriesTree] = useState<CategoryNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<CategoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [treeSearch, setTreeSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Form Mode: "create" | "edit"
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [createType, setCreateType] = useState<"root" | "child">("root");
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formAltTag, setFormAltTag] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formIsGadget, setFormIsGadget] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDescription, setFormDescription] = useState("");
  const [formMetaTitle, setFormMetaTitle] = useState("");
  const [formMetaDescription, setFormMetaDescription] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const [treeData, flatData] = await Promise.all([
        apiGet<CategoryNode[]>("/categories/tree"),
        apiGet<CategoryNode[]>("/categories"),
      ]);
      setCategoriesTree(treeData || []);
      setFlatCategories(flatData || []);

      // Auto-expand all root nodes by default
      if (treeData && treeData.length > 0) {
        setExpandedNodes(new Set(treeData.map((n) => n.id)));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setTitle("Category Management");
    setBadge("Categories");
    setDateFilter("");
    fetchCategories();
  }, [setTitle, setBadge, setDateFilter, fetchCategories]);

  // Name change handler with auto-slug
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (mode === "create") {
      setFormSlug(slugify(val));
    }
  };

  // Image Upload Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setFormImageFile(null);
    setPreviewImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Reset form back to fresh Create mode
  const handleResetForm = () => {
    setMode("create");
    setCreateType("root");
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormAltTag("");
    setFormParentId("");
    setFormFeatured(false);
    setFormIsGadget(false);
    setFormIsActive(true);
    setFormDescription("");
    setFormMetaTitle("");
    setFormMetaDescription("");
    setFormImageFile(null);
    setPreviewImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Select node from tree to load into Edit mode
  const handleSelectNodeForEdit = (node: CategoryNode) => {
    setMode("edit");
    setEditingCategory(node);
    setFormName(node.name || "");
    setFormSlug(node.slug || "");
    setFormAltTag(node.altTag || "");
    setFormParentId(node.parentId || "");
    setFormFeatured(!!node.featured);
    setFormIsGadget(!!node.isGadget);
    setFormIsActive(node.status === "ACTIVE");
    setFormDescription(node.description || "");
    setFormMetaTitle(node.metaTitle || "");
    setFormMetaDescription(node.metaDescription || "");
    setFormImageFile(null);
    setPreviewImageUrl(node.image ? getImageUrl(node.image) : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Tree Expand / Collapse
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const collect = (nodes: CategoryNode[]) => {
      nodes.forEach((n) => {
        allIds.add(n.id);
        if (n.children && n.children.length > 0) collect(n.children);
      });
    };
    collect(categoriesTree);
    setExpandedNodes(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Checkbox Selection for Bulk Actions
  const handleToggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Submit Form (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append("name", formName.trim());
      if (formSlug.trim()) formData.append("slug", formSlug.trim());
      if (formAltTag.trim()) formData.append("altTag", formAltTag.trim());
      if (formDescription.trim()) formData.append("description", formDescription.trim());
      formData.append("featured", String(formFeatured));
      formData.append("isGadget", String(formIsGadget));
      formData.append("status", formIsActive ? "ACTIVE" : "INACTIVE");
      if (formMetaTitle.trim()) formData.append("metaTitle", formMetaTitle.trim());
      if (formMetaDescription.trim()) formData.append("metaDescription", formMetaDescription.trim());

      if (mode === "create") {
        if (createType === "child" && formParentId) {
          formData.append("parentId", formParentId);
        }
      } else {
        if (formParentId) {
          formData.append("parentId", formParentId);
        } else {
          formData.append("parentId", "null");
        }
      }

      if (formImageFile) {
        formData.append("image", formImageFile);
      }

      if (mode === "create") {
        await apiPost("/categories", formData);
        toast.success(`Category "${formName}" created successfully!`);
      } else if (editingCategory) {
        await apiPatch(`/categories/${editingCategory.id}`, formData);
        toast.success(`Category "${formName}" updated successfully!`);
      }

      handleResetForm();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (checkedIds.length === 0) return;
    if (
      !confirm(
        `Delete ${checkedIds.length} selected category(ies)? This action cannot be undone.`
      )
    )
      return;

    try {
      setIsDeletingBulk(true);
      const res = await apiDelete<{ count: number }>("/categories/bulk", {
        body: JSON.stringify({ ids: checkedIds }),
      });

      toast.success(`${res.count || checkedIds.length} categories deleted successfully!`);
      setCheckedIds([]);
      if (editingCategory && checkedIds.includes(editingCategory.id)) {
        handleResetForm();
      }
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete selected categories");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!editingCategory) return;
    if (
      !confirm(
        `Are you sure you want to delete category "${editingCategory.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);
      await apiDelete(`/categories/${editingCategory.id}`);
      toast.success(`Category "${editingCategory.name}" deleted successfully.`);
      handleResetForm();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setIsSaving(false);
    }
  };

  // Tree filter logic
  const filteredTree = useMemo(() => {
    if (!treeSearch.trim()) return categoriesTree;
    const q = treeSearch.toLowerCase().trim();

    const filterNode = (node: CategoryNode): CategoryNode | null => {
      const nameMatches = node.name.toLowerCase().includes(q);
      const filteredChildren = (node.children || [])
        .map(filterNode)
        .filter(Boolean) as CategoryNode[];

      if (nameMatches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    };

    return categoriesTree.map(filterNode).filter(Boolean) as CategoryNode[];
  }, [categoriesTree, treeSearch]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: CategoryNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isChecked = checkedIds.includes(node.id);
    const isCurrentlyEditing = editingCategory?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="space-y-1">
        <div
          onClick={() => handleSelectNodeForEdit(node)}
          className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
            isCurrentlyEditing
              ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm"
              : isChecked
              ? "bg-emerald-50/40 border-emerald-300"
              : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/80"
          }`}
          style={{ marginLeft: `${depth * 18}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Checkbox for bulk delete */}
            <input
              type="checkbox"
              checked={isChecked}
              onClick={(e) => handleToggleCheck(node.id, e)}
              onChange={() => {}}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />

            {/* Expand / Collapse Chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}

            {/* Thumbnail preview */}
            <div className="relative w-6 h-6 rounded bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
              <Image
                src={node.image ? getImageUrl(node.image) : "/placeholder.png"}
                alt={node.name}
                fill
                sizes="24px"
                className="object-contain p-0.5"
              />
            </div>

            {/* Category Name */}
            <span
              className={`text-sm truncate ${
                isCurrentlyEditing
                  ? "font-bold text-emerald-900"
                  : "font-medium text-slate-800 group-hover:text-emerald-700"
              }`}
            >
              {node.name}
            </span>

            {/* Badges */}
            {node.featured && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                Featured
              </span>
            )}
            {node.isGadget && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                Gadget
              </span>
            )}
            {node.status === "INACTIVE" && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded">
                Inactive
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {node._count?.products !== undefined && (
              <span className="text-xs text-slate-400 font-medium">
                {node._count.products} products
              </span>
            )}
            <Edit2
              className={`w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                isCurrentlyEditing ? "opacity-100 text-emerald-600" : ""
              }`}
            />
          </div>
        </div>

        {/* Render nested children if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Category Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create and organize root & sub-categories, configure SEO, home section visibility, and descriptions.
        </p>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================================================================= */}
        {/* LEFT COLUMN: CREATE / EDIT CATEGORY FORM                          */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            {/* Card Top Title & Mode Selector */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {mode === "edit"
                    ? `Edit Category: ${editingCategory?.name}`
                    : createType === "root"
                    ? "Create New Root Category"
                    : "Create New Child Category"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mode === "edit"
                    ? "Modify details and save updates to catalog tree"
                    : "Configure basic details, status, and rich description"}
                </p>
              </div>

              {mode === "create" ? (
                /* Root / Child Pill Toggle */
                <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCreateType("root")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      createType === "root"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Root
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateType("child")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      createType === "child"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Child
                  </button>
                </div>
              ) : (
                /* Cancel Edit Button */
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetForm}
                  className="rounded-xl border-slate-200 text-xs text-slate-600 gap-1 h-8"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Edit</span>
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5">
              {/* Category Icon / 1:1 Image Box */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">
                  Category Icon <span className="text-slate-400 font-normal">(Image 1:1)</span>
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-400 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group"
                  >
                    {previewImageUrl ? (
                      <>
                        <Image
                          src={previewImageUrl}
                          alt="Category icon preview"
                          fill
                          sizes="96px"
                          className="object-contain p-2"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                          Change
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 mb-1 transition-colors" />
                        <span className="text-[11px] font-medium text-slate-500">Select</span>
                      </>
                    )}
                  </div>

                  {previewImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearImage}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                    >
                      Remove Icon
                    </Button>
                  )}
                </div>
              </div>

              {/* Name, Slug, Alt Tag Inputs */}
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Smartphones"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="bg-slate-50 border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    URL Slug <span className="text-slate-400 font-normal">(Optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. smartphones"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="bg-slate-50 border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Image Alt Tag <span className="text-slate-400 font-normal">(SEO)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Official Smartphone Collection Bangladesh"
                    value={formAltTag}
                    onChange={(e) => setFormAltTag(e.target.value)}
                    className="bg-slate-50 border-slate-200 rounded-xl text-sm"
                  />
                </div>

                {/* Parent Select (Shown in Child mode or when editing) */}
                {(createType === "child" || mode === "edit") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Parent Category {createType === "child" && <span className="text-red-500">*</span>}
                    </Label>
                    <select
                      value={formParentId}
                      onChange={(e) => setFormParentId(e.target.value)}
                      required={createType === "child" && mode === "create"}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- No Parent (Root Level) --</option>
                      {flatCategories
                        .filter((c) => (mode === "edit" ? c.id !== editingCategory?.id : true))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Row of 3 Toggles: Featured, Is Gadget, Active */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                {/* 1. Featured */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 cursor-pointer">
                      Featured
                    </Label>
                    <Switch
                      checked={formFeatured}
                      onCheckedChange={setFormFeatured}
                      className="data-[state=checked]:bg-amber-500 scale-90"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Home section</p>
                </div>

                {/* 2. Is Gadget */}
                <div className="flex flex-col gap-1.5 border-l border-slate-200 pl-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 cursor-pointer">
                      Is Gadget
                    </Label>
                    <Switch
                      checked={formIsGadget}
                      onCheckedChange={setFormIsGadget}
                      className="data-[state=checked]:bg-purple-600 scale-90"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Gadget section</p>
                </div>

                {/* 3. Active */}
                <div className="flex flex-col gap-1.5 border-l border-slate-200 pl-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 cursor-pointer">
                      Active
                    </Label>
                    <Switch
                      checked={formIsActive}
                      onCheckedChange={setFormIsActive}
                      className="data-[state=checked]:bg-emerald-600 scale-90"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Live status</p>
                </div>
              </div>

              {/* Tabs: Description (Rich-Text) & SEO Optimization */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger value="description" className="rounded-lg text-xs font-semibold">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="rounded-lg text-xs font-semibold">
                    SEO Optimization
                  </TabsTrigger>
                </TabsList>

                {/* Description Tab with Reusable RichTextEditor */}
                <TabsContent value="description" className="mt-3 space-y-2">
                  <RichTextEditor
                    value={formDescription}
                    onChange={setFormDescription}
                    placeholder="Write detailed category description, key specs, and warranty details..."
                  />
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="mt-3 space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Meta Title</Label>
                    <Input
                      placeholder="e.g. Buy Authentic Smartphones Online — mobilehubbd"
                      value={formMetaTitle}
                      onChange={(e) => setFormMetaTitle(e.target.value)}
                      className="bg-slate-50 border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Meta Description</Label>
                    <Textarea
                      placeholder="e.g. Shop the latest authentic smartphones with official warranty and instant doorstep delivery."
                      value={formMetaDescription}
                      onChange={(e) => setFormMetaDescription(e.target.value)}
                      rows={3}
                      className="bg-slate-50 border-slate-200 rounded-xl text-sm resize-none"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Submit / Reset Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 font-semibold shadow-sm"
                >
                  {isSaving
                    ? "Saving..."
                    : mode === "create"
                    ? "Submit"
                    : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetForm}
                  className="rounded-xl border-slate-200 text-slate-600 px-6 font-semibold"
                >
                  Reset
                </Button>
                {mode === "edit" && editingCategory && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSaving}
                    onClick={handleDeleteSingle}
                    className="rounded-xl px-4 font-semibold ml-auto"
                  >
                    Delete Category
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: CATEGORY TREE                                       */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            {/* Top Row: Delete Selected Button */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="destructive"
                disabled={checkedIds.length === 0 || isDeletingBulk}
                onClick={handleBulkDelete}
                className="rounded-xl text-xs font-semibold gap-1.5 shadow-sm disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isDeletingBulk
                    ? "Deleting..."
                    : `Delete Selected (${checkedIds.length})`}
                </span>
              </Button>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Expand All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="text-slate-500 hover:underline font-semibold"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Search Input for Tree */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search category tree..."
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-sm"
              />
            </div>

            {/* Tree Structure Header */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">
              <span>STRUCTURE</span>
              <span>ITEMS</span>
            </div>

            {/* Tree Container */}
            <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <FolderTree className="w-8 h-8 animate-pulse mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs">Loading category tree...</p>
                </div>
              ) : filteredTree.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                  <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold text-slate-600">No categories found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Use the left form to create your first root category</p>
                </div>
              ) : (
                filteredTree.map((rootNode) => renderTreeNode(rootNode, 0))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
