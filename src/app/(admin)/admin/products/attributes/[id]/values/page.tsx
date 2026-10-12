"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  ListOrdered,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface AttributeValueItem {
  id: string;
  attributeId: string;
  value: string;
  status: boolean;
}

interface AttributeDetail {
  id: string;
  name: string;
  isOptional: boolean;
  status: "ACTIVE" | "INACTIVE";
  values: AttributeValueItem[];
}

export default function AttributeValuesPage() {
  const params = useParams();
  const router = useRouter();
  const attributeId = params?.id as string;
  const { setTitle, setBadge, setDateFilter } = useAdminPage();

  const [attribute, setAttribute] = useState<AttributeDetail | null>(null);
  const [values, setValues] = useState<AttributeValueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<AttributeValueItem | null>(null);
  const [formValue, setFormValue] = useState("");
  const [formStatus, setFormStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Attribute Values");
    setBadge("Products");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  // Load Attribute and its Values
  const fetchData = useCallback(async () => {
    if (!attributeId) return;
    setIsLoading(true);
    try {
      const [attrRes, valuesRes] = await Promise.all([
        apiGet<AttributeDetail>(`/attributes/${attributeId}`),
        apiGet<AttributeValueItem[]>(`/attributes/${attributeId}/values`),
      ]);
      setAttribute(attrRes);
      setValues(Array.isArray(valuesRes) ? valuesRes : attrRes.values || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load attribute values");
    } finally {
      setIsLoading(false);
    }
  }, [attributeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered
  const filteredValues = useMemo(() => {
    return values.filter((v) =>
      v.value.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [values, searchQuery]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingValue(null);
    setFormValue("");
    setFormStatus(true);
    setIsModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (valItem: AttributeValueItem) => {
    setEditingValue(valItem);
    setFormValue(valItem.value);
    setFormStatus(valItem.status ?? true);
    setIsModalOpen(true);
  };

  // Instant Toggle Status
  const handleToggleStatus = async (valItem: AttributeValueItem) => {
    const nextStatus = !valItem.status;
    // Optimistic UI update
    setValues((prev) =>
      prev.map((v) => (v.id === valItem.id ? { ...v, status: nextStatus } : v)),
    );

    try {
      await apiPatch(`/attributes/${attributeId}/values/${valItem.id}`, {
        status: nextStatus,
      });
      toast.success(
        `Value "${valItem.value}" is now ${nextStatus ? "Active" : "Inactive"}.`,
      );
    } catch (err: any) {
      // Rollback
      setValues((prev) =>
        prev.map((v) => (v.id === valItem.id ? { ...v, status: valItem.status } : v)),
      );
      toast.error(err.message || "Failed to update value status");
    }
  };

  // Submit Create / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue.trim()) {
      toast.error("Please enter a value");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingValue) {
        const updated = await apiPatch<AttributeValueItem>(
          `/attributes/${attributeId}/values/${editingValue.id}`,
          {
            value: formValue.trim(),
            status: formStatus,
          },
        );
        toast.success(`Value "${updated.value}" updated successfully!`);
      } else {
        const created = await apiPost<AttributeValueItem>(
          `/attributes/${attributeId}/values`,
          {
            value: formValue.trim(),
          },
        );
        toast.success(`Value "${created.value}" added successfully!`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save value");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete with Conflict Toast
  const handleDelete = async (valItem: AttributeValueItem) => {
    if (!confirm(`Are you sure you want to delete value "${valItem.value}"?`)) return;

    try {
      await apiDelete(`/attributes/${attributeId}/values/${valItem.id}`);
      toast.success(`Value "${valItem.value}" deleted successfully.`);
      setValues((prev) => prev.filter((v) => v.id !== valItem.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete value");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb / Back Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products/attributes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Attributes</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {attribute ? `${attribute.name} — Values` : "Attribute Values"}
              </h1>
              {attribute?.isOptional && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  Optional
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Manage selectable option values for this attribute
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Value</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50/50 border-slate-200 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Values Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">SL</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Loading values...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredValues.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <ListOrdered className="w-8 h-8 text-slate-300 mb-1" />
                      <p className="font-semibold text-slate-600">No values found</p>
                      <p className="text-xs text-slate-400">
                        Add values such as "128GB", "Red", "XL" for this attribute.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredValues.map((valItem, idx) => (
                  <tr
                    key={valItem.id}
                    className="hover:bg-slate-50/70 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500 font-bold">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {valItem.value}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={valItem.status ?? true}
                          onCheckedChange={() => handleToggleStatus(valItem)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                        <span
                          className={`text-xs font-semibold ${
                            valItem.status
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {valItem.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(valItem)}
                          title="Edit Value"
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(valItem)}
                          title="Delete Value"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Value Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingValue ? "Edit Value" : "Create New Value"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Value Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Midnight Black, 128GB, 8GB RAM..."
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                className="bg-slate-50 border-slate-200 rounded-xl text-sm"
                required
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <Label className="text-xs font-bold text-slate-800">
                  Status
                </Label>
                <p className="text-xs text-slate-500">
                  Enable or disable this value option
                </p>
              </div>
              <Switch
                checked={formStatus}
                onCheckedChange={setFormStatus}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-4 text-slate-600"
              >
                Close
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 font-semibold"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingValue ? (
                  "Update Value"
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
