"use client";

import React, { useState, useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable, StatusBadge } from "@/components/admin/DataTable";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export interface CountryRecord {
  id: string;
  name: string;
  code: string;
  phoneCode?: string | null;
  currency?: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export default function CountriesManagementPage() {
  const { setTitle, setBadge } = useAdminPage();
  const [countries, setCountries] = useState<CountryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCountry, setNewCountry] = useState({
    name: "",
    code: "",
    phoneCode: "+880",
    currency: "BDT",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const fetchCountries = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<CountryRecord[]>("/countries");
      setCountries(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load countries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTitle("Country List");
    setBadge("CMS");
    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountry.name.trim() || !newCountry.code.trim()) {
      toast.error("Country name and ISO code are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost("/countries", {
        name: newCountry.name.trim(),
        code: newCountry.code.trim().toUpperCase(),
        phoneCode: newCountry.phoneCode.trim() || undefined,
        currency: newCountry.currency.trim() || undefined,
        status: newCountry.status,
      });
      toast.success("Country added successfully!");
      setIsDialogOpen(false);
      setNewCountry({
        name: "",
        code: "",
        phoneCode: "+880",
        currency: "BDT",
        status: "ACTIVE",
      });
      fetchCountries();
    } catch (err: any) {
      toast.error(err.message || "Failed to add country");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this country?")) return;
    try {
      await apiDelete(`/countries/${id}`);
      toast.success("Country deleted");
      fetchCountries();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete country");
    }
  };

  const handleToggleStatus = async (c: CountryRecord) => {
    const nextStatus = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiPatch(`/countries/${c.id}`, { status: nextStatus });
      toast.success(`Country is now ${nextStatus.toLowerCase()}`);
      setCountries(countries.map((x) => (x.id === c.id ? { ...x, status: nextStatus } : x)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const columns: any[] = [
    {
      accessorKey: "name",
      header: "Country Name",
      cell: ({ row }: any) => (
        <span className="font-bold text-slate-900">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "code",
      header: "ISO Code",
      cell: ({ row }: any) => (
        <span className="text-slate-500 font-mono text-xs uppercase">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "phoneCode",
      header: "Dial Code",
      cell: ({ row }: any) => (
        <span className="text-slate-600 text-xs font-mono">{row.original.phoneCode || "—"}</span>
      ),
    },
    {
      accessorKey: "currency",
      header: "Currency",
      cell: ({ row }: any) => (
        <span className="text-slate-700 text-xs font-semibold">{row.original.currency || "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const s = row.original.status;
        const type = s === "ACTIVE" ? "success" : "neutral";
        return <StatusBadge status={s} type={type as any} />;
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(row.original)}
            className="text-xs text-slate-600"
          >
            {row.original.status === "ACTIVE" ? "Disable" : "Enable"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            className="text-slate-400 hover:text-danger"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">Operational Countries & Currencies</h2>
          <p className="text-xs text-slate-500">Configure regions where orders, shipping, and phone verification are allowed</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">
          <Plus className="w-4 h-4 mr-1.5" /> Add Country
        </Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm">
        <DataTable columns={columns} data={countries} isLoading={isLoading} />
      </div>

      {/* Add Country Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Country</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCountry} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Country Name *</label>
              <Input
                placeholder="e.g. Bangladesh"
                value={newCountry.name}
                onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ISO Code (2-letter) *</label>
                <Input
                  placeholder="BD"
                  value={newCountry.code}
                  onChange={(e) => setNewCountry({ ...newCountry, code: e.target.value.toUpperCase() })}
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Dial Code</label>
                <Input
                  placeholder="+880"
                  value={newCountry.phoneCode}
                  onChange={(e) => setNewCountry({ ...newCountry, phoneCode: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Currency Code</label>
              <Input
                placeholder="BDT"
                value={newCountry.currency}
                onChange={(e) => setNewCountry({ ...newCountry, currency: e.target.value.toUpperCase() })}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Country"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
