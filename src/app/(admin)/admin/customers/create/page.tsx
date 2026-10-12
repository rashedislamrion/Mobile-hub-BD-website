"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getStaffToken, API_BASE_URL } from "@/lib/api-client";

const CUSTOMER_SOURCES = [
  "Walk-In",
  "Website",
  "Facebook",
  "Instagram",
  "Referral",
  "Other",
];

export default function AddCustomerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [source, setSource] = useState("Walk-In");

  // Profile image upload state
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    // Upload to server
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        `${API_BASE_URL}/customers/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getStaffToken() || ""}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload image");
      }

      const data = await res.json();
      setProfileImageUrl(data.url);
      toast.success("Profile photo uploaded successfully.");
    } catch (err: any) {
      toast.error(err.message || "Image upload failed.");
      setImagePreview(null);
      setProfileImageUrl(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else {
      const phoneDigits = phone.replace(/[^0-9+]/g, "");
      if (phoneDigits.length < 8) {
        newErrors.phone = "Please enter a valid phone number.";
      }
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }
    }

    if (password.trim() || confirmPassword.trim()) {
      if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long.";
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: fullName.trim(),
        phone: phone.trim(),
        source,
      };

      if (email.trim()) {
        payload.email = email.trim().toLowerCase();
      }

      if (password.trim()) {
        payload.password = password.trim();
        payload.confirmPassword = confirmPassword.trim();
      }

      if (profileImageUrl) {
        payload.profileImageUrl = profileImageUrl;
      }

      const res = await fetch(
        `${API_BASE_URL}/customers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getStaffToken() || ""}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create customer");
      }

      toast.success(`Customer "${fullName}" created successfully!`);
      router.push("/admin/customers");
    } catch (err: any) {
      toast.error(err.message || "Failed to create customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-slate-200 text-slate-600 hover:text-slate-900 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Add Customer</h1>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Main Form - 2 spans) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
                Customer Information
              </h2>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter Full Name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  className={`bg-slate-50 border-slate-200 focus:bg-white ${
                    errors.fullName ? "border-rose-400 focus:ring-rose-400" : ""
                  }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Phone Number <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +8801700000000"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    className={`bg-slate-50 border-slate-200 focus:bg-white font-mono ${
                      errors.phone ? "border-rose-400 focus:ring-rose-400" : ""
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Use full phone number with country code (e.g. +880)
                </p>
                {errors.phone && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  className={`bg-slate-50 border-slate-200 focus:bg-white ${
                    errors.email ? "border-rose-400 focus:ring-rose-400" : ""
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password & Confirm Password (Side-by-side) */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-500" />
                    Login Credentials
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    Leave blank to auto-generate for Walk-In customers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium text-slate-600">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        className={`bg-slate-50 border-slate-200 focus:bg-white pr-10 ${
                          errors.password ? "border-rose-400 focus:ring-rose-400" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-600">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword)
                          setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }}
                      className={`bg-slate-50 border-slate-200 focus:bg-white ${
                        errors.confirmPassword ? "border-rose-400 focus:ring-rose-400" : ""
                      }`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Side Panel - 1 span) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* User profile (Ratio 1:1) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">
                  User profile (Ratio 1:1)
                </Label>
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-40 h-40 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group"
                  >
                    {imagePreview ? (
                      <>
                        <Image
                          src={imagePreview}
                          alt="Customer preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-xs font-medium text-white bg-black/60 px-2 py-1 rounded">
                            Change
                          </span>
                        </div>
                      </>
                    ) : isUploadingImage ? (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        <span className="text-xs">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        <span className="text-xs font-medium text-slate-600">Select</span>
                        <span className="text-[10px] text-slate-400">PNG, JPG or WebP</span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="mt-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-7 gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>

              {/* Customer Source Dropdown */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <Label htmlFor="source" className="text-sm font-semibold text-slate-800">
                  Customer Source
                </Label>
                <select
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  {CUSTOMER_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="border-slate-200 text-slate-600 hover:text-slate-900 px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 shadow-sm"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
