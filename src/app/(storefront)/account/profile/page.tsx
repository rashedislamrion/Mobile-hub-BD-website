"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Camera, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full Name must be at least 2 characters"),
  mobile: z.string().min(11, "Mobile number must be at least 11 digits"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const displayName = user?.name || "Customer Name";
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.name || "",
      mobile: user?.phone || "",
      email: user?.email || "",
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.name || "",
        mobile: user.phone || "",
        email: user.email || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      await refreshUser();
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-slate-50 shadow-sm">
            <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" />
            <AvatarFallback>{displayName.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-primary shadow-sm">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-900 mb-1">{displayName}</h2>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Active Account
          </Badge>
        </div>
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              className={errors.fullName ? "border-danger focus-visible:ring-danger" : ""}
              {...register("fullName")} 
            />
            {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1 text-[10px] h-5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </Badge>
            </div>
            <Input 
              id="mobile" 
              className={errors.mobile ? "border-danger focus-visible:ring-danger" : ""}
              {...register("mobile")} 
            />
            {errors.mobile && <p className="text-xs text-danger mt-1">{errors.mobile.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email">Email</Label>
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 gap-1 text-[10px] h-5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Unverified
              </Badge>
            </div>
            <Input 
              id="email" 
              type="email"
              className={errors.email ? "border-danger focus-visible:ring-danger" : ""}
              {...register("email")} 
            />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button type="submit" className="w-full sm:w-auto px-8" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
