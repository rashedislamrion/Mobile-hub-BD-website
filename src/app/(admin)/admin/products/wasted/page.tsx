"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import Image from "next/image";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Package,
  AlertTriangle,
  Building2,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete, getImageUrl } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProductCatalogGrid, ProductCatalogItem } from "@/components/admin/ProductCatalogGrid";

export interface WastedProductItem {
  id: string;
  productId: string;
  variantId?: string | null;
  branchId?: string | null;
  quantity: number;
  reason: string;
  note?: string | null;
  costImpact: number | string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    code?: string | null;
    images?: { url: string }[];
    category?: { id: string; name: string };
  };
  variant?: {
    id: string;
    color?: string | null;
    quality?: string | null;
    sku: string;
    stock: number;
    price: number | string;
  } | null;
  branch?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  reportedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function WastedProductsPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();

  const [wastedList, setWastedList] = useState<WastedProductItem[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<ProductCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  // Search & Filter Bar State
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterReason, setFilterReason] = useState<string>("all");

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);
  const [formBranchId, setFormBranchId] = useState<string>("");
  const [formVariantId, setFormVariantId] = useState<string>("");
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formReason, setFormReason] = useState<string>("DAMAGED");
  const [formNote, setFormNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<WastedProductItem | null>(null);
  const [editReason, setEditReason] = useState<string>("DAMAGED");
  const [editNote, setEditNote] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchWasted = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<{ data: WastedProductItem[] }>("/wasted-products", {
        limit: 100,
        search: activeSearch || undefined,
        branchId: filterBranch !== "all" ? filterBranch : undefined,
        reason: filterReason !== "all" ? filterReason : undefined,
      });
      setWastedList(res?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load wasted products");
    } finally {
      setIsLoading(false);
    }
  }, [activeSearch, filterBranch, filterReason]);

  const loadDependencies = useCallback(async () => {
    try {
      const [branchRes, productsRes] = await Promise.all([
        apiGet<any[]>("/branches").catch(() => []),
        apiGet<{ data: ProductCatalogItem[] }>("/products/admin", { limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setBranches(branchRes || []);
      setCatalogProducts(productsRes?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    setTitle("Wasted Products");
    setBadge("Inventory");
    setDateFilter("");
    fetchWasted();
    loadDependencies();
  }, [setTitle, setBadge, setDateFilter, fetchWasted, loadDependencies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const handleOpenAddModal = () => {
    setWizardStep(1);
    setSelectedProduct(null);
    setFormBranchId("");
    setFormVariantId("");
    setFormQuantity(1);
    setFormReason("DAMAGED");
    setFormNote("");
    setIsAddOpen(true);
  };

  const handleSelectProductInWizard = (prod: ProductCatalogItem) => {
    setSelectedProduct(prod);
    if (prod.variants && prod.variants.length > 0) {
      setFormVariantId(prod.variants[0].id);
    } else {
      setFormVariantId("");
    }
    setWizardStep(2);
  };

  const handleSaveWastedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    if (formQuantity <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiPost("/wasted-products", {
        productId: selectedProduct.id,
        variantId: formVariantId || undefined,
        branchId: formBranchId && formBranchId !== "none" ? formBranchId : undefined,
        quantity: Number(formQuantity),
        reason: formReason,
        note: formNote.trim() || undefined,
      });

      toast.success("Wasted product recorded successfully!");
      setIsAddOpen(false);
      fetchWasted();
    } catch (err: any) {
      toast.error(err.message || "Failed to record wasted product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (item: WastedProductItem) => {
    setEditingItem(item);
    setEditReason(item.reason || "DAMAGED");
    setEditNote(item.note || "");
  };

  const handleUpdateWasted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsEditing(true);
      await apiPatch(`/wasted-products/${editingItem.id}`, {
        reason: editReason,
        note: editNote.trim() || undefined,
      });

      toast.success("Wasted product updated!");
      setEditingItem(null);
      fetchWasted();
    } catch (err: any) {
      toast.error(err.message || "Failed to update record");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (item: WastedProductItem) => {
    if (!confirm(`Are you sure you want to delete this write-off record for "${item.product.name}"?`)) return;

    try {
      await apiDelete(`/wasted-products/${item.id}`);
      toast.success("Record deleted");
      fetchWasted();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const chosenVariant = selectedProduct?.variants?.find((v) => v.id === formVariantId);

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wasted Products</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track damaged, lost, expired or defective items written off from inventory.
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Wasted Product</span>
        </Button>
      </div>

      {/* Filter / Search Row matching Reference */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`rounded-xl border-slate-200 gap-1.5 text-sm ${
              showFilterDrawer || filterBranch !== "all" || filterReason !== "all"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </Button>

          <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by product name, code or note..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-sm"
              />
            </div>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5"
            >
              Search
            </Button>
            {activeSearch && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setActiveSearch("");
                }}
                className="rounded-xl border-slate-200 text-slate-600"
              >
                Reset
              </Button>
            )}
          </form>
        </div>

        {/* Expandable Filter Selects */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-slate-600">Branch:</Label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Branches</option>
                <option value="null">N/A (No Branch)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-slate-600">Reason:</Label>
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Reasons</option>
                <option value="DAMAGED">Damaged</option>
                <option value="EXPIRED">Expired</option>
                <option value="LOST">Lost</option>
                <option value="DEFECTIVE">Defective</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* DataTable Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">SL</th>
                <th className="py-3.5 px-4">BRANCH</th>
                <th className="py-3.5 px-4">PRODUCT</th>
                <th className="py-3.5 px-4">VARIANT</th>
                <th className="py-3.5 px-4 text-center">QUANTITY</th>
                <th className="py-3.5 px-4">NOTE</th>
                <th className="py-3.5 px-4 text-center w-28">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 animate-pulse mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm">Loading wasted products...</p>
                  </td>
                </tr>
              ) : wastedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                    <p className="text-sm font-medium text-slate-600">No wasted products recorded</p>
                    <p className="text-xs text-slate-400 mt-1">Click "+ Add Wasted Product" to record written-off stock</p>
                  </td>
                </tr>
              ) : (
                wastedList.map((item, idx) => {
                  const imgUrl = item.product.images?.[0]?.url
                    ? getImageUrl(item.product.images[0].url)
                    : "/placeholder.png";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* SL */}
                      <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-4">
                        {item.branch ? (
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.branch.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                            N/A
                          </span>
                        )}
                      </td>

                      {/* Product Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                            <Image
                              src={imgUrl}
                              alt={item.product.name}
                              fill
                              sizes="40px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-snug">{item.product.name}</p>
                            {item.product.code && (
                              <p className="text-[11px] font-mono text-slate-400">
                                Code: {item.product.code}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Variant bullets */}
                      <td className="py-3.5 px-4">
                        {item.variant ? (
                          <ul className="text-xs space-y-0.5 text-slate-600">
                            {item.variant.color && (
                              <li className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                <span>Color: <strong className="text-slate-800">{item.variant.color}</strong></span>
                              </li>
                            )}
                            {item.variant.quality && (
                              <li className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                <span>Quality: <strong className="text-slate-800">{item.variant.quality}</strong></span>
                              </li>
                            )}
                            {item.variant.sku && (
                              <li className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                                SKU: {item.variant.sku}
                              </li>
                            )}
                          </ul>
                        ) : (
                          <span className="text-xs text-slate-400">Default Variant</span>
                        )}
                      </td>

                      {/* Quantity & Reason */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-900 text-sm">{item.quantity}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase font-semibold text-red-600 border-red-200 bg-red-50">
                            {item.reason}
                          </Badge>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {item.note || "--"}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Reason & Note"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Wasted Product Wizard Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-slate-900">
                {wizardStep === 1 ? "Select Product to Write Off" : `Record Waste: ${selectedProduct?.name}`}
              </DialogTitle>
              {wizardStep === 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setWizardStep(1)}
                  className="text-xs text-slate-500 gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Product</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {wizardStep === 1 ? (
            /* STEP 1: Catalog Picker */
            <div className="py-3 space-y-3">
              <p className="text-xs text-slate-500">
                Click on any product from the catalog below to proceed with recording wasted quantity.
              </p>
              <ProductCatalogGrid
                products={catalogProducts}
                isLoading={isCatalogLoading}
                onSelectProduct={handleSelectProductInWizard}
                maxHeight="max-h-[380px]"
              />
            </div>
          ) : (
            /* STEP 2: Configure Waste Details */
            <form onSubmit={handleSaveWastedProduct} className="space-y-4 py-2">
              {/* Product Preview Card */}
              {selectedProduct && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="relative w-12 h-12 bg-white rounded-lg border overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        selectedProduct.images?.[0]?.url
                          ? getImageUrl(selectedProduct.images[0].url)
                          : "/placeholder.png"
                      }
                      alt={selectedProduct.name}
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{selectedProduct.name}</h4>
                    <p className="text-xs text-slate-500">
                      Regular Price: ৳{Number(selectedProduct.regularPrice).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Branch Select (Optional) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Branch (Optional — leave unset for N/A)
                </Label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">N/A (General / No Branch Assigned)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant Picker */}
              {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Select Variant *
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedProduct.variants.map((v) => {
                      const isSelected = formVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setFormVariantId(v.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold ring-1 ring-emerald-500"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <p className="font-mono text-[11px] truncate">{v.sku}</p>
                          <p className="text-[11px] text-slate-500">
                            {v.color || "Standard"} {v.quality ? `• ${v.quality}` : ""}
                          </p>
                          <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                            Stock: {v.stock}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Quantity to Write Off <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={chosenVariant ? chosenVariant.stock : undefined}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Math.max(1, Number(e.target.value)))}
                    required
                    className="bg-slate-50 border-slate-200 rounded-xl text-sm"
                  />
                  {chosenVariant && (
                    <p className="text-[11px] text-slate-400">
                      Max available in stock: {chosenVariant.stock} units
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Reason <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="DAMAGED">Damaged</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="LOST">Lost</option>
                    <option value="DEFECTIVE">Defective</option>
                  </select>
                </div>
              </div>

              {/* Freeform Note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Internal Note (Optional)
                </Label>
                <Textarea
                  placeholder="e.g. Cracked during transit inspection on delivery van..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  rows={2}
                  className="bg-slate-50 border-slate-200 rounded-xl text-sm resize-none"
                />
              </div>

              <DialogFooter className="pt-3 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
                >
                  {isSubmitting ? "Saving..." : "Save Wasted Product"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Wasted Product Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Update Waste Record
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateWasted} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Reason</Label>
              <select
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="DAMAGED">Damaged</option>
                <option value="EXPIRED">Expired</option>
                <option value="LOST">Lost</option>
                <option value="DEFECTIVE">Defective</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Note</Label>
              <Textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={3}
                className="bg-slate-50 border-slate-200 rounded-xl text-sm resize-none"
              />
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isEditing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {isEditing ? "Updating..." : "Update Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
