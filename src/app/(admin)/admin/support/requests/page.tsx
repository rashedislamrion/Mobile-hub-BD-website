"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminPage } from "@/contexts/AdminPageContext";
import { ChevronRight, ChevronDown, MessageSquare, Clock, User, Phone, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client";
import { format } from "date-fns";

export interface SupportTicketRecord {
  id: string;
  ticketCode: string;
  subject: string;
  description: string;
  orderNumber: string;
  status: "RUNNING" | "COMPLETED" | "CANCELLED";
  statusLabel?: string;
  createdAt: string;
  customer?: { id: string; name: string; email?: string; phone?: string };
  issueType?: { id: string; name: string };
  assignedTo?: { id: string; name: string; employeeId?: string };
  messages?: Array<{
    id: string;
    senderType: "CUSTOMER" | "STAFF";
    message: string;
    createdAt: string;
  }>;
}

export default function SupportRequestsPage() {
  const { setTitle, setBadge } = useAdminPage();
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("All");
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: Record<string, any> = {};
      if (sortBy && sortBy !== "All") {
        query.sortBy = sortBy;
      }
      const res = await apiGet<{ data: SupportTicketRecord[]; meta: any }>("/support-tickets", query);
      setTickets(res.data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load support requests");
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    setTitle("All Help Requests");
    setBadge("Support");
    fetchTickets();
  }, [setTitle, setBadge, fetchTickets]);

  const handleUpdateStatus = async (ticketId: string, newStatus: "RUNNING" | "COMPLETED" | "CANCELLED") => {
    try {
      await apiPatch(`/support-tickets/${ticketId}/status`, { status: newStatus });
      toast.success("Ticket status updated");
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to update ticket status");
    }
  };

  const handleDeleteTicket = async (ticket: SupportTicketRecord) => {
    if (!confirm(`Are you sure you want to delete ticket "${ticket.ticketCode}"? This cannot be undone.`)) {
      return;
    }
    try {
      await apiDelete(`/support-tickets/${ticket.id}`);
      toast.success(`Ticket ${ticket.ticketCode} deleted`);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete ticket");
    }
  };

  const getStatusBadge = (status: string, label?: string) => {
    const text = label || (status === "RUNNING" ? "Confirm" : status === "COMPLETED" ? "Completed" : "Cancelled");
    if (status === "COMPLETED") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {text}
        </span>
      );
    }
    if (status === "CANCELLED") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {text}
        </span>
      );
    }
    // Default / RUNNING -> Purple "Confirm" badge per client reference
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
        {text}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header matching reference: "All Help Requests" + "Short By: All" */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">All Help Requests</h1>
          <p className="text-xs text-slate-500">View and respond to incoming customer help requests</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Short By:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 h-9 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Newest">Newest</SelectItem>
              <SelectItem value="Oldest">Oldest</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets Card List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-5 shadow-sm animate-pulse h-32" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">No help requests found</p>
          <p className="text-xs text-slate-400 mt-1">There are no tickets matching the current filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isExpanded = expandedTicketId === ticket.id;
            let formattedDate = "-";
            try {
              formattedDate = format(new Date(ticket.createdAt), "dd MMM yyyy, hh:mm a");
            } catch {}

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors overflow-hidden"
              >
                {/* Card Main Header & Summary */}
                <div
                  onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  {/* Top Row: Date (Left) + Code in Blue and Status Badge (Right) */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600 font-bold font-mono text-sm tracking-wide">
                        #{ticket.ticketCode}
                      </span>
                      {getStatusBadge(ticket.status, ticket.statusLabel)}
                    </div>
                  </div>

                  {/* 3-Column Row: Order Number, Issue Type, Subject + Chevron on right */}
                  <div className="flex items-center justify-between mt-3.5 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                      {/* Column 1: Order Number */}
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          Order Number
                        </span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5 font-mono">
                          {ticket.orderNumber || "—"}
                        </p>
                      </div>

                      {/* Column 2: Issue Type */}
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          Issue Type
                        </span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">
                          {ticket.issueType?.name || "General Query"}
                        </p>
                      </div>

                      {/* Column 3: Subject */}
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          Subject
                        </span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5 line-clamp-1">
                          {ticket.subject}
                        </p>
                      </div>
                    </div>

                    <div className="pl-4 flex items-center text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details / Thread */}
                {isExpanded && (
                  <div className="bg-slate-50/80 p-5 border-t border-slate-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{ticket.customer?.name || "Guest Customer"}</span>
                        </div>
                        {ticket.customer?.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{ticket.customer.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Status Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Update Status:</span>
                        <Button
                          size="sm"
                          variant={ticket.status === "RUNNING" ? "default" : "outline"}
                          className="h-7 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleUpdateStatus(ticket.id, "RUNNING")}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant={ticket.status === "COMPLETED" ? "default" : "outline"}
                          className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleUpdateStatus(ticket.id, "COMPLETED")}
                        >
                          Completed
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDeleteTicket(ticket)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Description / Initial Message */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Issue Description
                      </span>
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                        {ticket.description}
                      </div>
                    </div>

                    {/* Messages Thread (if any) */}
                    {ticket.messages && ticket.messages.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Conversation ({ticket.messages.length})
                        </span>
                        <div className="space-y-2">
                          {ticket.messages.map((m) => (
                            <div
                              key={m.id}
                              className={`p-3 rounded-lg text-xs max-w-xl ${
                                m.senderType === "STAFF"
                                  ? "ml-auto bg-emerald-50 text-emerald-900 border border-emerald-200"
                                  : "bg-white text-slate-800 border border-slate-200"
                              }`}
                            >
                              <div className="font-bold mb-1 text-[11px] text-slate-500">
                                {m.senderType === "STAFF" ? "Staff Response" : "Customer Message"}
                              </div>
                              <p className="whitespace-pre-wrap">{m.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
