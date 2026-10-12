"use client";

import { useEffect, useState } from "react";
import { 
  LifeBuoy, Plus, Send, Clock, CheckCircle2, MessageSquare, 
  ChevronRight, ArrowLeft, Loader2, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPost } from "@/lib/api-client";
import { format } from "date-fns";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("OPEN");
  const [tickets, setTickets] = useState<any[]>([]);
  const [issueTypes, setIssueTypes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // Ticket Conversation Modal / View
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const [ticketList, types, myOrders] = await Promise.all([
        apiGet<any[]>("/support-tickets/my").catch(() => []),
        apiGet<any[]>("/ticket-issue-types/active").catch(() => []),
        apiGet<any[]>("/orders/my").catch(() => []),
      ]);
      setTickets(ticketList || []);
      setIssueTypes(types || []);
      setOrders(myOrders || []);
    } catch (e) {
      console.error("Failed to load tickets", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueTypeId || !subject.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost("/support-tickets", {
        issueTypeId: selectedIssueTypeId,
        orderId: selectedOrderId || undefined,
        subject: subject.trim(),
        description: description.trim(),
      });
      toast.success("Support ticket created successfully!");
      setIsDialogOpen(false);
      setSubject("");
      setDescription("");
      setSelectedOrderId("");
      setSelectedIssueTypeId("");
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to create support ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsReplying(true);
    try {
      const newMsg = await apiPost<any>(`/support-tickets/${selectedTicket.id}/messages`, {
        message: replyMessage.trim(),
      });
      toast.success("Reply sent!");
      setReplyMessage("");
      setSelectedTicket((prev: any) => ({
        ...prev,
        messages: [...(prev.messages || []), newMsg],
      }));
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to send message.");
    } finally {
      setIsReplying(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === "OPEN") return t.status === "OPEN" || t.status === "IN_PROGRESS";
    if (activeTab === "RESOLVED") return t.status === "RESOLVED";
    if (activeTab === "CLOSED") return t.status === "CLOSED";
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Tickets</h1>
          <p className="text-xs text-slate-500 mt-0.5">Need help with an order or spare part? Our support team is here.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Issue Type *</Label>
                <Select value={selectedIssueTypeId} onValueChange={setSelectedIssueTypeId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {orders.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Related Order (Optional)</Label>
                  <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.orderCode} (৳{Number(o.totalAmount).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Subject *</Label>
                <Input 
                  required 
                  placeholder="e.g. Display touch not working" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Detailed Description *</Label>
                <Textarea 
                  required 
                  placeholder="Please describe what happened and how we can assist you..." 
                  className="resize-none min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedTicket ? (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to All Tickets
            </Button>
            <Badge className={
              selectedTicket.status === 'OPEN' ? 'bg-blue-500 text-white' :
              selectedTicket.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' :
              selectedTicket.status === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'
            }>
              {selectedTicket.status}
            </Badge>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-bold text-slate-700">{selectedTicket.ticketCode}</span>
              <span>•</span>
              <span>{selectedTicket.issueType?.name}</span>
              <span>•</span>
              <span>{format(new Date(selectedTicket.createdAt), 'MMM dd, yyyy h:mm a')}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedTicket.subject}</h2>
            <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-4 rounded-xl border">
              {selectedTicket.description}
            </p>
          </div>

          {/* Messages Feed */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversation</h3>
            {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {selectedTicket.messages.map((msg: any) => (
                  <div 
                    key={msg.id}
                    className={`p-3.5 rounded-2xl text-sm ${
                      msg.senderType === 'STAFF'
                        ? 'bg-emerald-50 text-slate-800 border border-emerald-100 ml-6'
                        : 'bg-slate-100 text-slate-800 mr-6'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-bold text-slate-700">
                        {msg.senderType === 'STAFF' ? 'Support Agent' : 'You'}
                      </span>
                      <span>{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No replies yet. Our support agent will respond soon.</p>
            )}
          </div>

          {/* Reply Form */}
          {selectedTicket.status !== 'CLOSED' && (
            <form onSubmit={handleSendReply} className="flex gap-2 border-t pt-4">
              <Input 
                placeholder="Type your reply here..." 
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isReplying || !replyMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          )}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2 hide-scrollbar">
            <TabsList className="bg-transparent p-0 h-auto gap-2">
              <TabsTrigger 
                value="OPEN"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600"
              >
                Active ({tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length})
              </TabsTrigger>
              <TabsTrigger 
                value="RESOLVED"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600"
              >
                Resolved ({tickets.filter((t) => t.status === "RESOLVED").length})
              </TabsTrigger>
              <TabsTrigger 
                value="CLOSED"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600"
              >
                Closed ({tickets.filter((t) => t.status === "CLOSED").length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <EmptyState 
                icon={LifeBuoy} 
                title="No Ticket Found" 
                subtitle={`You have no ${activeTab.toLowerCase()} support tickets.`}
              />
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="p-4 bg-white border rounded-2xl hover:border-emerald-500 transition-colors shadow-sm flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800">{t.ticketCode}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {t.issueType?.name || "General"}
                        </Badge>
                        <Badge className={
                          t.status === 'OPEN' ? 'bg-blue-500 text-white text-[10px]' :
                          t.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white text-[10px]' :
                          t.status === 'RESOLVED' ? 'bg-emerald-600 text-white text-[10px]' : 'bg-slate-500 text-white text-[10px]'
                        }>
                          {t.status}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{t.subject}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-xs">{format(new Date(t.createdAt), 'MMM dd')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      )}
    </div>
  );
}
