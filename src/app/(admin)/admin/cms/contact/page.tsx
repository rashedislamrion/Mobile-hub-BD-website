"use client";

import React, { useState, useEffect } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable, StatusBadge } from "@/components/admin/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Check, Loader2, Mail, Phone, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client";
import { format } from "date-fns";

export interface ContactSubmissionRecord {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  createdAt: string;
}

export default function ContactManagementPage() {
  const { setTitle, setBadge } = useAdminPage();
  const [submissions, setSubmissions] = useState<ContactSubmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<ContactSubmissionRecord | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/contact-submissions");
      setSubmissions(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load contact submissions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTitle("Contact Inquiries");
    setBadge("CMS");
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = async (id: string, status: "READ" | "REPLIED" | "ARCHIVED") => {
    try {
      await apiPatch(`/contact-submissions/${id}/status`, { status });
      toast.success(`Marked as ${status.toLowerCase()}`);
      if (selectedSub && selectedSub.id === id) {
        setSelectedSub({ ...selectedSub, status });
      }
      setSubmissions(submissions.map((s) => (s.id === id ? { ...s, status } : s)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact submission?")) return;
    try {
      await apiDelete(`/contact-submissions/${id}`);
      toast.success("Contact submission deleted successfully");
      if (selectedSub && selectedSub.id === id) {
        setSelectedSub(null);
      }
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete submission");
    }
  };

  const columns: ColumnDef<ContactSubmissionRecord>[] = [
    {
      accessorKey: "name",
      header: "Customer Info",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.original.name}</span>
          <span className="text-xs text-slate-500">{row.original.email}</span>
          {row.original.phone && (
            <span className="text-[11px] text-slate-400 block">{row.original.phone}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.original.subject || "General Inquiry"}
        </span>
      ),
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <span className="text-slate-500 text-xs truncate max-w-xs block" title={row.original.message}>
          {row.original.message}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Received At",
      cell: ({ row }) => (
        <span className="text-slate-500 text-xs">
          {format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const type = s === "NEW" ? "info" : s === "REPLIED" ? "success" : s === "READ" ? "warning" : "neutral";
        return <StatusBadge status={s} type={type as any} />;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSub(row.original);
              if (row.original.status === "NEW") {
                handleUpdateStatus(row.original.id, "READ");
              }
            }}
            className="text-xs text-emerald-600"
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> View
          </Button>
          {row.original.status !== "REPLIED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateStatus(row.original.id, "REPLIED")}
              className="text-xs text-slate-500 hover:text-emerald-700"
              title="Mark as Replied"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Replied
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5"
            title="Delete Inquiry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">Storefront Contact Messages</h2>
          <p className="text-xs text-slate-500">Inquiries submitted via public /contact page</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm">
        <DataTable columns={columns} data={submissions} isLoading={isLoading} />
      </div>

      {/* View Message Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={(open) => !open && setSelectedSub(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Message Details</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-4 py-2 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{selectedSub.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" /> {selectedSub.email}
                    </p>
                    {selectedSub.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {selectedSub.phone}
                      </p>
                    )}
                  </div>
                  <Badge className={
                    selectedSub.status === 'NEW' ? 'bg-blue-500 text-white' :
                    selectedSub.status === 'REPLIED' ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'
                  }>
                    {selectedSub.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1 border-t">
                  <Calendar className="w-3 h-3" /> {format(new Date(selectedSub.createdAt), 'MMMM dd, yyyy at h:mm a')}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedSub.subject || 'General Inquiry'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Message</p>
                <p className="text-slate-700 mt-1 whitespace-pre-wrap bg-white p-4 rounded-xl border leading-relaxed">
                  {selectedSub.message}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(selectedSub.id)}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Inquiry
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSub(null)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedSub.id, "REPLIED")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Mark as Replied
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
