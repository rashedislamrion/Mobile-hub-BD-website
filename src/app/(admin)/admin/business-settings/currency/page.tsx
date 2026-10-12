"use client";

import React, { useState, useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Loader2, Plus, Pencil, Trash2, Coins } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

interface CurrencyItem {
  id: string;
  name: string;
  symbol: string;
  rate: number | string;
  isDefault: boolean;
}

export default function CurrencyPage() {
  const { setTitle } = useAdminPage();
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    rate: 1,
    isDefault: false,
  });

  useEffect(() => {
    setTitle("Currency");
    loadCurrencies();
  }, [setTitle]);

  const loadCurrencies = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<CurrencyItem[]>("/currencies");
      setCurrencies(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load currencies");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      symbol: "",
      rate: 1,
      isDefault: false,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: CurrencyItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      symbol: item.symbol,
      rate: Number(item.rate),
      isDefault: item.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.symbol.trim()) {
      toast.error("Name and Symbol are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await apiPatch(`/currencies/${editingId}`, {
          name: formData.name.trim().toUpperCase(),
          symbol: formData.symbol.trim(),
          rate: Number(formData.rate),
          isDefault: formData.isDefault,
        });
        toast.success("Currency updated successfully");
      } else {
        await apiPost("/currencies", {
          name: formData.name.trim().toUpperCase(),
          symbol: formData.symbol.trim(),
          rate: Number(formData.rate),
          isDefault: formData.isDefault,
        });
        toast.success("Currency created successfully");
      }
      setIsDialogOpen(false);
      loadCurrencies();
    } catch (err: any) {
      toast.error(err.message || "Failed to save currency");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: CurrencyItem) => {
    if (item.isDefault || item.name === "BDT") {
      toast.error("Cannot delete default currency or BDT");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;

    try {
      await apiDelete(`/currencies/${item.id}`);
      toast.success(`${item.name} deleted successfully`);
      loadCurrencies();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete currency");
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Currency</h1>
          <p className="text-xs text-slate-500">Manage currencies and conversion rates relative to BDT</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 gap-2 rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New
        </Button>
      </div>

      {/* Currency Table Card */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-16 font-bold text-xs text-slate-600">SL</TableHead>
                <TableHead className="font-bold text-xs text-slate-600">NAME</TableHead>
                <TableHead className="font-bold text-xs text-slate-600">SYMBOL</TableHead>
                <TableHead className="font-bold text-xs text-slate-600">RATE</TableHead>
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
              ) : currencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-sm">
                    No currencies found
                  </TableCell>
                </TableRow>
              ) : (
                currencies.map((c, index) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs font-medium text-slate-500">{index + 1}</TableCell>
                    <TableCell className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      {c.name}
                      {c.isDefault && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">{c.symbol}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">
                      {c.isDefault ? (
                        <span className="font-semibold text-emerald-700">1 (Default)</span>
                      ) : (
                        <span>{Number(c.rate)} (From BDT)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit"
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {!c.isDefault && c.name !== "BDT" && (
                          <button
                            onClick={() => handleDelete(c)}
                            title="Delete"
                            className="w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
                {editingId ? "Edit Currency" : "Create New Currency"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Currency Name</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. USD, EUR, GBP"
                  className="h-10 text-sm uppercase"
                  disabled={editingId !== null && formData.name === "BDT"}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Currency Symbol</Label>
                <Input
                  required
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="e.g. $, €, £, ৳"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Rate (From BDT) {formData.name === "BDT" && <span className="text-slate-400 font-normal">(BDT rate is always 1)</span>}
                </Label>
                <Input
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  disabled={formData.name === "BDT"}
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 1 })}
                  className="h-10 text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 pt-3">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800">Set as Default Currency</Label>
                  <p className="text-[11px] text-slate-400">Only one currency can be default at a time</p>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(val) => setFormData({ ...formData, isDefault: val })}
                  disabled={editingId !== null && formData.name === "BDT" && formData.isDefault}
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
                  "Update Currency"
                ) : (
                  "Create Currency"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
