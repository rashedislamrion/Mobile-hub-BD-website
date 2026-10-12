"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  emailOrPhone: z.string().min(3, "Email or phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data, false);
      toast.success("Successfully logged in!");
      router.push("/account");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">MobileHubBD</h1>
          <p className="text-slate-500">Welcome back! Please login to your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="emailOrPhone">Email or Phone</Label>
            <Input 
              id="emailOrPhone" 
              placeholder="you@example.com or 01XXXXXXXXX" 
              className={errors.emailOrPhone ? "border-danger focus-visible:ring-danger" : ""}
              {...register("emailOrPhone")} 
            />
            {errors.emailOrPhone && (
              <p className="text-xs text-danger mt-1">{errors.emailOrPhone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-sm font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                className={errors.password ? "border-danger focus-visible:ring-danger pr-10" : "pr-10"}
                {...register("password")} 
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-danger mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="px-4 text-sm text-slate-500">or</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">Don&apos;t have an account? </span>
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
