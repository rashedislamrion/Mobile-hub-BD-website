"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { MapPin, Trash2, Loader2, Home, Building2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

interface CustomerAddress {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  fullAddress: string;
  tag: "HOME" | "OFFICE" | "OTHER";
  isDefault: boolean;
}

const addressSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(11, "Valid phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(5, "Full address is required"),
  tag: z.enum(["Home", "Office", "Other"]),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function AddressPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTag, setActiveTag] = useState<"Home" | "Office" | "Other">("Home");
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { tag: "Home" }
  });

  const loadAddresses = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingAddresses(true);
      const res = await apiGet<CustomerAddress[]>(`/customers/${user.id}/addresses`);
      if (Array.isArray(res)) {
        setAddresses(res);
      } else {
        setAddresses([]);
      }
    } catch {
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const onSubmit = async (data: AddressFormValues) => {
    if (!user?.id) {
      toast.error("Please login to manage your addresses.");
      return;
    }

    try {
      const tagMap: Record<string, "HOME" | "OFFICE" | "OTHER"> = {
        Home: "HOME",
        Office: "OFFICE",
        Other: "OTHER",
      };

      await apiPost(`/customers/${user.id}/addresses`, {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email ? data.email.trim() : undefined,
        fullAddress: data.address.trim(),
        tag: tagMap[data.tag] || "HOME",
        isDefault: addresses.length === 0,
      });

      toast.success("Address saved successfully!");
      reset({ fullName: "", phone: "", email: "", address: "", tag: "Home" });
      setActiveTag("Home");
      await loadAddresses();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save address");
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!user?.id) return;
    try {
      setDeletingId(addressId);
      await apiDelete(`/customers/${user.id}/addresses/${addressId}`);
      toast.success("Address deleted successfully!");
      await loadAddresses();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case "OFFICE":
        return <Building2 className="w-4 h-4 text-primary" />;
      case "HOME":
        return <Home className="w-4 h-4 text-emerald-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTagLabel = (tag: string) => {
    if (tag === "OFFICE") return "Office";
    if (tag === "OTHER") return "Other";
    return "Home";
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Manage Address <span className="text-slate-300 mx-2">/</span> <span className="text-slate-500 text-lg">Add New Address</span>
        </h1>
      </div>

      {/* Existing Addresses */}
      {isLoadingAddresses || isAuthLoading ? (
        <div className="flex items-center justify-center p-8 bg-white border border-slate-100 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-sm text-slate-500">Loading saved addresses...</span>
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative group hover:border-primary/50 transition-colors">
              {addr.isDefault && (
                <span className="absolute top-4 right-4 text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 px-2 py-1 rounded-full">Default</span>
              )}
              <div className="flex items-center gap-2 mb-2">
                {getTagIcon(addr.tag)}
                <span className="font-semibold text-slate-900">{formatTagLabel(addr.tag)}</span>
              </div>
              <div className="text-sm text-slate-600 space-y-1 mb-4 ml-6">
                <p className="font-medium text-slate-900">{addr.fullName}</p>
                <p>{addr.fullAddress}</p>
                <p className="pt-1 text-xs text-slate-500">{addr.phone}</p>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  className="h-8 text-xs font-medium border-slate-200 text-danger hover:text-danger hover:bg-danger/5"
                >
                  {deletingId === addr.id ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="w-3 h-3 mr-1.5" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-center text-slate-500 text-sm">
          <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
          No saved addresses yet. Add your primary delivery address below.
        </div>
      )}

      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Add New Address</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="Receiver name"
                className={errors.fullName ? "border-danger focus-visible:ring-danger" : ""}
                {...register("fullName")} 
              />
              {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="Receiver phone"
                className={errors.phone ? "border-danger focus-visible:ring-danger" : ""}
                {...register("phone")} 
              />
              {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-slate-400 font-normal">(Optional)</span></Label>
            <Input 
              id="email" 
              type="email"
              placeholder="For order updates"
              className={errors.email ? "border-danger focus-visible:ring-danger" : ""}
              {...register("email")} 
            />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full Address</Label>
            <Textarea 
              id="address" 
              placeholder="House, Road, Block, Area, City"
              className={`min-h-[100px] resize-none ${errors.address ? "border-danger focus-visible:ring-danger" : ""}`}
              {...register("address")} 
            />
            {errors.address && <p className="text-xs text-danger mt-1">{errors.address.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Address Tag</Label>
            <div className="flex flex-wrap gap-3">
              {(["Home", "Office", "Other"] as const).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setActiveTag(tag);
                    setValue("tag", tag);
                  }}
                  className={`px-6 py-2 rounded-full border text-sm font-medium transition-all ${
                    activeTag === tag
                      ? 'border-primary bg-primary text-white' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-6">
            <Button type="submit" className="w-full sm:w-auto px-8" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save And Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
