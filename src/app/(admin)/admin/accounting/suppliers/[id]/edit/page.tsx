"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { ArrowLeft, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setBadge, setDateFilter } = useAdminPage();

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    status: "ACTIVE",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Edit Supplier");
    setBadge("Accounting");
    setDateFilter(""); 
  }, [setTitle, setBadge, setDateFilter]);

  useEffect(() => {
    if (!params.id) return;
    setIsLoading(true);
    apiGet<any>(`/suppliers/${params.id}`)
      .then((res) => {
        if (res) {
          setFormData({
            name: res.name || "",
            contactPerson: res.contactPerson || "",
            phone: res.phone || "",
            email: res.email || "",
            address: res.address || "",
            status: res.status || "ACTIVE",
          });
        }
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load supplier");
      })
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Please fill in company name and phone number");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiPatch(`/suppliers/${params.id}`, {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        status: formData.status,
      });

      toast.success("Supplier profile updated successfully");
      router.push("/admin/accounting/suppliers");
    } catch (err: any) {
      toast.error(err.message || "Failed to update supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Suppliers
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT MAIN FORM */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Company / Supplier Name *</label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Contact Person</label>
                <Input 
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Phone Number *</label>
                <Input 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Business Address</label>
              <Textarea 
                className="h-24 resize-none"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-6 sticky top-[100px]">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800">Status Settings</h3>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <label className="text-sm font-semibold text-slate-800">Active Vendor</label>
                <p className="text-[11px] text-slate-500">Enable in purchase orders</p>
              </div>
              <Switch 
                checked={formData.status === "ACTIVE"}
                onCheckedChange={checked => setFormData({ ...formData, status: checked ? "ACTIVE" : "INACTIVE" })}
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
