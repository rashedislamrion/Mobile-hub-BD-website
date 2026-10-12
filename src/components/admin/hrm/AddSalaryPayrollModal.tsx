"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DollarSign, Wallet, Calendar, User, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";

export interface WalletOption {
  id: string;
  name: string;
  kind: string;
  currentBalance: number | string;
}

export interface StaffOption {
  id: string;
  name: string;
  employeeId: string;
  phone: string;
  department?: { id: string; name: string } | null;
  basicSalary?: number | string;
  allowances?: any;
}

export interface AddSalaryPayrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffList: StaffOption[];
  wallets: WalletOption[];
  onSuccess: () => void;
}

const payrollFormSchema = z
  .object({
    staffId: z.string().min(1, "Please select an employee"),
    salaryMonth: z.string().min(1, "Please select a salary month"),
    walletTypeId: z.string().min(1, "Please select a source wallet"),
    salaryAmount: z.number().min(0, "Salary cannot be negative"),
    bonusAmount: z.number().min(0, "Bonus cannot be negative"),
    allowanceAmount: z.number().min(0, "Allowance cannot be negative"),
    allowanceFrequency: z.string(),
    deductionAmount: z.number().min(0, "Deduction cannot be negative"),
    note: z.string().optional(),
  })
  .refine(
    (data) =>
      data.salaryAmount > 0 ||
      data.bonusAmount > 0 ||
      data.allowanceAmount > 0 ||
      data.deductionAmount > 0,
    {
      message:
        "At least one amount (Salary, Bonus, Allowance, or Deduction) must be greater than zero.",
      path: ["salaryAmount"],
    }
  );

type PayrollFormValues = z.infer<typeof payrollFormSchema>;

export function extractAllowanceTotal(allowances: any): number {
  if (!allowances) return 0;
  if (typeof allowances === "number") return allowances;
  if (typeof allowances === "string") {
    const parsed = parseFloat(allowances);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof allowances === "object") {
    let sum = 0;
    for (const val of Object.values(allowances)) {
      const num = typeof val === "number" ? val : parseFloat(String(val));
      if (!isNaN(num)) sum += num;
    }
    return sum;
  }
  return 0;
}

export function AddSalaryPayrollModal({
  open,
  onOpenChange,
  staffList,
  wallets,
  onSuccess,
}: AddSalaryPayrollModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAllowanceAutoFilled, setIsAllowanceAutoFilled] = useState(false);

  const defaultMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollFormSchema),
    defaultValues: {
      staffId: "",
      salaryMonth: defaultMonth,
      walletTypeId: wallets[0]?.id || "",
      salaryAmount: 0,
      bonusAmount: 0,
      allowanceAmount: 0,
      allowanceFrequency: "Monthly",
      deductionAmount: 0,
      note: "",
    },
  });

  const selectedStaffId = watch("staffId");
  const selectedWalletId = watch("walletTypeId");
  const salaryAmount = watch("salaryAmount") || 0;
  const bonusAmount = watch("bonusAmount") || 0;
  const allowanceAmount = watch("allowanceAmount") || 0;
  const deductionAmount = watch("deductionAmount") || 0;

  // Set default wallet when wallets load
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setValue("walletTypeId", wallets[0].id);
    }
  }, [wallets, selectedWalletId, setValue]);

  // When selected employee changes, auto-populate salary and allowance from profile
  useEffect(() => {
    if (!selectedStaffId) {
      setValue("salaryAmount", 0);
      setValue("allowanceAmount", 0);
      setIsAllowanceAutoFilled(false);
      return;
    }

    const employee = staffList.find((s) => s.id === selectedStaffId);
    if (employee) {
      const basic = Number(employee.basicSalary || 0);
      setValue("salaryAmount", basic);

      const alwTotal = extractAllowanceTotal(employee.allowances);
      if (alwTotal > 0) {
        setValue("allowanceAmount", alwTotal);
        setIsAllowanceAutoFilled(true);
      } else {
        setValue("allowanceAmount", 0);
        setIsAllowanceAutoFilled(false);
      }
    }
  }, [selectedStaffId, staffList, setValue]);

  // Reset form when dialog closes or opens
  useEffect(() => {
    if (open) {
      reset({
        staffId: "",
        salaryMonth: defaultMonth,
        walletTypeId: wallets[0]?.id || "",
        salaryAmount: 0,
        bonusAmount: 0,
        allowanceAmount: 0,
        allowanceFrequency: "Monthly",
        deductionAmount: 0,
        note: "",
      });
      setIsAllowanceAutoFilled(false);
    }
  }, [open, defaultMonth, wallets, reset]);

  const selectedWallet = useMemo(() => {
    return wallets.find((w) => w.id === selectedWalletId);
  }, [wallets, selectedWalletId]);

  const currentWalletBalance = selectedWallet ? Number(selectedWallet.currentBalance) : 0;
  const totalWalletDraw = salaryAmount + bonusAmount + allowanceAmount;
  const netPayout = Math.max(0, totalWalletDraw - deductionAmount);
  const isOverdrawn = totalWalletDraw > currentWalletBalance;

  const onSubmit = async (data: PayrollFormValues) => {
    if (isOverdrawn) {
      toast.error(
        `Insufficient wallet balance! Required draw: ৳${totalWalletDraw.toLocaleString()}, Available: ৳${currentWalletBalance.toLocaleString()}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await apiPost("/wallet-transactions/staff-payment", {
        staffId: data.staffId,
        walletTypeId: data.walletTypeId,
        salaryMonth: data.salaryMonth,
        salaryAmount: data.salaryAmount,
        bonusAmount: data.bonusAmount,
        allowanceAmount: data.allowanceAmount,
        allowanceFrequency: data.allowanceFrequency,
        deductionAmount: data.deductionAmount,
        note: data.note?.trim() || undefined,
      });

      toast.success("Payroll recorded and disbursed successfully!");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save payroll");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-full p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/40">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Add Salary / Payroll
          </DialogTitle>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* ========================================================================= */}
          {/* ROW 1: Employee (dropdown) | Salary Month (month picker)                  */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                {...register("staffId")}
                className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Employee --</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.employeeId} • {st.department?.name || "General"})
                  </option>
                ))}
              </select>
              {errors.staffId && (
                <p className="text-[11px] text-red-500 font-medium">{errors.staffId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Salary Month <span className="text-red-500">*</span>
              </label>
              <Input
                type="month"
                {...register("salaryMonth")}
                className="h-10 text-sm bg-background"
              />
              {errors.salaryMonth && (
                <p className="text-[11px] text-red-500 font-medium">{errors.salaryMonth.message}</p>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 2: Source Wallet (dropdown) | Salary Amount (currency input)          */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Source Wallet <span className="text-red-500">*</span>
                </label>
                {selectedWallet && (
                  <span
                    className={`text-xs font-mono font-semibold ${
                      isOverdrawn ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    Avail: ৳{currentWalletBalance.toLocaleString()}
                  </span>
                )}
              </div>
              <select
                {...register("walletTypeId")}
                className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.kind}) — ৳{Number(w.currentBalance).toLocaleString()}
                  </option>
                ))}
              </select>
              {errors.walletTypeId && (
                <p className="text-[11px] text-red-500 font-medium">{errors.walletTypeId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Salary Amount (৳)
              </label>
              <Controller
                name="salaryAmount"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className="h-10 font-mono font-bold text-foreground bg-background"
                  />
                )}
              />
              {errors.salaryAmount && (
                <p className="text-[11px] text-red-500 font-medium">{errors.salaryAmount.message}</p>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 3: Bonus Amount | Allowance Amount (+ frequency dropdown)             */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Bonus Amount (৳)
              </label>
              <Controller
                name="bonusAmount"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className="h-10 font-mono text-foreground bg-background"
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Allowance Amount (৳)
              </label>
              <div className="flex gap-2">
                <Controller
                  name="allowanceAmount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        setIsAllowanceAutoFilled(false);
                        field.onChange(parseFloat(e.target.value) || 0);
                      }}
                      className="h-10 font-mono text-foreground bg-background flex-1"
                    />
                  )}
                />
                <select
                  {...register("allowanceFrequency")}
                  className="h-10 px-2.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 shrink-0 font-medium"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="One-time">One-time</option>
                </select>
              </div>
              {isAllowanceAutoFilled && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3" /> Auto-filled from employee profile.
                </p>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 4: Deduction Amount | Note (Optional)                                */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Deduction Amount (৳)
              </label>
              <Controller
                name="deductionAmount"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className="h-10 font-mono text-rose-600 dark:text-rose-400 bg-background"
                  />
                )}
              />
              <p className="text-[10px] text-muted-foreground">
                Deductions reduce the employee&apos;s net salary payout.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Note (Optional)
              </label>
              <Textarea
                rows={2}
                placeholder="Add a precise note for this transaction..."
                {...register("note")}
                className="resize-none text-xs bg-background h-[74px]"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LIVE SUMMARY / BREAKDOWN BANNER                                           */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between font-medium text-muted-foreground">
              <span>Gross Draw from Wallet (Salary + Bonus + Allowance):</span>
              <span className="font-mono font-bold text-foreground">
                ৳{totalWalletDraw.toLocaleString()}
              </span>
            </div>
            {deductionAmount > 0 && (
              <div className="flex items-center justify-between font-medium text-rose-600 dark:text-rose-400">
                <span>Total Deductions:</span>
                <span className="font-mono font-bold">
                  − ৳{deductionAmount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-border flex items-center justify-between text-sm font-bold">
              <span className="text-foreground">Net Payout to Employee:</span>
              <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">
                ৳{netPayout.toLocaleString()}
              </span>
            </div>

            {isOverdrawn && (
              <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Insufficient wallet balance! Wallet has ৳{currentWalletBalance.toLocaleString()}, but requires ৳{totalWalletDraw.toLocaleString()}.
                </span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* FOOTER: Cancel / Save Payroll                                             */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isOverdrawn || !selectedStaffId}
              className="px-6 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Save Payroll
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
