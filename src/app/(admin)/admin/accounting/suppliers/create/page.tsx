"use client";

import { useEffect, useState } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";

export default function CreateSupplierPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    phone: "",
    address: "",
    productsCategory: "",
    advanceBalance: "",
  });

  useEffect(() => {
    setTitle("Create Supplier");
    setBadge("Accounting");
    setDateFilter("");
  }, [setTitle, setBadge, setDateFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a supplier name");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter a contact phone number");
      return;
    }
    if (!formData.address.trim()) {
      toast.error("Please enter a location / address");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiPost("/suppliers", {
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || undefined,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        productsCategory: formData.productsCategory.trim() || undefined,
        advanceBalance: formData.advanceBalance ? Number(formData.advanceBalance) : 0,
      });

      toast.success("Supplier registered successfully");
      router.push("/admin/accounting/suppliers");
    } catch (err: any) {
      toast.error(err.message || "Failed to create supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Create New Supplier</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register a vendor profile for purchasing and payment settlements
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/accounting/suppliers")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Supplier Name * */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
              Supplier Name *
            </label>
            <Input
              placeholder="e.g. Mr. Rahim / Nexus Telecom"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-10 text-xs font-medium rounded-xl"
              required
            />
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
              Company Name
            </label>
            <Input
              placeholder="e.g. Nexus Electronics BD Ltd."
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="h-10 text-xs font-medium rounded-xl"
            />
          </div>

          {/* Contact * */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
              Contact *
            </label>
            <Input
              placeholder="+880 1700 000000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-10 text-xs font-medium rounded-xl"
              required
            />
          </div>

          {/* Location * */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
              Location *
            </label>
            <Input
              placeholder="e.g. Motijheel C/A, Dhaka - 1000"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="h-10 text-xs font-medium rounded-xl"
              required
            />
          </div>

          {/* Products Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
              Products Category
            </label>
            <Input
              placeholder="e.g. Smart Phones, Accessories, Display Panels"
              value={formData.productsCategory}
              onChange={(e) => setFormData({ ...formData, productsCategory: e.target.value })}
              className="h-10 text-xs font-medium rounded-xl"
            />
          </div>

          {/* Current Credit Balance */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
              Current Credit Balance
            </label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={formData.advanceBalance}
              onChange={(e) => setFormData({ ...formData, advanceBalance: e.target.value })}
              className="h-10 text-xs font-bold text-emerald-700 rounded-xl"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/admin/accounting/suppliers")}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {isSubmitting ? "Creating..." : "Create Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}
