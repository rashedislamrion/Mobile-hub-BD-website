"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import { toast } from "sonner";

interface OrderDueInfo {
  id: string;
  orderCode: string;
  totalAmount: number | string;
  paidAmount?: number | string;
  dueAmount?: number | string;
  customer?: { id?: string; name?: string; phone?: string } | null;
}

interface AddOrderPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDueInfo | null;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "BKASH", label: "bKash" },
  { id: "CARD", label: "Card" },
  { id: "BANK_TRANSFER", label: "Bank Transfer" },
];

export function AddOrderPaymentModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: AddOrderPaymentModalProps) {
  const [amount, setAmount] = useState<number | string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = Number(order?.totalAmount || 0);
  const paid = Number(order?.paidAmount || 0);
  const due = Number(order?.dueAmount || Math.max(0, total - paid));

  useEffect(() => {
    if (order && isOpen) {
      setAmount(due > 0 ? due : "");
      setPaymentMethod("CASH");
      setNote("");
    }
  }, [order, isOpen, due]);

  if (!order) return null;

  const numAmount = Number(amount) || 0;
  const remainingAfterPayment = Math.max(0, due - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (numAmount > due) {
      toast.error(`Payment amount (৳${numAmount.toLocaleString()}) cannot exceed remaining due (৳${due.toLocaleString()}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await apiPost(`/orders/${order.id}/payments`, {
        amount: numAmount,
        paymentMethod,
        note: note.trim() || undefined,
        customerId: order.customer?.id || undefined,
      });

      toast.success(
        `Payment of ৳${numAmount.toLocaleString()} recorded successfully for Order #${order.orderCode}!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Payment recording error:", err);
      toast.error(err.message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Collect Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Order #{order.orderCode} • {order.customer?.name || "Walk-in Customer"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Financial Recap Pill */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total</span>
            <span className="font-extrabold text-slate-800 text-sm">৳{total.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Paid</span>
            <span className="font-extrabold text-emerald-700 text-sm">৳{paid.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Due</span>
            <span className="font-extrabold text-rose-600 text-sm">৳{due.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center flex items-center justify-center gap-1.5 ${
                    paymentMethod === method.id
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {paymentMethod === method.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">Amount to Collect (৳)</Label>
              <button
                type="button"
                onClick={() => setAmount(due)}
                className="text-[11px] text-emerald-600 font-bold hover:underline"
              >
                Pay Full Due (৳{due.toLocaleString()})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold text-sm">৳</span>
              <Input
                type="number"
                min="0.01"
                max={due}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7 font-mono font-bold text-slate-900 h-10"
                autoFocus
              />
            </div>

            {numAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span>Remaining Due After Payment:</span>
                <span className={`font-bold ${remainingAfterPayment === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                  ৳{remainingAfterPayment.toLocaleString()} {remainingAfterPayment === 0 ? "(Fully Paid)" : "(Partial)"}
                </span>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Payment Note / Reference (Optional)</Label>
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. bKash TrxID, Bank slip no, customer remarks..."
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2 flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || numAmount <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmitting ? "Recording..." : `Confirm Payment (৳${numAmount.toLocaleString()})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
