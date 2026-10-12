"use client";

import React, { useState, useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck, PhoneCall } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api-client";

export default function ManageVerificationPage() {
  const { setTitle } = useAdminPage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    customerRegistrationOtpVerify: false,
    mustVerifyOnOrderPlacement: false,
    registerOtpMethod: "PHONE",
    forgetPasswordOtpMethod: "PHONE",
    registrationPhoneRequired: true,
    phoneMinLength: 11,
    phoneMaxLength: 11,
  });

  useEffect(() => {
    setTitle("Manage Verification");
    loadVerification();
  }, [setTitle]);

  const loadVerification = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/business-settings/verification");
      if (data) {
        setForm((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load verification settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiPatch("/business-settings/verification", form);
      toast.success("Verification settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save verification settings");
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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manage Verification</h1>
        <p className="text-xs text-slate-500">
          Configure registration OTP validation, order verification rules, and mobile length constraints
        </p>
      </div>

      {/* Verification Card */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-800">Verification</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Toggles Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/40">
              <div className="space-y-0.5 pr-4">
                <Label className="text-xs font-bold text-slate-800">Customer Registration OTP Verify</Label>
                <p className="text-[11px] text-slate-500">Send an OTP verification token upon account registration</p>
              </div>
              <Switch
                checked={!!form.customerRegistrationOtpVerify}
                onCheckedChange={(val) => setForm({ ...form, customerRegistrationOtpVerify: val })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/40">
              <div className="space-y-0.5 pr-4">
                <Label className="text-xs font-bold text-slate-800">Must Verify Account on Order Placement</Label>
                <p className="text-[11px] text-slate-500">Block guest checkout until account is validated via OTP</p>
              </div>
              <Switch
                checked={!!form.mustVerifyOnOrderPlacement}
                onCheckedChange={(val) => setForm({ ...form, mustVerifyOnOrderPlacement: val })}
              />
            </div>
          </div>

          {/* Radios Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-800">Register OTP Send / Account Verify Method</Label>
              <RadioGroup
                value={form.registerOtpMethod}
                onValueChange={(val) => setForm({ ...form, registerOtpMethod: val })}
                className="flex items-center gap-6 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PHONE" id="reg-phone" />
                  <Label htmlFor="reg-phone" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Phone (SMS)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EMAIL" id="reg-email" />
                  <Label htmlFor="reg-email" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Email
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-800">Forget Password OTP Send Method</Label>
              <RadioGroup
                value={form.forgetPasswordOtpMethod}
                onValueChange={(val) => setForm({ ...form, forgetPasswordOtpMethod: val })}
                className="flex items-center gap-6 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PHONE" id="forgot-phone" />
                  <Label htmlFor="forgot-phone" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Phone (SMS)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EMAIL" id="forgot-email" />
                  <Label htmlFor="forgot-email" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Email
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone Number Validation Card */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-800">Phone Number Validation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/40">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-slate-800">Registration Phone Required</Label>
              <p className="text-[11px] text-slate-500">
                Require phone number input during customer sign-up
              </p>
            </div>
            <Switch
              checked={!!form.registrationPhoneRequired}
              onCheckedChange={(val) => setForm({ ...form, registrationPhoneRequired: val })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Minimum Length (without Country Code)</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.phoneMinLength}
                onChange={(e) => setForm({ ...form, phoneMinLength: parseInt(e.target.value) || 11 })}
                className="h-10 text-sm"
              />
              <span className="text-[11px] text-slate-400">Standard Bangladesh format is 11 digits (e.g. 01711223344)</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Maximum Length (without Country Code)</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.phoneMaxLength}
                onChange={(e) => setForm({ ...form, phoneMaxLength: parseInt(e.target.value) || 11 })}
                className="h-10 text-sm"
              />
              <span className="text-[11px] text-slate-400">Maximum allowed digits for local phone validation</span>
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
