"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  Layers,
  Loader2,
  CheckCircle2,
  ExternalLink,
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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AttributeValueItem {
  id: string;
  value: string;
  status: boolean;
}

interface AttributeItem {
  id: string;
  name: string;
  isOptional: boolean;
  status: "ACTIVE" | "INACTIVE";
  values?: AttributeValueItem[];
  _count?: {
    values: number;
  };
}

export default function AttributesPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();

  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formIsOptional, setFormIsOptional] = useState(false);
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Attributes");
    setBadge("Products");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  // Fetch Attributes
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<AttributeItem[]>("/attributes");
      setAttributes(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load attributes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered
  const filteredAttributes = useMemo(() => {
    return attributes.filter((attr) =>
      attr.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [attributes, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAttribute(null);
    setFormName("");
    setFormIsOptional(false);
    setFormStatus("ACTIVE");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (attr: AttributeItem) => {
    setEditingAttribute(attr);
    setFormName(attr.name);
    setFormIsOptional(Boolean(attr.isOptional));
    setFormStatus(attr.status || "ACTIVE");
    setIsModalOpen(true);
  };

  // Instant Toggle Status
  const handleToggleStatus = async (attr: AttributeItem) => {
    const nextStatus = attr.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    // Optimistic
    setAttributes((prev) =>
      prev.map((a) => (a.id === attr.id ? { ...a, status: nextStatus } : a)),
    );

    try {
      await apiPatch(`/attributes/${attr.id}`, { status: nextStatus });
      toast.success(
        `Attribute "${attr.name}" is now ${nextStatus === "ACTIVE" ? "Active" : "Inactive"}.`,
      );
    } catch (err: any) {
      // Rollback
      setAttributes((prev) =>
        prev.map((a) => (a.id === attr.id ? { ...a, status: attr.status } : a)),
      );
      toast.error(err.message || "Failed to update attribute status");
    }
  };

  // Submit Create / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Please enter an attribute name");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAttribute) {
        const updated = await apiPatch<AttributeItem>(`/attributes/${editingAttribute.id}`, {
          name: formName.trim(),
          isOptional: formIsOptional,
          status: formStatus,
        });
        toast.success(`Attribute "${updated.name}" updated successfully!`);
      } else {
        const created = await apiPost<AttributeItem>("/attributes", {
          name: formName.trim(),
          isOptional: formIsOptional,
          status: formStatus,
        });
        toast.success(`Attribute "${created.name}" created successfully!`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save attribute");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (attr: AttributeItem) => {
    if (!confirm(`Are you sure you want to delete attribute "${attr.name}"?`)) return;

    try {
      await apiDelete(`/attributes/${attr.id}`);
      toast.success(`Attribute "${attr.name}" deleted successfully.`);
      setAttributes((prev) => prev.filter((a) => a.id !== attr.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete attribute");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Attribute Management</h1>
            <p className="text-xs text-slate-500">
              Manage product specification options, variants, and optional add-ons
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search attributes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50/50 border-slate-200 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Attributes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">SL</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4 text-center">Optional</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Loading attribute records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAttributes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Sliders className="w-8 h-8 text-slate-300 mb-1" />
                      <p className="font-semibold text-slate-600">No attributes found</p>
                      <p className="text-xs text-slate-400">
                        Try modifying your search or create a new attribute.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttributes.map((attr, idx) => (
                  <tr
                    key={attr.id}
                    className="hover:bg-slate-50/70 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500 font-bold">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{attr.name}</span>
                        {attr.values && attr.values.length > 0 && (
                          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {attr.values.length} value{attr.values.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {attr.isOptional ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs font-semibold px-2.5 py-0.5">
                          Yes
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 text-xs font-semibold px-2.5 py-0.5">
                          No
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={attr.status === "ACTIVE"}
                          onCheckedChange={() => handleToggleStatus(attr)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                        <span
                          className={`text-xs font-semibold ${
                            attr.status === "ACTIVE"
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {attr.status === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/products/attributes/${attr.id}/values`}
                          title="Manage Values"
                          className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        >
                          <ListOrdered className="w-4 h-4 text-emerald-600" />
                          <span className="hidden sm:inline">Values</span>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(attr)}
                          title="Edit Attribute"
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(attr)}
                          title="Delete Attribute"
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

      {/* Create / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingAttribute ? "Edit Attribute" : "Create Attribute"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Color, Storage, RAM, Region..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-slate-50 border-slate-200 rounded-xl text-sm"
                required
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <Label className="text-xs font-bold text-slate-800">
                  Optional Add-on
                </Label>
                <p className="text-xs text-slate-500">
                  Mark as optional configuration or add-on
                </p>
              </div>
              <Switch
                checked={formIsOptional}
                onCheckedChange={setFormIsOptional}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <Label className="text-xs font-bold text-slate-800">
                  Status
                </Label>
                <p className="text-xs text-slate-500">
                  Enable or disable this attribute in product setups
                </p>
              </div>
              <Switch
                checked={formStatus === "ACTIVE"}
                onCheckedChange={(c) => setFormStatus(c ? "ACTIVE" : "INACTIVE")}
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
                ) : editingAttribute ? (
                  "Update Attribute"
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
