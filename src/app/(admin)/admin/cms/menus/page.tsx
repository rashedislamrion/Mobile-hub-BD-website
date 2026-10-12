"use client";

import React, { useState, useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Save,
  RotateCcw,
  Plus,
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

interface PageSource {
  id: string;
  name: string;
  slug: string;
  alreadyAdded: boolean;
}

interface CategorySource {
  id: string;
  name: string;
  slug: string;
  parentLabel: string;
}

interface MenuStructureItem {
  id: string;
  menuType: string;
  sourceType: "PAGE" | "CATEGORY" | "CUSTOM";
  sourceId?: string | null;
  urlSlug: string;
  navigationLabel: string;
  titleAttribute?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function CmsMenusPage() {
  const { setTitle } = useAdminPage();
  const [isLoading, setIsLoading] = useState(true);

  // Source data
  const [pages, setPages] = useState<PageSource[]>([]);
  const [categories, setCategories] = useState<CategorySource[]>([]);
  const [activeItems, setActiveItems] = useState<MenuStructureItem[]>([]);
  const [inactiveItems, setInactiveItems] = useState<MenuStructureItem[]>([]);

  // Selection states for left panels
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [customLink, setCustomLink] = useState({ url: "", label: "" });

  // Accordion expansion state: map itemId -> boolean
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  // Form editing cache for each item: map itemId -> { urlSlug, navigationLabel, titleAttribute }
  const [itemEdits, setItemEdits] = useState<Record<string, any>>({});

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setTitle("Menus");
    loadBuilderData();
  }, [setTitle]);

  const loadBuilderData = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/menus/builder");
      if (data) {
        setPages(data.pages || []);
        setCategories(data.categories || []);
        setActiveItems(data.activeItems || []);
        setInactiveItems(data.inactiveItems || []);

        // Initialize edit states
        const edits: Record<string, any> = {};
        [...(data.activeItems || []), ...(data.inactiveItems || [])].forEach((item: MenuStructureItem) => {
          edits[item.id] = {
            urlSlug: item.urlSlug,
            navigationLabel: item.navigationLabel,
            titleAttribute: item.titleAttribute || "",
          };
        });
        setItemEdits(edits);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load menu builder");
    } finally {
      setIsLoading(false);
    }
  };

  // Select all helpers
  const handleSelectAllPages = () => {
    if (selectedPageIds.length === pages.length) {
      setSelectedPageIds([]);
    } else {
      setSelectedPageIds(pages.map((p) => p.id));
    }
  };

  const handleSelectAllCategories = () => {
    if (selectedCategoryIds.length === categories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(categories.map((c) => c.id));
    }
  };

  // Add handlers
  const handleAddPages = async () => {
    if (selectedPageIds.length === 0) {
      toast.error("Please select at least one page");
      return;
    }
    try {
      await apiPost("/menus/builder/add", {
        sourceType: "PAGE",
        sourceIds: selectedPageIds,
      });
      setSelectedPageIds([]);
      toast.success("Pages added to menu");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add pages to menu");
    }
  };

  const handleAddCategories = async () => {
    if (selectedCategoryIds.length === 0) {
      toast.error("Please select at least one category");
      return;
    }
    try {
      await apiPost("/menus/builder/add", {
        sourceType: "CATEGORY",
        sourceIds: selectedCategoryIds,
      });
      setSelectedCategoryIds([]);
      toast.success("Categories added to menu");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add categories to menu");
    }
  };

  const handleAddCustomLink = async () => {
    if (!customLink.url.trim() || !customLink.label.trim()) {
      toast.error("URL and Link Text are required");
      return;
    }
    try {
      await apiPost("/menus/builder/add", {
        sourceType: "CUSTOM",
        url: customLink.url.trim(),
        label: customLink.label.trim(),
      });
      setCustomLink({ url: "", label: "" });
      toast.success("Custom link added to menu");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add custom link");
    }
  };

  // Item accordion actions
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleItemFieldChange = (id: string, field: string, value: string) => {
    setItemEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveItem = async (id: string) => {
    const edit = itemEdits[id];
    if (!edit) return;

    try {
      await apiPatch(`/menus/builder/${id}`, {
        urlSlug: edit.urlSlug,
        navigationLabel: edit.navigationLabel,
        titleAttribute: edit.titleAttribute,
      });
      toast.success("Menu item updated");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update menu item");
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await apiPatch(`/menus/builder/${id}/remove`, {});
      toast.success("Item moved to Inactive Menus");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove item");
    }
  };

  const handleRestoreItem = async (id: string) => {
    try {
      await apiPatch(`/menus/builder/${id}/restore`, {});
      toast.success("Item restored to active Menu Structure");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to restore item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this menu item?")) return;
    try {
      await apiDelete(`/menus/builder/${id}`);
      toast.success("Menu item deleted permanently");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  // Native HTML5 Drag and Drop handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const reordered = [...activeItems];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setActiveItems(reordered);
    setDraggedIndex(null);

    try {
      await apiPatch("/menus/builder/reorder", {
        orderedIds: reordered.map((item) => item.id),
      });
      toast.success("Menu order updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to reorder items");
      loadBuilderData();
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
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Menus</h1>
        <p className="text-xs text-slate-500">
          Build and organize the storefront navigation menu using pages, categories, and custom links
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ===================== LEFT COLUMN: SOURCES ===================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Pages Card */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Pages</CardTitle>
              <button
                type="button"
                onClick={handleSelectAllPages}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {selectedPageIds.length === pages.length && pages.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {pages.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No pages available</p>
                ) : (
                  pages.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <Checkbox
                        checked={selectedPageIds.includes(p.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPageIds((prev) => [...prev, p.id]);
                          } else {
                            setSelectedPageIds((prev) => prev.filter((id) => id !== p.id));
                          }
                        }}
                      />
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-slate-400 text-[11px] truncate">(/pages/{p.slug})</span>
                      {p.alreadyAdded && (
                        <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                          Added
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleAddPages}
                  disabled={selectedPageIds.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-4"
                >
                  Add to Menu
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Categories Card */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Categories</CardTitle>
              <button
                type="button"
                onClick={handleSelectAllCategories}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {selectedCategoryIds.length === categories.length && categories.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No categories available</p>
                ) : (
                  categories.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <Checkbox
                        checked={selectedCategoryIds.includes(c.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategoryIds((prev) => [...prev, c.id]);
                          } else {
                            setSelectedCategoryIds((prev) => prev.filter((id) => id !== c.id));
                          }
                        }}
                      />
                      <span className="font-medium text-slate-800">{c.parentLabel}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleAddCategories}
                  disabled={selectedCategoryIds.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-4"
                >
                  Add to Menu
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3. Custom Links Card */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
              <CardTitle className="text-sm font-bold text-slate-800">Custom Links</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">URL</Label>
                <Input
                  value={customLink.url}
                  onChange={(e) => setCustomLink({ ...customLink, url: e.target.value })}
                  placeholder="https:// or /path"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Link Text</Label>
                <Input
                  value={customLink.label}
                  onChange={(e) => setCustomLink({ ...customLink, label: e.target.value })}
                  placeholder="e.g. Special Offers"
                  className="h-9 text-xs"
                />
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleAddCustomLink}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-4"
                >
                  Add to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===================== RIGHT COLUMN: STRUCTURE ===================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Menu Structure Card */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-6">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Menu Structure</CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Drag to reorder. Use accordion arrows to edit.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {activeItems.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No active menu items. Add pages, categories, or custom links from the left panel.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeItems.map((item, index) => {
                    const isExpanded = !!expandedItems[item.id];
                    const edit = itemEdits[item.id] || {
                      urlSlug: item.urlSlug,
                      navigationLabel: item.navigationLabel,
                      titleAttribute: item.titleAttribute || "",
                    };

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, index)}
                        onDragOver={(e) => onDragOver(e, index)}
                        onDrop={(e) => onDrop(e, index)}
                        className={`border rounded-xl transition-all overflow-hidden ${
                          isExpanded
                            ? "border-emerald-500 bg-white shadow-sm"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                        } ${draggedIndex === index ? "opacity-50 border-emerald-300" : ""}`}
                      >
                        {/* Accordion Header */}
                        <div
                          onClick={() => toggleExpand(item.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-0.5"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {edit.navigationLabel || item.navigationLabel}
                            </span>
                            {item.sourceType === "CUSTOM" && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                Custom
                              </span>
                            )}
                            {item.sourceType === "CATEGORY" && (
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                Category
                              </span>
                            )}
                            {item.sourceType === "PAGE" && (
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                Page
                              </span>
                            )}
                          </div>

                          <button type="button" className="text-slate-400 hover:text-slate-600">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="p-4 pt-2 border-t border-slate-100 space-y-4 bg-white">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-700">URL / Slug</Label>
                              <Input
                                value={edit.urlSlug}
                                onChange={(e) => handleItemFieldChange(item.id, "urlSlug", e.target.value)}
                                className="h-9 text-xs font-mono"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Navigation Label</Label>
                                <Input
                                  value={edit.navigationLabel}
                                  onChange={(e) =>
                                    handleItemFieldChange(item.id, "navigationLabel", e.target.value)
                                  }
                                  className="h-9 text-xs"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Title Attribute</Label>
                                <Input
                                  value={edit.titleAttribute}
                                  onChange={(e) =>
                                    handleItemFieldChange(item.id, "titleAttribute", e.target.value)
                                  }
                                  placeholder="Optional tooltip"
                                  className="h-9 text-xs"
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-xs h-8 text-slate-600 border-slate-200 hover:bg-slate-100"
                                >
                                  Remove
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-xs h-8 text-red-500 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>

                              <Button
                                type="button"
                                onClick={() => handleSaveItem(item.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-4 gap-1.5"
                              >
                                <Save className="w-3.5 h-3.5" /> Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inactive Menus Section */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-6">
              <div>
                <CardTitle className="text-sm font-bold text-slate-700">Inactive Menus</CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Items removed from active navigation. Restore to bring back or delete permanently.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {inactiveItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No inactive menu items</p>
              ) : (
                <div className="space-y-3">
                  {inactiveItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-slate-700">
                          {item.navigationLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">({item.urlSlug})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRestoreItem(item.id)}
                          className="text-xs h-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-2.5 gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-xs h-7 text-red-500 border-red-200 hover:bg-red-50 px-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
