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

export interface TicketIssueTypeRecord {
  id: string;
  name: string;
  category: "PRODUCT_ISSUE" | "DELIVERY_ISSUE" | "PAYMENT_ISSUE" | "WARRANTY_CLAIM" | "OTHER";
  autoAssignRole?: string | null;
  status: "ACTIVE" | "INACTIVE";
  _count?: { tickets: number };
}

export default function TicketIssuesManagementPage() {
  const { setTitle, setBadge } = useAdminPage();
  const [issueTypes, setIssueTypes] = useState<TicketIssueTypeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newType, setNewType] = useState({
    name: "",
    category: "PRODUCT_ISSUE" as "PRODUCT_ISSUE" | "DELIVERY_ISSUE" | "PAYMENT_ISSUE" | "WARRANTY_CLAIM" | "OTHER",
    autoAssignRole: "SUPPORT_STAFF",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const fetchIssueTypes = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<TicketIssueTypeRecord[]>("/ticket-issue-types");
      setIssueTypes(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load issue types");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTitle("Ticket Issue Types");
    setBadge("CMS");
    fetchIssueTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveIssueType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.name.trim()) {
      toast.error("Issue type name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost("/ticket-issue-types", {
        name: newType.name.trim(),
        category: newType.category,
        autoAssignRole: newType.autoAssignRole.trim() || undefined,
        status: newType.status,
      });
      toast.success("Issue type created successfully!");
      setIsDialogOpen(false);
      setNewType({
        name: "",
        category: "PRODUCT_ISSUE",
        autoAssignRole: "SUPPORT_STAFF",
        status: "ACTIVE",
      });
      fetchIssueTypes();
    } catch (err: any) {
      toast.error(err.message || "Failed to create issue type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this issue category?")) return;
    try {
      await apiDelete(`/ticket-issue-types/${id}`);
      toast.success("Issue type deleted");
      fetchIssueTypes();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete issue type");
    }
  };

  const handleToggleStatus = async (type: TicketIssueTypeRecord) => {
    const nextStatus = type.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiPatch(`/ticket-issue-types/${type.id}`, { status: nextStatus });
      toast.success(`Category is now ${nextStatus.toLowerCase()}`);
      setIssueTypes(issueTypes.map((t) => (t.id === type.id ? { ...t, status: nextStatus } : t)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const columns: any[] = [
    {
      accessorKey: "name",
      header: "Issue Type Name",
      cell: ({ row }: any) => (
        <span className="font-bold text-slate-900">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }: any) => (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">
          {row.original.category.replace("_", " ")}
        </span>
      ),
    },
    {
      accessorKey: "autoAssignRole",
      header: "Auto-Assign Role",
      cell: ({ row }: any) => (
        <span className="text-slate-600 text-xs font-mono">{row.original.autoAssignRole || "—"}</span>
      ),
    },
    {
      id: "activeTickets",
      header: "Active Tickets",
      cell: ({ row }: any) => (
        <span className="text-slate-700 font-semibold text-xs">{row.original._count?.tickets || 0}</span>
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
          <h2 className="text-base font-bold text-slate-800">Support Ticket Categories</h2>
          <p className="text-xs text-slate-500">Classify customer complaints and auto-assign to departments</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">
          <Plus className="w-4 h-4 mr-1.5" /> Add Issue Type
        </Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm">
        <DataTable columns={columns} data={issueTypes} isLoading={isLoading} />
      </div>

      {/* Add Issue Type Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Ticket Issue Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveIssueType} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Issue Type Name *</label>
              <Input
                placeholder="e.g. Broken Screen on Delivery"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Department / Category</label>
              <Select
                value={newType.category}
                onValueChange={(val: any) => setNewType({ ...newType, category: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCT_ISSUE">Product Defect / Spare Issue</SelectItem>
                  <SelectItem value="DELIVERY_ISSUE">Courier & Delivery Issue</SelectItem>
                  <SelectItem value="PAYMENT_ISSUE">Payment / Refund Issue</SelectItem>
                  <SelectItem value="WARRANTY_CLAIM">Warranty Claim</SelectItem>
                  <SelectItem value="OTHER">General Inquiries</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Auto-Assign Role</label>
              <Input
                placeholder="e.g. SUPPORT_STAFF or TECHNICIAN"
                value={newType.autoAssignRole}
                onChange={(e) => setNewType({ ...newType, autoAssignRole: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
