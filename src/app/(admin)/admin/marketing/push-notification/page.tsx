"use client";

import { useEffect, useState } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { DataTable, StatusBadge } from "@/components/admin/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import { format } from "date-fns";

export interface PushNotificationRecord {
  id: string;
  title: string;
  message: string;
  targetAudience: "ALL_CUSTOMERS" | "REGISTERED_USERS" | "SPECIFIC_USERS";
  linkUrl?: string | null;
  scheduledAt?: string | null;
  deliveredCount?: number | null;
  status: "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";
  createdAt: string;
}

export default function PushNotificationPage() {
  const { setTitle, setBadge, setDateFilter } = useAdminPage();
  const [data, setData] = useState<PushNotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    targetAudience: "ALL_CUSTOMERS" as "ALL_CUSTOMERS" | "REGISTERED_USERS",
    linkUrl: "",
    sendOption: "now" as "now" | "scheduled",
    scheduledAt: "",
  });

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<PushNotificationRecord[]>("/push-notifications");
      setData(res || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTitle("Push Notifications");
    setBadge("Marketing");
    setDateFilter("");
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost("/push-notifications", {
        title: newNotification.title.trim(),
        message: newNotification.message.trim(),
        targetAudience: newNotification.targetAudience,
        linkUrl: newNotification.linkUrl.trim() || undefined,
        sendOption: newNotification.sendOption,
        scheduledAt: newNotification.scheduledAt ? new Date(newNotification.scheduledAt).toISOString() : undefined,
      });
      toast.success(newNotification.sendOption === "now" ? "Notification broadcasted successfully!" : "Notification scheduled");
      setIsDialogOpen(false);
      setNewNotification({
        title: "",
        message: "",
        targetAudience: "ALL_CUSTOMERS",
        linkUrl: "",
        sendOption: "now",
        scheduledAt: "",
      });
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notification record?")) return;
    try {
      await apiDelete(`/push-notifications/${id}`);
      toast.success("Notification deleted");
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete notification");
    }
  };

  const columns: ColumnDef<PushNotificationRecord>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-bold text-slate-800">{row.original.title}</span>,
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <span className="text-slate-500 truncate max-w-[250px] block text-xs" title={row.original.message}>
          {row.original.message}
        </span>
      ),
    },
    {
      accessorKey: "targetAudience",
      header: "Target Audience",
      cell: ({ row }) => (
        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
          {row.original.targetAudience.replace("_", " ")}
        </span>
      ),
    },
    {
      accessorKey: "deliveredCount",
      header: "Delivered",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-emerald-600">
          {row.original.deliveredCount !== null ? row.original.deliveredCount : "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date Sent / Scheduled",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">
          {format(new Date(row.original.scheduledAt || row.original.createdAt), "MMM d, yyyy h:mm a")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const type = s === "SENT" ? "success" : s === "SCHEDULED" ? "info" : s === "FAILED" ? "error" : "neutral";
        return <StatusBadge status={s} type={type as any} />;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
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
          <h2 className="text-base font-bold text-slate-800">Push Notification Broadcast</h2>
          <p className="text-xs text-slate-500">Send instant browser and app notifications to customers</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">
          <Plus className="w-4 h-4 mr-1.5" /> Send New Notification
        </Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm">
        <DataTable columns={columns} data={data} isLoading={isLoading} />
      </div>

      {/* Push Notification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Push Notification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSend} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Notification Title *</label>
              <Input
                placeholder="e.g. Flash Sale Alert! ⚡"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Notification Body *</label>
              <Textarea
                placeholder="Write your push notification message here..."
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Target Audience</label>
              <Select
                value={newNotification.targetAudience}
                onValueChange={(val: any) => setNewNotification({ ...newNotification, targetAudience: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_CUSTOMERS">All Customers</SelectItem>
                  <SelectItem value="REGISTERED_USERS">Registered Accounts Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Action Link URL</label>
              <Input
                placeholder="e.g. /category/all or /checkout"
                value={newNotification.linkUrl}
                onChange={(e) => setNewNotification({ ...newNotification, linkUrl: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Send Timing</label>
              <Select
                value={newNotification.sendOption}
                onValueChange={(val: any) => setNewNotification({ ...newNotification, sendOption: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Send Immediately</SelectItem>
                  <SelectItem value="scheduled">Schedule for Later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newNotification.sendOption === "scheduled" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Scheduled Date & Time</label>
                <Input
                  type="datetime-local"
                  value={newNotification.scheduledAt}
                  onChange={(e) => setNewNotification({ ...newNotification, scheduledAt: e.target.value })}
                  required
                />
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : newNotification.sendOption === "now" ? (
                <span className="flex items-center gap-1.5 justify-center">
                  <BellRing className="w-4 h-4" /> Broadcast Now
                </span>
              ) : (
                "Schedule Notification"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
