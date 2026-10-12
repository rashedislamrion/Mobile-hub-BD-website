"use client";

import React, { useState, useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Save, CheckCircle2, DollarSign, CreditCard } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api-client";

export default function BusinessSetupPage() {
  const { setTitle } = useAdminPage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: "MobileHubBD",
    companyEmail: "mobilehubbd2@gmail.com",
    companyPhone: "01602670922",
    businessModel: "SINGLE_STORE",
    currencyPosition: "LEFT",
    timeZone: "UTC/GMT +06:00 - Asia/Dhaka",
    paymentMethodsSetup: {
      codEnabled: true,
      onlinePaymentEnabled: true,
    },
  });

  useEffect(() => {
    setTitle("Business Setup");
    loadSetup();
  }, [setTitle]);

  const loadSetup = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/business-settings/setup");
      if (data) {
        setForm((prev) => ({
          ...prev,
          ...data,
          paymentMethodsSetup: {
            ...prev.paymentMethodsSetup,
            ...(data.paymentMethodsSetup || {}),
          },
        }));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load business setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiPatch("/business-settings/setup", form);
      toast.success("Business setup updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save business setup");
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Setup</h1>
        <p className="text-xs text-slate-500">Configure core enterprise parameters and payment methods</p>
      </div>

      {/* Basic Info Pill Tab */}
      <div className="inline-flex bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          className="bg-white text-slate-900 shadow-sm rounded-lg text-xs font-semibold px-6 py-2 transition-all"
        >
          Basic Info
        </button>
      </div>

      {/* Business Information Card */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6">
          <CardTitle className="text-sm font-bold text-slate-800">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Company Name</Label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. mobilehubbd Bangladesh"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Company Email</Label>
              <Input
                type="email"
                value={form.companyEmail}
                onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                placeholder="company@domain.com"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Company Phone</Label>
              <Input
                value={form.companyPhone}
                onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                placeholder="+880 1700-000000"
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
            {/* Business Model */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Business Model</Label>
              <RadioGroup
                value={form.businessModel}
                onValueChange={(val) => setForm({ ...form, businessModel: val })}
                className="flex items-center gap-4 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SINGLE_STORE" id="model-single" />
                  <Label htmlFor="model-single" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Single Store
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Currency Position */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Currency Position</Label>
              <RadioGroup
                value={form.currencyPosition}
                onValueChange={(val) => setForm({ ...form, currencyPosition: val })}
                className="flex items-center gap-4 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LEFT" id="pos-left" />
                  <Label htmlFor="pos-left" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Left (Prefix: ৳100)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RIGHT" id="pos-right" />
                  <Label htmlFor="pos-right" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Right (Suffix: 100৳)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Time Zone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Time Zone</Label>
              <Select
                value={form.timeZone}
                onValueChange={(val) => setForm({ ...form, timeZone: val })}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC/GMT +06:00 - Asia/Dhaka">UTC/GMT +06:00 - Asia/Dhaka</SelectItem>
                  <SelectItem value="UTC/GMT +00:00 - London">UTC/GMT +00:00 - London</SelectItem>
                  <SelectItem value="UTC/GMT -05:00 - New York">UTC/GMT -05:00 - New York</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Setup Card */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6">
          <CardTitle className="text-sm font-bold text-slate-800">Payment Method Setup</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cash on Delivery Card */}
            <div
              className={`relative border-2 rounded-xl p-5 transition-all ${
                form.paymentMethodsSetup.codEnabled
                  ? "border-emerald-500 bg-emerald-50/30"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              {form.paymentMethodsSetup.codEnabled && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                  💰
                </div>
                <div className="space-y-1 pr-12">
                  <h4 className="text-sm font-bold text-slate-900">Cash on Delivery</h4>
                  <p className="text-xs text-slate-500">
                    Enable customers to pay with physical cash upon receiving parcel delivery
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Enable COD</span>
                <Switch
                  checked={!!form.paymentMethodsSetup.codEnabled}
                  onCheckedChange={(val) =>
                    setForm({
                      ...form,
                      paymentMethodsSetup: {
                        ...form.paymentMethodsSetup,
                        codEnabled: val,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Online Payment Card */}
            <div
              className={`relative border-2 rounded-xl p-5 transition-all ${
                form.paymentMethodsSetup.onlinePaymentEnabled
                  ? "border-emerald-500 bg-emerald-50/30"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              {form.paymentMethodsSetup.onlinePaymentEnabled && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                  💳
                </div>
                <div className="space-y-1 pr-12">
                  <h4 className="text-sm font-bold text-slate-900">Online Payment</h4>
                  <p className="text-xs text-slate-500">
                    Enable digital gateway transactions via bKash, SSLCommerz, debit/credit cards
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Enable Online Payment</span>
                <Switch
                  checked={!!form.paymentMethodsSetup.onlinePaymentEnabled}
                  onCheckedChange={(val) =>
                    setForm({
                      ...form,
                      paymentMethodsSetup: {
                        ...form.paymentMethodsSetup,
                        onlinePaymentEnabled: val,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 flex justify-end bg-white/95 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-lg">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-8 h-10 shadow-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save And Update
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
