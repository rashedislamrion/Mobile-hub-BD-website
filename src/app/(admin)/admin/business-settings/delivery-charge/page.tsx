"use client";

import React, { useState, useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

interface DeliveryTier {
  id: string;
  minOrderQty: number;
  maxOrderQty: number;
  charge: number | string;
}

export default function DeliveryChargePage() {
  const { setTitle } = useAdminPage();
  const [tiers, setTiers] = useState<DeliveryTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    minOrderQty: 1,
    maxOrderQty: 5,
    charge: 60,
  });

  useEffect(() => {
    setTitle("Delivery Charge");
    loadTiers();
  }, [setTitle]);

  const loadTiers = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<DeliveryTier[]>("/delivery-charges");
      setTiers(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load delivery tiers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      minOrderQty: 1,
      maxOrderQty: 5,
      charge: 60,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (tier: DeliveryTier) => {
    setEditingId(tier.id);
    setFormData({
      minOrderQty: tier.minOrderQty,
      maxOrderQty: tier.maxOrderQty,
      charge: Number(tier.charge),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const min = Number(formData.minOrderQty);
    const max = Number(formData.maxOrderQty);
    const charge = Number(formData.charge);

    if (min >= max) {
      toast.error("Min Order Qty must be strictly less than Max Order Qty");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await apiPatch(`/delivery-charges/${editingId}`, {
          minOrderQty: min,
          maxOrderQty: max,
          charge,
        });
        toast.success("Delivery charge tier updated successfully");
      } else {
        await apiPost("/delivery-charges", {
          minOrderQty: min,
          maxOrderQty: max,
          charge,
        });
        toast.success("Delivery charge tier created successfully");
      }
      setIsDialogOpen(false);
      loadTiers();
    } catch (err: any) {
      toast.error(err.message || "Failed to save delivery tier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tier: DeliveryTier) => {
    if (!confirm(`Delete tier ${tier.minOrderQty} - ${tier.maxOrderQty} qty?`)) return;

    try {
      await apiDelete(`/delivery-charges/${tier.id}`);
      toast.success("Delivery charge tier deleted successfully");
      loadTiers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete tier");
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Delivery Charge</h1>
          <p className="text-xs text-slate-500">Configure tier-based courier shipping charges by order item quantity</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 gap-2 rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New
        </Button>
      </div>

      {/* Table Card */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-16 font-bold text-xs text-slate-600">SL</TableHead>
                <TableHead className="font-bold text-xs text-slate-600">MIN. ORDER QTY</TableHead>
                <TableHead className="font-bold text-xs text-slate-600">MAX. ORDER QTY</TableHead>
                <TableHead className="font-bold text-xs text-slate-600">CHARGE</TableHead>
                <TableHead className="w-28 text-right font-bold text-xs text-slate-600">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : tiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-400 text-sm">
                    No Data Found
                  </TableCell>
                </TableRow>
              ) : (
                tiers.map((t, index) => (
                  <TableRow key={t.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs font-medium text-slate-500">{index + 1}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800">{t.minOrderQty}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800">{t.maxOrderQty}</TableCell>
                    <TableCell className="text-xs font-bold text-emerald-700">৳{Number(t.charge)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          title="Edit"
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          title="Delete"
                          className="w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                {editingId ? "Edit Delivery Tier" : "Create New Delivery Tier"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Min Order Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={formData.minOrderQty}
                    onChange={(e) => setFormData({ ...formData, minOrderQty: parseInt(e.target.value) || 1 })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Max Order Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={formData.maxOrderQty}
                    onChange={(e) => setFormData({ ...formData, maxOrderQty: parseInt(e.target.value) || 1 })}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Charge (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={formData.charge}
                  onChange={(e) => setFormData({ ...formData, charge: parseFloat(e.target.value) || 0 })}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Saving...
                  </>
                ) : editingId ? (
                  "Update Tier"
                ) : (
                  "Create Tier"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
