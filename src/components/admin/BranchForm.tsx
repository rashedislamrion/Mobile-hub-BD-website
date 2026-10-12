"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Check, MapPin, ChevronDown, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiPost, apiPatch } from "@/lib/api-client";

const formSchema = z.object({
  name: z.string().min(2, "Branch name is required"),
  code: z.string().min(2, "Branch code is required"),
  type: z.enum(["OUTLET", "WAREHOUSE", "HEAD_OFFICE"]),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(5, "Contact number is required"),
  altPhone: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  managerId: z.string().optional(),
  openingStockValue: z.coerce.number().optional(),
  taxRegNumber: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  showInFooter: z.boolean().default(true),
  operatingHours: z.array(z.object({
    day: z.string(),
    openTime: z.string(),
    closeTime: z.string(),
    isClosed: z.boolean(),
  })).optional(),
});

type BranchFormValues = z.infer<typeof formSchema>;

export interface ExistingBranchData {
  id: string;
  name: string;
  code: string;
  type: "OUTLET" | "WAREHOUSE" | "HEAD_OFFICE";
  address: string;
  city: string;
  phone: string;
  altPhone?: string | null;
  email?: string | null;
  managerId?: string | null;
  manager?: { id: string; name: string };
  openingStockValue?: number | string;
  taxRegNumber?: string | null;
  status: "ACTIVE" | "INACTIVE";
  showInFooter?: boolean;
  operatingHours?: any;
}

interface BranchFormProps {
  initialData?: ExistingBranchData | null;
  isEdit?: boolean;
  branchId?: string;
}

const defaultOperatingHours = [
  { day: "Sunday", openTime: "10:00", closeTime: "20:00", isClosed: false },
  { day: "Monday", openTime: "10:00", closeTime: "20:00", isClosed: false },
  { day: "Tuesday", openTime: "10:00", closeTime: "20:00", isClosed: false },
  { day: "Wednesday", openTime: "10:00", closeTime: "20:00", isClosed: false },
  { day: "Thursday", openTime: "10:00", closeTime: "20:00", isClosed: false },
  { day: "Friday", openTime: "10:00", closeTime: "20:00", isClosed: false },
  { day: "Saturday", openTime: "10:00", closeTime: "20:00", isClosed: false },
];

export function BranchForm({ initialData, isEdit, branchId }: BranchFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      type: initialData?.type || "OUTLET",
      address: initialData?.address || "",
      city: initialData?.city || "Dhaka",
      phone: initialData?.phone || "",
      altPhone: initialData?.altPhone || "",
      email: initialData?.email || "",
      managerId: initialData?.managerId || "",
      openingStockValue: Number(initialData?.openingStockValue) || 0,
      taxRegNumber: initialData?.taxRegNumber || "",
      status: initialData?.status || "ACTIVE",
      showInFooter: initialData?.showInFooter !== undefined ? initialData.showInFooter : true,
      operatingHours: Array.isArray(initialData?.operatingHours)
        ? initialData.operatingHours
        : defaultOperatingHours,
    },
  });

  const { fields: hoursFields } = useFieldArray({
    name: "operatingHours",
    control: form.control,
  });

  const onSubmit = async (data: BranchFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        managerId: data.managerId ? data.managerId : undefined,
      };

      if (isEdit && branchId) {
        await apiPatch(`/branches/${branchId}`, payload);
        toast.success(`Branch "${data.name}" updated successfully!`);
      } else {
        await apiPost("/branches", payload);
        toast.success(`Branch "${data.name}" created successfully!`);
      }

      router.push("/admin/branch");
    } catch (err: any) {
      toast.error(err.message || "Failed to save branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-6 relative items-start">
        
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-2/3 space-y-6">
          
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 text-lg mb-4">Basic Information</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Gulshan Outlet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. GLS-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Type *</FormLabel>
                    <FormControl>
                      <select 
                        {...field}
                        className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="OUTLET">Outlet / Store</option>
                        <option value="WAREHOUSE">Warehouse</option>
                        <option value="HEAD_OFFICE">Head Office</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full branch address..." className="resize-none h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dhaka" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 text-lg mb-4">Contact Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Phone *</FormLabel>
                    <FormControl><Input placeholder="+880..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="altPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Phone (Optional)</FormLabel>
                    <FormControl><Input placeholder="+880..." {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input type="email" placeholder="branch@example.com" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 text-lg mb-4">Operating Hours</h3>
            
            <div className="space-y-3">
              {hoursFields.map((field, index) => {
                const isClosed = form.watch(`operatingHours.${index}.isClosed`);
                return (
                  <div key={field.id} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="w-24 shrink-0">
                      <span className="text-sm font-medium text-slate-700">{field.day}</span>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`operatingHours.${index}.openTime`}
                        render={({ field: timeField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input type="time" {...timeField} disabled={isClosed} className={isClosed ? "opacity-50" : ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`operatingHours.${index}.closeTime`}
                        render={({ field: timeField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input type="time" {...timeField} disabled={isClosed} className={isClosed ? "opacity-50" : ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`operatingHours.${index}.isClosed`}
                      render={({ field: switchField }) => (
                        <FormItem className="space-y-0 flex items-center gap-2 w-20 justify-end">
                          <FormControl>
                            <Switch checked={switchField.value} onCheckedChange={switchField.onChange} />
                          </FormControl>
                          <FormLabel className="!mt-0 text-xs">Closed</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <details className="group">
              <summary className="font-semibold text-slate-800 text-lg p-6 flex justify-between items-center cursor-pointer list-none">
                Business & Tax Details (Optional)
                <span className="transition group-open:rotate-180">
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </span>
              </summary>
              <div className="p-6 pt-0 border-t border-slate-100 space-y-4">
                <FormField
                  control={form.control}
                  name="openingStockValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Stock Value (৳)</FormLabel>
                      <FormControl><Input type="number" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxRegNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax/VAT Registration Number</FormLabel>
                      <FormControl><Input placeholder="e.g. VAT-12345678" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </details>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-1/3 space-y-6 lg:sticky lg:top-6">
          
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
            <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Status & Visibility</h3>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-semibold">Active Status</FormLabel>
                    <div className="text-xs text-slate-500">
                      {field.value === "ACTIVE" ? "Branch is operational" : "Branch is currently disabled"}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === "ACTIVE"}
                      onCheckedChange={(checked) => field.onChange(checked ? "ACTIVE" : "INACTIVE")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showInFooter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-semibold">Show in Website Footer</FormLabel>
                    <div className="text-xs text-slate-500">
                      Display contact address on storefront footer
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2 pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isEdit ? "Update Branch" : "Save Branch"}
              </button>
              <button 
                type="button" 
                onClick={() => router.push("/admin/branch")}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          
        </div>

      </form>
    </Form>
  );
}
