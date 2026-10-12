"use client";

import React, { useState, useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  EyeOff,
  Building2,
  ExternalLink,
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

interface SourceItem {
  id: string;
  name: string;
  url: string;
  sourceType: string;
}

interface FooterItem {
  id: string;
  footerColumnId: string;
  sourceType: string; // 'MENU' | 'PAGE' | 'BRANCH' | 'CUSTOM'
  sourceId?: string | null;
  navigationLabel: string;
  url?: string | null;
  extraData?: Record<string, any> | null;
  sortOrder: number;
  isActive: boolean;
}

interface FooterColumn {
  id: string;
  key: string;
  title: string;
  sortOrder: number;
  items: FooterItem[];
}

export default function CmsFooterBuilderPage() {
  const { setTitle } = useAdminPage();
  const [isLoading, setIsLoading] = useState(true);

  // Top cards data
  const [availableMenus, setAvailableMenus] = useState<SourceItem[]>([]);
  const [availablePages, setAvailablePages] = useState<SourceItem[]>([]);
  const [disabledItems, setDisabledItems] = useState<any[]>([]);

  // 4 Columns data
  const [columns, setColumns] = useState<FooterColumn[]>([]);

  // Available real branches for branch picker
  const [branches, setBranches] = useState<any[]>([]);
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);

  // Generic Add Item Dialog state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [targetColumnKey, setTargetColumnKey] = useState<string>("quick_links");
  const [newItemForm, setNewItemForm] = useState({
    sourceType: "CUSTOM",
    navigationLabel: "",
    url: "",
  });

  // Accordion state: itemId -> boolean
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  // Item edit cache: itemId -> { navigationLabel, url, extraData }
  const [itemEdits, setItemEdits] = useState<Record<string, any>>({});

  // Drag state for reordering within columns
  const [dragInfo, setDragInfo] = useState<{ columnKey: string; itemIndex: number } | null>(null);

  useEffect(() => {
    setTitle("Footer");
    loadBuilderData();
    loadBranches();
  }, [setTitle]);

  const loadBuilderData = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/footer/builder");
      if (data) {
        setAvailableMenus(data.availableMenus || []);
        setAvailablePages(data.availablePages || []);
        setColumns(data.columns || []);
        setDisabledItems(data.disabledItems || []);

        // Initialize edit states
        const edits: Record<string, any> = {};
        (data.columns || []).forEach((col: FooterColumn) => {
          (col.items || []).forEach((item: FooterItem) => {
            edits[item.id] = {
              navigationLabel: item.navigationLabel,
              url: item.url || "",
              extraData: item.extraData ? { ...item.extraData } : {},
            };
          });
        });
        (data.disabledItems || []).forEach((item: any) => {
          edits[item.id] = {
            navigationLabel: item.navigationLabel,
            url: item.url || "",
            extraData: item.extraData ? { ...item.extraData } : {},
          };
        });
        setItemEdits(edits);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load footer builder");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const data = await apiGet<any[]>("/branches/public");
      setBranches(data || []);
    } catch {
      // ignore
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditChange = (id: string, field: string, value: any) => {
    setItemEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleExtraDataChange = (id: string, key: string, value: any) => {
    setItemEdits((prev) => {
      const existing = prev[id] || {};
      return {
        ...prev,
        [id]: {
          ...existing,
          extraData: {
            ...(existing.extraData || {}),
            [key]: value,
          },
        },
      };
    });
  };

  // Add Item to Column
  const handleOpenAddItem = (columnKey: string) => {
    setTargetColumnKey(columnKey);
    setNewItemForm({
      sourceType: "CUSTOM",
      navigationLabel: "",
      url: "",
    });
    setIsAddItemOpen(true);
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.navigationLabel.trim()) {
      toast.error("Navigation Label is required");
      return;
    }

    try {
      await apiPost(`/footer/columns/${targetColumnKey}/items`, {
        sourceType: newItemForm.sourceType,
        navigationLabel: newItemForm.navigationLabel.trim(),
        url: newItemForm.url.trim() || "#",
      });
      toast.success("Item added to footer column");
      setIsAddItemOpen(false);
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add item");
    }
  };

  // Add Branch to Branches column
  const handleSelectBranch = async (b: any) => {
    try {
      await apiPost(`/footer/columns/branches/items`, {
        sourceType: "BRANCH",
        sourceId: b.id,
        navigationLabel: b.name,
        url: "#",
        extraData: {
          name: b.name,
          location: b.address || b.city || "",
          phone: b.phone || "",
        },
      });
      toast.success(`Branch ${b.name} added to footer`);
      setIsBranchDialogOpen(false);
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add branch");
    }
  };

  // Update item
  const handleSaveItem = async (columnKey: string, item: FooterItem) => {
    const edit = itemEdits[item.id];
    if (!edit) return;

    try {
      await apiPatch(`/footer/columns/${columnKey}/items/${item.id}`, {
        navigationLabel: edit.navigationLabel,
        url: edit.url,
        extraData: edit.extraData,
      });
      toast.success("Footer item updated");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update item");
    }
  };

  // Disable item
  const handleDisableItem = async (columnKey: string, id: string) => {
    try {
      await apiPatch(`/footer/columns/${columnKey}/items/${id}/disable`, {});
      toast.success("Item moved to Disabled Items");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to disable item");
    }
  };

  // Enable item
  const handleEnableItem = async (item: any) => {
    try {
      const colKey = item.footerColumn?.key || "quick_links";
      await apiPatch(`/footer/columns/${colKey}/items/${item.id}/enable`, {});
      toast.success("Item restored to footer");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to restore item");
    }
  };

  // Delete item
  const handleDeleteItem = async (columnKey: string, id: string) => {
    if (!confirm("Are you sure you want to permanently delete this footer item?")) return;
    try {
      await apiDelete(`/footer/columns/${columnKey}/items/${id}`);
      toast.success("Item permanently deleted");
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  // Drag and drop reordering inside column
  const onDragStart = (e: React.DragEvent, columnKey: string, index: number) => {
    setDragInfo({ columnKey, itemIndex: index });
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (e: React.DragEvent, targetColumnKey: string, targetIndex: number) => {
    e.preventDefault();
    if (!dragInfo || dragInfo.columnKey !== targetColumnKey || dragInfo.itemIndex === targetIndex) {
      setDragInfo(null);
      return;
    }

    const column = columns.find((c) => c.key === targetColumnKey);
    if (!column) return;

    const reordered = [...column.items];
    const [moved] = reordered.splice(dragInfo.itemIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setColumns((prev) =>
      prev.map((c) => (c.key === targetColumnKey ? { ...c, items: reordered } : c)),
    );
    setDragInfo(null);

    try {
      await apiPatch("/footer/columns/reorder", {
        columnKey: targetColumnKey,
        orderedItemIds: reordered.map((i) => i.id),
      });
      toast.success("Order updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to save reorder");
      loadBuilderData();
    }
  };

  // Helper to add from source list
  const handleAddSourceToColumn = async (source: SourceItem, colKey: string) => {
    try {
      await apiPost(`/footer/columns/${colKey}/items`, {
        sourceType: source.sourceType,
        sourceId: source.id,
        navigationLabel: source.name,
        url: source.url,
      });
      toast.success(`"${source.name}" added to ${colKey.replace('_', ' ')}`);
      loadBuilderData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add source");
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
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Footer</h1>
        <p className="text-xs text-slate-500">
          Configure multi-column footer navigation structure, branch locations, and contact support
        </p>
      </div>

      {/* ===================== TOP ROW: 3 CARDS ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Menus */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5">
            <CardTitle className="text-sm font-bold text-slate-800">Menus</CardTitle>
            <p className="text-[11px] text-slate-400">Available storefront menu items</p>
          </CardHeader>
          <CardContent className="p-4 max-h-48 overflow-y-auto space-y-2">
            {availableMenus.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No active menu items</p>
            ) : (
              availableMenus.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <GripVertical className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{m.name}</span>
                  </div>
                  <button
                    onClick={() => handleAddSourceToColumn(m, "quick_links")}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                    title="Add to Quick Links"
                  >
                    + Use
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Card 2: Pages */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5">
            <CardTitle className="text-sm font-bold text-slate-800">Pages</CardTitle>
            <p className="text-[11px] text-slate-400">Available CMS content pages</p>
          </CardHeader>
          <CardContent className="p-4 max-h-48 overflow-y-auto space-y-2">
            {availablePages.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No CMS pages found</p>
            ) : (
              availablePages.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <GripVertical className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                  </div>
                  <button
                    onClick={() => handleAddSourceToColumn(p, "about_us")}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                    title="Add to About Us"
                  >
                    + Use
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Card 3: Disabled Items */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5">
            <CardTitle className="text-sm font-bold text-slate-800">Disabled Items</CardTitle>
            <p className="text-[11px] text-slate-400">Items hidden from the storefront footer</p>
          </CardHeader>
          <CardContent className="p-4 max-h-48 overflow-y-auto space-y-2">
            {disabledItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No disabled items</p>
            ) : (
              disabledItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="overflow-hidden pr-2">
                    <span className="font-medium text-slate-700 block truncate">
                      {item.navigationLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      from {item.footerColumn?.title || item.footerColumn?.key}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEnableItem(item)}
                      title="Restore"
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteItem(item.footerColumn?.key || "quick_links", item.id)
                      }
                      title="Delete permanently"
                      className="p-1 rounded text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===================== BOTTOM SECTION: 4 COLUMNS ===================== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Footer Structure</h2>
          <p className="text-xs text-slate-500">Drag and Drop to Reorder items within each column</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {columns.map((column) => {
            const isBranchCol = column.key === "branches";
            const isSupportCol = column.key === "support";

            return (
              <Card
                key={column.id}
                className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white flex flex-col"
              >
                {/* Column Header */}
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3 px-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      {column.title}
                    </CardTitle>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      {column.key}
                    </span>
                  </div>

                  {isBranchCol ? (
                    <Button
                      size="sm"
                      onClick={() => setIsBranchDialogOpen(true)}
                      className="h-7 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 gap-1 rounded-md"
                    >
                      <Plus className="w-3 h-3" /> Branch
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAddItem(column.key)}
                      className="h-7 text-[11px] font-semibold border-slate-200 text-slate-600 hover:bg-slate-100 px-2 gap-1 rounded-md"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </Button>
                  )}
                </CardHeader>

                {/* Column Content Items */}
                <CardContent className="p-3 space-y-2.5 min-h-[220px]">
                  {column.items.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 text-xs">
                      Empty column
                    </div>
                  ) : (
                    column.items.map((item, index) => {
                      const isExpanded = !!expandedItems[item.id];
                      const edit = itemEdits[item.id] || {
                        navigationLabel: item.navigationLabel,
                        url: item.url || "",
                        extraData: item.extraData ? { ...item.extraData } : {},
                      };

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, column.key, index)}
                          onDragOver={onDragOver}
                          onDrop={(e) => onDrop(e, column.key, index)}
                          className={`border rounded-xl transition-all overflow-hidden ${
                            isExpanded
                              ? "border-emerald-500 bg-white shadow-sm"
                              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                          }`}
                        >
                          {/* Item Accordion Header */}
                          <div
                            onClick={() => toggleExpand(item.id)}
                            className="p-2.5 flex items-center justify-between cursor-pointer select-none text-xs"
                          >
                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                              <span
                                className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-0.5"
                                title="Drag to reorder"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>
                              <span className="font-semibold text-slate-800 truncate">
                                {edit.navigationLabel || item.navigationLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Item Accordion Content */}
                          {isExpanded && (
                            <div className="p-3 pt-2 border-t border-slate-100 space-y-3 bg-white text-xs">
                              {isBranchCol ? (
                                /* Branch Specific Fields */
                                <>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-700">
                                      Branch Name
                                    </Label>
                                    <Input
                                      value={edit.extraData?.name || edit.navigationLabel || ""}
                                      onChange={(e) => {
                                        handleEditChange(item.id, "navigationLabel", e.target.value);
                                        handleExtraDataChange(item.id, "name", e.target.value);
                                      }}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-700">
                                      Location / Address
                                    </Label>
                                    <Input
                                      value={edit.extraData?.location || ""}
                                      onChange={(e) =>
                                        handleExtraDataChange(item.id, "location", e.target.value)
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-700">
                                      Phone
                                    </Label>
                                    <Input
                                      value={edit.extraData?.phone || ""}
                                      onChange={(e) =>
                                        handleExtraDataChange(item.id, "phone", e.target.value)
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </>
                              ) : isSupportCol && index === 0 ? (
                                /* Support Contact Row Fields */
                                <>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-700">
                                      Label
                                    </Label>
                                    <Input
                                      value={edit.navigationLabel}
                                      onChange={(e) =>
                                        handleEditChange(item.id, "navigationLabel", e.target.value)
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-700">
                                      Available Time
                                    </Label>
                                    <Input
                                      value={edit.extraData?.availableTime || ""}
                                      onChange={(e) =>
                                        handleExtraDataChange(item.id, "availableTime", e.target.value)
                                      }
                                      placeholder="e.g. 9:00 AM - 10:00 PM"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-700">
                                      Phone Number
                                    </Label>
                                    <Input
                                      value={edit.extraData?.phone || ""}
                                      onChange={(e) =>
                                        handleExtraDataChange(item.id, "phone", e.target.value)
                                      }
                                      placeholder="+880 1700-000000"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </>
                              ) : (
                                /* Standard Navigation Label & URL Fields */
                                <>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-700">
                                      Navigation Label
                                    </Label>
                                    <Input
                                      value={edit.navigationLabel}
                                      onChange={(e) =>
                                        handleEditChange(item.id, "navigationLabel", e.target.value)
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-700">
                                      URL
                                    </Label>
                                    <Input
                                      value={edit.url}
                                      onChange={(e) =>
                                        handleEditChange(item.id, "url", e.target.value)
                                      }
                                      className="h-8 text-xs font-mono"
                                    />
                                  </div>
                                </>
                              )}

                              {/* Action buttons */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDisableItem(column.key, item.id)}
                                    title="Disable (Hide from footer)"
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 border border-slate-200 hover:bg-slate-50"
                                  >
                                    <EyeOff className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(column.key, item.id)}
                                    title="Delete permanently"
                                    className="p-1 rounded text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <Button
                                  type="button"
                                  onClick={() => handleSaveItem(column.key, item)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold h-7 px-3 gap-1"
                                >
                                  <Save className="w-3 h-3" /> Update
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Branch Picker Dialog */}
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Select Existing Branch
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-2 py-2 pr-1">
            {branches.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No branches registered</p>
            ) : (
              branches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectBranch(b)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{b.name}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full">
                      + Add
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{b.address || b.city || "No address"}</p>
                  {b.phone && <p className="text-[11px] text-slate-400">{b.phone}</p>}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBranchDialogOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Custom Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <form onSubmit={handleAddItemSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Add Item to {targetColumnKey.replace('_', ' ').toUpperCase()}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Navigation Label</Label>
                <Input
                  required
                  value={newItemForm.navigationLabel}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, navigationLabel: e.target.value })
                  }
                  placeholder="e.g. Terms & Conditions"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">URL / Link</Label>
                <Input
                  value={newItemForm.url}
                  onChange={(e) => setNewItemForm({ ...newItemForm, url: e.target.value })}
                  placeholder="/terms or https://..."
                  className="h-10 text-sm font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddItemOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9"
              >
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
