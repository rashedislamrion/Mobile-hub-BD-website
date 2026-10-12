"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Upload, X, Image as ImageIcon } from "lucide-react";
import { apiGet, apiPatch, apiPost, getImageUrl } from "@/lib/api-client";
import { AccessDenied } from "@/components/admin/AccessDenied";

interface ImageUploadBoxProps {
  label: string;
  sublabel?: string;
  value?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  aspectClass?: string;
}

function ImageUploadBox({
  label,
  sublabel,
  value,
  onUpload,
  onRemove,
  aspectClass = "h-32",
}: ImageUploadBoxProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiPost<{ url: string }>("/business-settings/upload", formData);
      if (res?.url) {
        onUpload(res.url);
        toast.success(`${label} uploaded successfully`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-700">{label}</Label>
        {sublabel && <span className="text-[11px] text-slate-400">{sublabel}</span>}
      </div>
      <div
        className={`relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors flex items-center justify-center overflow-hidden group ${aspectClass}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.gif"
          className="hidden"
          onChange={handleFileChange}
        />

        {value ? (
          <div className="relative w-full h-full p-2 flex items-center justify-center">
            <img
              src={getImageUrl(value)}
              alt={label}
              className="max-h-full max-w-full object-contain rounded"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove image"
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-600 p-4 w-full h-full"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span className="text-xs font-medium text-slate-500">Click to Upload</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function GeneralSettingsPage() {
  const { setTitle } = useAdminPage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Form states
  const [general, setGeneral] = useState<any>({
    websiteName: "MobileHubBD",
    websiteTitle: "MobileHubBD - Smartphone Parts & Repair Shop",
    defaultCurrency: "BDT",
    currencyPosition: "LEFT",
    mobileNumber: "01602670922",
    emailAddress: "mobilehubbd2@gmail.com",
    address: "2/13 Eastern Plaza Shopping Complex, Hatirpool, Dhaka 1205",
    showDownloadAppNav: true,
    googlePlayStoreLink: "https://play.google.com/store",
    appleStoreLink: "https://apple.com/app-store",
    showAdminFooter: true,
    hotlineNumber: "01602670922",
    footerText: "Bangladesh's leading destination for original spare parts and repair services.",
    seoMetaTitle: "MobileHubBD | Genuine Spare Parts",
    seoMetaDescription: "Original displays, batteries and repair parts in Bangladesh.",
    seoKeywords: "mobile parts, display, battery, repair, bangladesh",
  });

  const [branding, setBranding] = useState<any>({
    logoRatio4x1Url: "/images/logo.png",
    faviconUrl: "/favicon.ico",
    appLogoUrl: "",
    splashLogoUrl: "",
    footerLogoRatio4x1Url: "",
    footerQrCodeUrl: "",
  });

  const [removeFields, setRemoveFields] = useState<string[]>([]);

  useEffect(() => {
    setTitle("General Settings");
    loadSettings();
  }, [setTitle]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/business-settings");
      if (data) {
        if (data.general) {
          setGeneral((prev: any) => ({
            ...prev,
            ...data.general,
            websiteName: data.general.websiteName || data.general.companyName || prev.websiteName,
            websiteTitle: data.general.websiteTitle || prev.websiteTitle,
            mobileNumber: data.general.mobileNumber || data.general.phone || prev.mobileNumber,
            emailAddress: data.general.emailAddress || data.general.email || prev.emailAddress,
            defaultCurrency: data.general.defaultCurrency || data.general.currency || "BDT",
            currencyPosition: data.general.currencyPosition || data.currencyTax?.symbolPosition || "LEFT",
          }));
        }
        if (data.branding) {
          setBranding((prev: any) => ({
            ...prev,
            ...data.branding,
            logoRatio4x1Url: data.branding.logoRatio4x1Url || data.branding.logoUrl || "",
            faviconUrl: data.branding.faviconUrl || "",
            appLogoUrl: data.branding.appLogoUrl || "",
            splashLogoUrl: data.branding.splashLogoUrl || "",
            footerLogoRatio4x1Url: data.branding.footerLogoRatio4x1Url || "",
            footerQrCodeUrl: data.branding.footerQrCodeUrl || "",
          }));
        }
      }
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes("Forbidden") || err.message?.includes("restricted") || err.message?.includes("Global Administrators")) {
        setIsForbidden(true);
      } else {
        toast.error(err.message || "Failed to load business settings");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isForbidden) {
    return (
      <AccessDenied
        moduleName="Business Settings"
        message="Access restricted: Only Global Administrators can access or modify system-wide settings."
      />
    );
  }

  const handleRemoveImage = (field: string) => {
    setBranding((prev: any) => ({ ...prev, [field]: null }));
    setRemoveFields((prev) => Array.from(new Set([...prev, field])));
    toast.info(`${field} marked for removal. Click Save to apply.`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiPatch("/business-settings", {
        general,
        branding,
        removeFields,
      });
      setRemoveFields([]);
      toast.success("General settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
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
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">General Settings</h1>
        <p className="text-xs text-slate-500">Configure site identity, branding assets, and footer information</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="general" className="rounded-lg text-xs font-semibold px-6 py-2">
            General Setup
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-lg text-xs font-semibold px-6 py-2">
            SEO Setup
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General Setup */}
        <TabsContent value="general" className="space-y-6">
          {/* Card 1: Website Name + Logos */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6">
              <CardTitle className="text-sm font-bold text-slate-800">Basic Website Info & Assets</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Website Name & Title */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Website Name</Label>
                    <Input
                      value={general.websiteName || ""}
                      onChange={(e) => setGeneral({ ...general, websiteName: e.target.value })}
                      placeholder="e.g. mobilehubbd"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Website Title</Label>
                    <Input
                      value={general.websiteTitle || ""}
                      onChange={(e) => setGeneral({ ...general, websiteTitle: e.target.value })}
                      placeholder="e.g. mobilehubbd - Smartphone Parts & Repair Shop"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Default Currency</Label>
                      <Select
                        value={general.defaultCurrency || "BDT"}
                        onValueChange={(val) => setGeneral({ ...general, defaultCurrency: val })}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BDT">BDT (৳)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Currency Position</Label>
                      <Select
                        value={general.currencyPosition || "LEFT"}
                        onValueChange={(val) => setGeneral({ ...general, currencyPosition: val })}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LEFT">Left (Prefix: ৳100)</SelectItem>
                          <SelectItem value="RIGHT">Right (Suffix: 100৳)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Right Column: Logo & Favicon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadBox
                    label="Logo Ratio 4:1"
                    sublabel="(200×50)"
                    value={branding.logoRatio4x1Url}
                    onUpload={(url) => setBranding({ ...branding, logoRatio4x1Url: url })}
                    onRemove={() => handleRemoveImage("logoRatio4x1Url")}
                    aspectClass="h-44"
                  />
                  <ImageUploadBox
                    label="Favicon"
                    sublabel="(300×300)"
                    value={branding.faviconUrl}
                    onUpload={(url) => setBranding({ ...branding, faviconUrl: url })}
                    onRemove={() => handleRemoveImage("faviconUrl")}
                    aspectClass="h-44"
                  />
                </div>
              </div>

              {/* App Logo & Splash Logo Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                <ImageUploadBox
                  label="App Logo"
                  sublabel="(300×300)"
                  value={branding.appLogoUrl}
                  onUpload={(url) => setBranding({ ...branding, appLogoUrl: url })}
                  onRemove={() => handleRemoveImage("appLogoUrl")}
                  aspectClass="h-36"
                />
                <ImageUploadBox
                  label="Splash Logo"
                  sublabel="(GIF / Image)"
                  value={branding.splashLogoUrl}
                  onUpload={(url) => setBranding({ ...branding, splashLogoUrl: url })}
                  onRemove={() => handleRemoveImage("splashLogoUrl")}
                  aspectClass="h-36"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Others Information */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6">
              <CardTitle className="text-sm font-bold text-slate-800">Others Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Mobile Number</Label>
                  <Input
                    value={general.mobileNumber || ""}
                    onChange={(e) => setGeneral({ ...general, mobileNumber: e.target.value })}
                    placeholder="+880 1700-000000"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <Input
                    type="email"
                    value={general.emailAddress || ""}
                    onChange={(e) => setGeneral({ ...general, emailAddress: e.target.value })}
                    placeholder="contact@mobilehubbd.com"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Address</Label>
                  <Input
                    value={general.address || ""}
                    onChange={(e) => setGeneral({ ...general, address: e.target.value })}
                    placeholder="Physical address"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Download App Link */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Download App Link</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Show/Hide Website Navigation Download App</span>
                <Switch
                  checked={!!general.showDownloadAppNav}
                  onCheckedChange={(val) => setGeneral({ ...general, showDownloadAppNav: val })}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Google Play Store Link</Label>
                  <Input
                    value={general.googlePlayStoreLink || ""}
                    onChange={(e) => setGeneral({ ...general, googlePlayStoreLink: e.target.value })}
                    placeholder="https://play.google.com/..."
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Apple Store Link</Label>
                  <Input
                    value={general.appleStoreLink || ""}
                    onChange={(e) => setGeneral({ ...general, appleStoreLink: e.target.value })}
                    placeholder="https://apple.com/app-store/..."
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Footer Section Info */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Footer Section Info</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Show/Hide Admin Bottom Footer Section</span>
                <Switch
                  checked={!!general.showAdminFooter}
                  onCheckedChange={(val) => setGeneral({ ...general, showAdminFooter: val })}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Hotline Number</Label>
                    <Input
                      value={general.hotlineNumber || ""}
                      onChange={(e) => setGeneral({ ...general, hotlineNumber: e.target.value })}
                      placeholder="+880 9612-000000"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Footer Text</Label>
                    <Textarea
                      rows={3}
                      value={general.footerText || ""}
                      onChange={(e) => setGeneral({ ...general, footerText: e.target.value })}
                      placeholder="Brief footer tagline or about text..."
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadBox
                    label="Frontend Footer Logo Ratio 4:1"
                    sublabel="(Payment badges)"
                    value={branding.footerLogoRatio4x1Url}
                    onUpload={(url) => setBranding({ ...branding, footerLogoRatio4x1Url: url })}
                    onRemove={() => handleRemoveImage("footerLogoRatio4x1Url")}
                    aspectClass="h-40"
                  />
                  <ImageUploadBox
                    label="Frontend Scan the QR"
                    sublabel="(200×200)"
                    value={branding.footerQrCodeUrl}
                    onUpload={(url) => setBranding({ ...branding, footerQrCodeUrl: url })}
                    onRemove={() => handleRemoveImage("footerQrCodeUrl")}
                    aspectClass="h-40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: SEO Setup */}
        <TabsContent value="seo">
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-6">
              <CardTitle className="text-sm font-bold text-slate-800">Search Engine Optimization (SEO)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-w-2xl">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Meta Title</Label>
                <Input
                  value={general.seoMetaTitle || ""}
                  onChange={(e) => setGeneral({ ...general, seoMetaTitle: e.target.value })}
                  placeholder="Meta title for homepage"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Meta Description</Label>
                <Textarea
                  rows={3}
                  value={general.seoMetaDescription || ""}
                  onChange={(e) => setGeneral({ ...general, seoMetaDescription: e.target.value })}
                  placeholder="Meta description for search engines..."
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Meta Keywords</Label>
                <Input
                  value={general.seoKeywords || ""}
                  onChange={(e) => setGeneral({ ...general, seoKeywords: e.target.value })}
                  placeholder="comma, separated, keywords"
                  className="h-10 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
