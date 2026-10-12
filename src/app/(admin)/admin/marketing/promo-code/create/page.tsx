"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";

export default function CreatePromoCodePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states matching client reference exactly
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [singleUserLimit, setSingleUserLimit] = useState("");
  const [maxDiscountCap, setMaxDiscountCap] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState("00:00");
  const [expiredDate, setExpiredDate] = useState(nextMonth);
  const [expiredTime, setExpiredTime] = useState("23:59");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Coupon Code is required");
      return;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      toast.error("Valid discount value is required");
      return;
    }
    if (!startDate || !expiredDate) {
      toast.error("Start and Expired dates are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const validFromIso = new Date(`${startDate}T${startTime || "00:00"}:00`).toISOString();
      const validUntilIso = new Date(`${expiredDate}T${expiredTime || "23:59"}:59`).toISOString();

      await apiPost("/promo-codes", {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        singleUserLimit: singleUserLimit ? Number(singleUserLimit) : undefined,
        maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : undefined,
        validFrom: validFromIso,
        validUntil: validUntilIso,
        status: "ACTIVE",
      });

      toast.success("Promo code created successfully!");
      router.push("/admin/marketing/promo-code");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create promo code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing/promo-code">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Create Promo Code</h1>
          <p className="text-xs text-slate-500">Configure promotional discount coupons</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        {/* Two-column layout matching reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Row 1: Coupon Code / Discount Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Coupon Code <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. SUMMER50"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="h-10 text-sm font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Discount Type <span className="text-rose-500">*</span>
            </label>
            <Select
              value={discountType}
              onValueChange={(val: "PERCENTAGE" | "FIXED") => setDiscountType(val)}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Amount</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Discount / Minimum Order Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Discount <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="any"
              placeholder={discountType === "PERCENTAGE" ? "e.g. 10 (for 10%)" : "e.g. 500 (in ৳)"}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              required
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Minimum Order Amount</label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 1000 (optional)"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* Row 3: Limit For Single User / Maximum Discount Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Limit For Single User</label>
            <Input
              type="number"
              placeholder="e.g. 1"
              value={singleUserLimit}
              onChange={(e) => setSingleUserLimit(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Maximum Discount Amount</label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 500 (optional cap for percentage)"
              value={maxDiscountCap}
              onChange={(e) => setMaxDiscountCap(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* Row 4: Start Date + Start Time / Expired Date + Expired Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Start Date &amp; Start Time <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-10 text-sm"
              />
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Expired Date &amp; Expired Time <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={expiredDate}
                onChange={(e) => setExpiredDate(e.target.value)}
                required
                className="h-10 text-sm"
              />
              <Input
                type="time"
                value={expiredTime}
                onChange={(e) => setExpiredTime(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link href="/admin/marketing/promo-code">
            <Button variant="outline" type="button" className="h-10 text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
