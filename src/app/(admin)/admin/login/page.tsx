"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, LogIn, UserCheck } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStaffAuth } from "@/context/AuthContext";

const adminLoginSchema = z.object({
  identifier: z.string().min(3, "Please enter your registered email or mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleHint: z.string().optional(),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("auto");
  const router = useRouter();
  const { login } = useStaffAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      roleHint: "auto",
    },
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    try {
      const res = await login(
        {
          email: data.identifier,
          emailOrPhone: data.identifier,
          password: data.password,
        },
        true,
      );
      toast.success("Welcome back! Staff login successful.");

      // Role is always resolved server-side from staff database record
      const roleName = (res?.user?.role?.name || "").toLowerCase();
      if (roleName.includes("technician")) {
        router.push("/admin/technician");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials or unauthorized staff account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/70 via-slate-50 to-emerald-50/50 p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Left Panel (Desktop): Promotional Brand Showcase */}
        <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-emerald-50/40 via-white to-green-50/40 p-8 xl:p-10 flex-col items-center justify-center border-r border-slate-100 relative">
          <div className="relative w-full max-w-[520px] flex items-center justify-center">
            <Image
              src="/images/admin-login-brand-panel.jpeg"
              alt="Mobile Hub BD Products & Services"
              width={950}
              height={1150}
              priority
              className="w-full h-auto object-contain rounded-2xl drop-shadow-md"
            />
          </div>
        </div>

        {/* Right Panel: Interactive Login Form Card */}
        <div className="lg:col-span-5 p-6 sm:p-10 xl:p-12 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo-icon.jpeg"
              alt="Mobile Hub BD Logo"
              width={80}
              height={80}
              className="rounded-full shadow-sm"
              priority
            />
          </div>

          {/* Brand Name */}
          <h1 className="text-center text-2xl md:text-3xl font-black tracking-tight mb-1">
            <span className="text-primary">MOBILE</span>{" "}
            <span className="text-slate-900">HUB BD</span>
          </h1>

          {/* Welcome Text */}
          <p className="text-center text-base md:text-lg text-slate-700 mt-2 mb-1">
            Welcome to <span className="font-bold text-primary">Mobile Hub BD</span>
          </p>
          <p className="text-center text-xs text-slate-400 mb-6">Login To Admin</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* UX Convenience: Select Your Role Dropdown */}
            <div className="space-y-1">
              <Label htmlFor="roleHint" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Select Your Role <span className="text-slate-400 font-normal text-[11px]">(Quick Selector)</span>
              </Label>
              <select
                id="roleHint"
                {...register("roleHint")}
                value={selectedRole}
                onChange={(e) => {
                  const val = e.target.value;
                  setValue("roleHint", val);
                  setSelectedRole(val);
                }}
                className="w-full h-11 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              >
                <option value="auto">Auto-detect from Account (Recommended)</option>
                <option value="admin">Global Admin</option>
                <option value="branch_admin">Branch Admin</option>
                <option value="branch_manager">Branch Manager</option>
                <option value="technician">Technician / Repair Engineer</option>
                <option value="salesperson">Salesperson / POS Operator</option>
                <option value="purchase_manager">Purchase Manager</option>
                <option value="product_uploader">Product Uploader</option>
                <option value="customer_service">Customer Service</option>
                <option value="seo">SEO Specialist</option>
                <option value="auditor">Inventory Auditor</option>
                <option value="custom">Custom Staff Role</option>
              </select>
              <p className="text-[10px] text-slate-400 leading-tight">
                * Authorization is always determined server-side from your staff database record.
              </p>
            </div>

            {/* Email / Mobile Field */}
            <div className="space-y-1">
              <Label htmlFor="identifier" className="text-xs font-semibold text-slate-700">
                Email Address or Phone
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder={
                    selectedRole === "technician"
                      ? "Technician email or 01XXXXXXXXX"
                      : selectedRole === "salesperson"
                      ? "Salesperson email or 01XXXXXXXXX"
                      : selectedRole === "branch_admin"
                      ? "Branch Admin email or 01XXXXXXXXX"
                      : selectedRole === "branch_manager"
                      ? "Branch Manager email or 01XXXXXXXXX"
                      : selectedRole === "admin"
                      ? "Admin email or 01XXXXXXXXX"
                      : "you@example.com or 01XXXXXXXXX"
                  }
                  autoComplete="username"
                  className="pl-10 h-11 text-xs sm:text-sm border-slate-200 focus-visible:ring-primary bg-white"
                  {...register("identifier")}
                />
              </div>
              {errors.identifier && <p className="text-xs text-rose-500 ml-1">{errors.identifier.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 text-xs sm:text-sm border-slate-200 focus-visible:ring-primary bg-white"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500 ml-1">{errors.password.message}</p>}
            </div>

            {/* Login Button — gradient green with arrow icon matching mockup */}
            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-md shadow-primary/25 rounded-xl gap-2 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Authenticating..."
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Login
                </>
              )}
            </Button>
          </form>

          {/* Secure Access badge */}
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs text-slate-400 font-medium">Secure Access</span>
          </div>
        </div>

      </div>
    </div>
  );
}
