"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Search,
  Building2,
  Package,
  Layers,
  Plus,
  Minus,
  Trash2,
  Send,
  Save,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Boxes,
} from "lucide-react";
import { apiGet, apiPost, getImageUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStaffAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface BranchInfo {
  id: string;
  name: string;
  code?: string;
  city?: string;
}

interface ProductVariantCatalog {
  id: string;
  productId: string;
  color?: string | null;
  quality?: string | null;
  price: number;
  sku?: string | null;
  branchStock: number;
}

interface ProductCatalogItem {
  id: string;
  name: string;
  code: string;
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  image?: string | null;
  regularPrice: number;
  variants: ProductVariantCatalog[];
  totalBranchStock: number;
}

interface CategoryItem {
  id: string;
  name: string;
  children?: CategoryItem[];
}

interface CartItem {
  productId: string;
  productName: string;
  productCode: string;
  image?: string | null;
  productVariantId: string;
  color?: string | null;
  quality?: string | null;
  sku?: string | null;
  branchStock: number;
  requestedQty: number;
}

const DRAFT_STORAGE_KEY = "mobilehubbd_product_request_draft";

export default function NewProductRequestPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useStaffAuth();

  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [fulfillingBranchId, setFulfillingBranchId] = useState<string>("");

  // Catalog state
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Cart & Note state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  // Debounce catalog search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Load branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await apiGet<any>("/branches");
        const list: BranchInfo[] = Array.isArray(res) ? res : res?.data || [];
        setBranches(list);
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    }
    loadBranches();
  }, []);

  // Load category pills
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiGet<any>("/categories/tree");
        const list = Array.isArray(res) ? res : res?.data || [];
        setCategories(list);
      } catch (err) {
        console.error("Failed to load categories tree:", err);
      }
    }
    loadCategories();
  }, []);

  // Check for existing saved draft in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fulfillingBranchId || (parsed.cart && parsed.cart.length > 0)) {
          setHasDraftNotice(true);
        }
      }
    } catch (e) {
      console.error("Draft read error:", e);
    }
  }, []);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fulfillingBranchId) setFulfillingBranchId(parsed.fulfillingBranchId);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.note) setNote(parsed.note);
        setHasDraftNotice(false);
        toast.success("Draft restored successfully!");
      }
    } catch {
      toast.error("Failed to parse saved draft.");
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraftNotice(false);
    toast.info("Saved draft discarded.");
  };

  // Fetch catalog with live stock at selected fulfilling branch
  const loadCatalog = useCallback(async () => {
    if (!fulfillingBranchId) {
      setProducts([]);
      return;
    }
    setCatalogLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("branchId", fulfillingBranchId);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (selectedCategory !== "ALL") params.append("categoryId", selectedCategory);

      const res = await apiGet<ProductCatalogItem[]>(
        `/product-requests/catalog?${params.toString()}`,
      );
      setProducts(res || []);
    } catch (err: any) {
      console.error("Error loading catalog:", err);
      toast.error(err.message || "Failed to load branch catalog");
    } finally {
      setCatalogLoading(false);
    }
  }, [fulfillingBranchId, debouncedSearch, selectedCategory]);

  useEffect(() => {
    if (fulfillingBranchId) {
      loadCatalog();
    }
  }, [fulfillingBranchId, loadCatalog]);

  // Add variant to cart
  const handleAddToCart = (product: ProductCatalogItem, variant: ProductVariantCatalog) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productVariantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.productVariantId === variant.id
            ? { ...item, requestedQty: item.requestedQty + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          image: product.image,
          productVariantId: variant.id,
          color: variant.color,
          quality: variant.quality,
          sku: variant.sku,
          branchStock: variant.branchStock,
          requestedQty: 1,
        },
      ];
    });
    toast.success(
      `Added "${product.name}${variant.color ? ` - ${variant.color}` : ""}" to request list`,
      { duration: 2000 },
    );
  };

  // Stepper controls
  const handleQtyChange = (productVariantId: string, newQty: number) => {
    if (newQty < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.productVariantId === productVariantId
          ? { ...item, requestedQty: newQty }
          : item,
      ),
    );
  };

  const handleRemoveItem = (productVariantId: string) => {
    setCart((prev) => prev.filter((item) => item.productVariantId !== productVariantId));
  };

  // Save draft
  const handleSaveDraft = () => {
    const draftPayload = {
      fulfillingBranchId,
      cart,
      note,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    toast.success("Request draft saved locally! You can safely resume later.");
  };

  // Submit request
  const handleSubmitRequest = async () => {
    if (!fulfillingBranchId) {
      toast.error("Please select a fulfilling branch to request stock from.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your request list is empty. Please add at least one product item.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fulfillingBranchId,
        note: note.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          requestedQty: item.requestedQty,
        })),
      };

      const res = await apiPost<any>("/product-requests", payload);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      toast.success(
        `Product Request ${res?.requestNumber || ""} created successfully with status PENDING!`,
      );
      router.push(`/admin/branch/product-requests/${res.id}`);
    } catch (err: any) {
      console.error("Failed to submit request:", err);
      toast.error(err.message || "Failed to submit product request");
    } finally {
      setSubmitting(false);
    }
  };

  const userBranchId = user?.branchId || "";
  const roleName = user?.role?.name?.toLowerCase() || "";
  const isBranchRole =
    roleName.includes("branch admin") || roleName.includes("branch manager");

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RotateCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isBranchRole || !userBranchId) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center max-w-xl mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-amber-900 mb-1">Access Restricted</h2>
          <p className="text-sm text-amber-700">
            The Product Requests module is strictly accessible to Branch Admin and Branch
            Manager roles assigned to an active branch.
          </p>
        </div>
      </div>
    );
  }

  const selectedBranchObj = branches.find((b) => b.id === fulfillingBranchId);
  const totalRequestedUnits = cart.reduce((sum, item) => sum + item.requestedQty, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/branch/product-requests">
            <Button variant="ghost" size="sm" className="p-2 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Product Request</h1>
            <p className="text-sm text-slate-500">
              Request stock from another branch to{" "}
              <span className="font-semibold text-slate-800">{user?.branch?.name || "Your Branch"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 text-slate-700"
          >
            <Save className="w-4 h-4 text-slate-500" />
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={handleSubmitRequest}
            disabled={submitting || !fulfillingBranchId || cart.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5"
          >
            {submitting ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Request ({totalRequestedUnits})
          </Button>
        </div>
      </div>

      {/* Draft Notification Banner */}
      {hasDraftNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 text-emerald-800 text-sm">
            <Boxes className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>You have an uncommitted product request draft saved in this browser.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={discardDraft}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Discard
            </Button>
            <Button
              size="sm"
              onClick={restoreDraft}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Restore Draft
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Catalog (7 cols) + Right Cart / Notes (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Branch Picker & Product Catalog Browser */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Branch Picker Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>1. Select Fulfilling Branch (Request From)</span>
            </div>
            <p className="text-xs text-slate-500">
              Pick the branch you are asking stock from. Live inventory levels below will reflect
              this branch&apos;s on-hand quantities.
            </p>

            <Select
              value={fulfillingBranchId}
              onValueChange={(val) => {
                setFulfillingBranchId(val);
                // Clear cart if fulfilling branch changes to avoid mixed origin requests
                if (cart.length > 0) {
                  toast.info("Fulfilling branch changed. Cart reset to match new branch inventory.");
                  setCart([]);
                }
              }}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Search / Select Fulfilling Branch..." />
              </SelectTrigger>
              <SelectContent>
                {branches
                  .filter((b) => b.id !== userBranchId)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="font-semibold text-slate-900">{b.name}</span>
                      {b.city ? <span className="text-xs text-slate-400 ml-2">({b.city})</span> : null}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Catalog Browser Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>2. Browse Catalog & Live Stock</span>
              </div>
              {selectedBranchObj && (
                <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                  Stock at: {selectedBranchObj.name}
                </Badge>
              )}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search products by name, code, or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!fulfillingBranchId}
                className="pl-9 text-sm"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                disabled={!fulfillingBranchId}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  disabled={!fulfillingBranchId}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Catalog Products List / Grid */}
            {!fulfillingBranchId ? (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Building2 className="w-10 h-10 mx-auto text-slate-300" />
                <div className="font-semibold text-slate-700 text-sm">Please select a branch first</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Select a fulfilling branch in Step 1 to load product inventory counts for that location.
                </p>
              </div>
            ) : catalogLoading ? (
              <div className="py-16 text-center text-slate-400">
                <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                <span className="text-xs">Loading live branch catalog...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <div className="font-semibold text-slate-700 text-sm">No products found</div>
                <p className="text-xs text-slate-400">
                  Try adjusting your search query or selecting a different category.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                        {prod.image ? (
                          <Image
                            src={getImageUrl(prod.image)}
                            alt={prod.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-900 text-sm truncate">
                            {prod.name}
                          </h4>
                          {prod.brand && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-slate-500">
                              {prod.brand.name}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          Code: {prod.code}
                          {prod.category ? ` • ${prod.category.name}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Variants and stock */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      {prod.variants.map((v) => {
                        const inCart = cart.find((i) => i.productVariantId === v.id);
                        const hasStock = v.branchStock > 0;

                        return (
                          <div
                            key={v.id}
                            className="flex items-center justify-between gap-3 text-xs bg-slate-50/70 p-2 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">
                                {v.color || "Standard"}
                                {v.quality ? ` (${v.quality})` : ""}
                              </span>
                              {v.sku && <span className="text-[11px] text-slate-400">[{v.sku}]</span>}
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Stock badge */}
                              {hasStock ? (
                                <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold text-[11px]">
                                  {v.branchStock} Left
                                </span>
                              ) : (
                                <span className="text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded text-[11px]">
                                  No Stock
                                </span>
                              )}

                              {/* Add / Qty button */}
                              {inCart ? (
                                <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded px-1 py-0.5">
                                  <span className="text-emerald-700 font-bold px-1">
                                    {inCart.requestedQty} in cart
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQtyChange(v.id, inCart.requestedQty + 1)}
                                    className="h-5 w-5 p-0 text-emerald-600 hover:bg-emerald-50"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddToCart(prod, v)}
                                  className="h-7 text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Request Cart & Additional Note */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Request Cart</h3>
              </div>
              <Badge className="bg-emerald-600 text-white font-bold">
                {cart.length} {cart.length === 1 ? "Item" : "Items"} ({totalRequestedUnits} units)
              </Badge>
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Boxes className="w-10 h-10 mx-auto text-slate-300" />
                <div className="text-sm font-medium text-slate-600">Your request cart is empty</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Browse products from the catalog on the left and click &quot;Add&quot; to build your inter-branch
                  transfer request.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.productVariantId}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.color || "Standard"}
                          {item.quality ? ` • ${item.quality}` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productVariantId)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="text-slate-500">
                        Live branch stock:{" "}
                        <span
                          className={`font-semibold ${
                            item.branchStock > 0 ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {item.branchStock}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleQtyChange(item.productVariantId, item.requestedQty - 1)
                          }
                          disabled={item.requestedQty <= 1}
                          className="h-6 w-6 p-0 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <input
                          type="number"
                          min={1}
                          value={item.requestedQty}
                          onChange={(e) =>
                            handleQtyChange(
                              item.productVariantId,
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          className="w-10 text-center font-bold text-slate-900 text-xs bg-transparent focus:outline-none"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleQtyChange(item.productVariantId, item.requestedQty + 1)
                          }
                          className="h-6 w-6 p-0 text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Note */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Additional Note (Optional)</span>
                <span className="text-[11px] text-slate-400 font-normal">Requester reason</span>
              </label>
              <Textarea
                placeholder="e.g. Urgent customer order waiting, please dispatch 2 units via express courier..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Button
                type="button"
                onClick={handleSubmitRequest}
                disabled={submitting || !fulfillingBranchId || cart.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Product Request
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="flex-1 text-xs text-slate-700"
                >
                  <Save className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Save Draft
                </Button>
                <Link href="/admin/branch/product-requests" className="flex-1">
                  <Button type="button" variant="ghost" className="w-full text-xs text-slate-500">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
