"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Edit, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Calendar, 
  Clock, 
  DollarSign, 
  ShoppingBag, 
  RotateCcw, 
  Package, 
  XCircle, 
  Percent, 
  Wallet, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { CustomerAvatar } from "@/components/admin/CustomerAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CustomerDetails {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  photo: string | null;
  profileImageUrl: string | null;
  source: string | null;
  walletBalance: number;
  status: string;
  memberSince: string;
  lastOrder: string | null;
  lastOrderCode: string | null;
  primaryAddress: string | null;
  orderCount: number;
  paymentCount: number;
}

interface CustomerSummary {
  totalSpent: number;
  totalPaid: number;
  unpaidBalance: number;
  advanceMoney: number;
  returnAmount: number;
  totalOrders: number;
  purchasedQty: number;
  returnQty: number;
  cancelledOrders: number;
  discountedOrders: number;
  discountAmount: number;
  returnedOrders: number;
}

interface OrderItem {
  id: string;
  orderCode: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  branchName: string;
  itemCount: number;
  itemsSummary: string;
}

interface PaymentRecord {
  id: string;
  createdAt: string;
  orderId: string | null;
  items: string;
  paymentMethod: string;
  paymentChannel: string;
  amount: number;
  discount: number;
  note: string;
}

interface ActivityRecord {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface AddressRecord {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  fullAddress: string;
  label: string | null;
  tag: string;
  isDefault: boolean;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [summaryRange, setSummaryRange] = useState("lifetime");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "activeOrders" | "purchaseHistory" | "paymentHistory" | "activities" | "addresses"
  >("activeOrders");

  // Tab data states
  const [activeOrders, setActiveOrders] = useState<OrderItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<OrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Payment history tab pagination
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Activities
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Receive Payment Modal
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDiscount, setPayDiscount] = useState("0");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payChannel, setPayChannel] = useState("Cash");
  const [payOrderId, setPayOrderId] = useState("");
  const [payNote, setPayNote] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Address Modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressFullName, setAddressFullName] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [addressEmail, setAddressEmail] = useState("");
  const [addressFull, setAddressFull] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  const [addressTag, setAddressTag] = useState("HOME");
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Load customer profile
  const fetchCustomer = useCallback(async () => {
    try {
      const data = await apiGet<CustomerDetails>(`/customers/${customerId}`);
      setCustomer(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load customer details.");
    }
  }, [customerId]);

  // Load summary statistics
  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const query = new URLSearchParams({ range: summaryRange });
      if (summaryRange === "custom") {
        if (customFrom) query.append("from", customFrom);
        if (customTo) query.append("to", customTo);
      }
      const data = await apiGet<CustomerSummary>(`/customers/${customerId}/summary?${query.toString()}`);
      setSummary(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load customer summary.");
    } finally {
      setIsLoadingSummary(false);
    }
  }, [customerId, summaryRange, customFrom, customTo]);

  // Load orders (active or history)
  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const [act, hist] = await Promise.all([
        apiGet<OrderItem[]>(`/customers/${customerId}/orders?status=active`),
        apiGet<OrderItem[]>(`/customers/${customerId}/orders?status=history`),
      ]);
      setActiveOrders(act || []);
      setPurchaseHistory(hist || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load customer orders.");
    } finally {
      setIsLoadingOrders(false);
    }
  }, [customerId]);

  // Load payments
  const fetchPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      const res = await apiGet<{
        data: PaymentRecord[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/customers/${customerId}/payments?page=${paymentsPage}&limit=10`);
      setPayments(res.data || []);
      setPaymentsTotal(res.total || 0);
      setPaymentsTotalPages(res.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments.");
    } finally {
      setIsLoadingPayments(false);
    }
  }, [customerId, paymentsPage]);

  // Load activities
  const fetchActivities = useCallback(async () => {
    setIsLoadingActivities(true);
    try {
      const res = await apiGet<{ data: ActivityRecord[] }>(`/customers/${customerId}/activities?page=1&limit=50`);
      setActivities(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load activities.");
    } finally {
      setIsLoadingActivities(false);
    }
  }, [customerId]);

  // Load addresses
  const fetchAddresses = useCallback(async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await apiGet<AddressRecord[]>(`/customers/${customerId}/addresses`);
      setAddresses(res || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load addresses.");
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
      fetchSummary();
      fetchOrders();
      fetchPayments();
      fetchActivities();
      fetchAddresses();
    }
  }, [customerId, fetchCustomer, fetchSummary, fetchOrders, fetchPayments, fetchActivities, fetchAddresses]);

  // Handle Receive Payment submission
  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(payAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than 0.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await apiPost(`/customers/${customerId}/payments`, {
        amount: numericAmount,
        discount: parseFloat(payDiscount) || 0,
        paymentMethod: payMethod,
        paymentChannel: payChannel || payMethod,
        orderId: payOrderId || undefined,
        note: payNote.trim() || undefined,
      });

      toast.success(`Payment of ৳${numericAmount.toLocaleString()} recorded successfully!`);
      setIsReceivePaymentOpen(false);
      setPayAmount("");
      setPayDiscount("0");
      setPayOrderId("");
      setPayNote("");

      // Refresh all related views
      fetchCustomer();
      fetchSummary();
      fetchOrders();
      fetchPayments();
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Open address modal for add or edit
  const handleOpenAddressModal = (addr?: AddressRecord) => {
    if (addr) {
      setEditingAddressId(addr.id);
      setAddressFullName(addr.fullName);
      setAddressPhone(addr.phone);
      setAddressEmail(addr.email || "");
      setAddressFull(addr.fullAddress);
      setAddressLabel(addr.label || "");
      setAddressTag(addr.tag || "HOME");
      setAddressIsDefault(addr.isDefault);
    } else {
      setEditingAddressId(null);
      setAddressFullName(customer?.name || "");
      setAddressPhone(customer?.phone || "");
      setAddressEmail(customer?.email || "");
      setAddressFull("");
      setAddressLabel("");
      setAddressTag("HOME");
      setAddressIsDefault(addresses.length === 0);
    }
    setIsAddressModalOpen(true);
  };

  // Save address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressFullName.trim() || !addressPhone.trim() || !addressFull.trim()) {
      toast.error("Please fill in all required address fields.");
      return;
    }

    setIsSavingAddress(true);
    try {
      const payload = {
        fullName: addressFullName.trim(),
        phone: addressPhone.trim(),
        email: addressEmail.trim() || undefined,
        fullAddress: addressFull.trim(),
        label: addressLabel.trim() || undefined,
        tag: addressTag as any,
        isDefault: addressIsDefault,
      };

      if (editingAddressId) {
        await apiPatch(`/customers/${customerId}/addresses/${editingAddressId}`, payload);
        toast.success("Shipping address updated successfully.");
      } else {
        await apiPost(`/customers/${customerId}/addresses`, payload);
        toast.success("New shipping address added successfully.");
      }

      setIsAddressModalOpen(false);
      fetchAddresses();
      fetchCustomer();
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || "Failed to save address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this shipping address?")) return;
    try {
      await apiDelete(`/customers/${customerId}/addresses/${addressId}`);
      toast.success("Address deleted successfully.");
      fetchAddresses();
      fetchCustomer();
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address.");
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await apiPatch(`/customers/${customerId}/addresses/${addressId}`, { isDefault: true });
      toast.success("Default shipping address updated.");
      fetchAddresses();
      fetchCustomer();
    } catch (err: any) {
      toast.error(err.message || "Failed to update default address.");
    }
  };

  // Helper date formatter
  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  const formatDateTime = (isoStr?: string | null) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      return (
        d.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return isoStr;
    }
  };

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500 font-medium">Loading customer profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/customers")}
            className="border-slate-200 text-slate-600 hover:text-slate-900 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            All Customers
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
        </div>

        {/* Action Buttons: Receive Payment & Edit Customer */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            onClick={() => setIsReceivePaymentOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm font-medium"
          >
            <CreditCard className="w-4 h-4" />
            Receive Payment
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/customers/${customer.id}/edit`)}
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-1.5 font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit Customer
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Card (Customer Details) + Right Area (Summary 12 Stat Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Card — "CUSTOMER DETAILS" */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5 h-fit">
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
            <CustomerAvatar
              photo={customer.profileImageUrl || customer.photo}
              name={customer.name}
              size="lg"
              className="mb-3"
            />
            <h2 className="text-lg font-bold text-slate-900">{customer.name}</h2>
            {customer.source && (
              <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-700 text-xs">
                {customer.source}
              </Badge>
            )}
          </div>

          <div className="space-y-3.5 text-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              CUSTOMER DETAILS
            </h3>

            {/* Phone */}
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Phone</span>
                <span className="font-semibold text-slate-800 font-mono">{customer.phone}</span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Email</span>
                <span className="text-slate-800 break-all">
                  {customer.email || <span className="text-slate-400">N/A</span>}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Primary Address</span>
                <span className="text-slate-800 text-xs leading-relaxed">
                  {customer.primaryAddress || <span className="text-slate-400">N/A</span>}
                </span>
              </div>
            </div>

            {/* Source */}
            <div className="flex items-start gap-2.5">
              <Tag className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Source</span>
                <span className="text-slate-800">{customer.source || "N/A"}</span>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Member Since</span>
                <span className="text-slate-800">{formatDate(customer.memberSince)}</span>
              </div>
            </div>

            {/* Last Order */}
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Last Order</span>
                <span className="text-slate-800">
                  {customer.lastOrder ? (
                    <span>
                      {formatDate(customer.lastOrder)}{" "}
                      {customer.lastOrderCode && (
                        <span className="text-emerald-600 font-mono text-xs">
                          (#{customer.lastOrderCode})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Area — "Summary" (3 cols span) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary Header & Range Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Summary</h2>
              {isLoadingSummary && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={summaryRange}
                onChange={(e) => setSummaryRange(e.target.value)}
                className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="lifetime">Lifetime</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {summaryRange === "custom" && (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-9 text-xs w-32 bg-slate-50"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-9 text-xs w-32 bg-slate-50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 12 Stat Cards Grid (3 cols x 4 rows) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {/* 1. TOTAL SPENT */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  TOTAL SPENT
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ৳{(summary?.totalSpent || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* 2. TOTAL PAID */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  TOTAL PAID
                </span>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  ৳{(summary?.totalPaid || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* 3. UNPAID BALANCE */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  UNPAID BALANCE
                </span>
                <p
                  className={`text-xl font-bold mt-1 ${
                    (summary?.unpaidBalance || 0) > 0 ? "text-rose-600" : "text-slate-800"
                  }`}
                >
                  ৳{(summary?.unpaidBalance || 0).toLocaleString()}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  (summary?.unpaidBalance || 0) > 0
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            {/* 4. ADVANCE MONEY */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  ADVANCE MONEY
                </span>
                <p className="text-xl font-bold text-sky-600 mt-1">
                  ৳{(summary?.advanceMoney || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            {/* 5. RETURN AMOUNT */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  RETURN AMOUNT
                </span>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  ৳{(summary?.returnAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
            </div>

            {/* 6. TOTAL ORDERS */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  TOTAL ORDERS
                </span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {summary?.totalOrders || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            {/* 7. PURCHASED QTY */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  PURCHASED QTY
                </span>
                <p className="text-xl font-bold text-indigo-600 mt-1">
                  {summary?.purchasedQty || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* 8. RETURN QTY */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  RETURN QTY
                </span>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {summary?.returnQty || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
            </div>

            {/* 9. CANCELLED ORDERS */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  CANCELLED ORDERS
                </span>
                <p className="text-xl font-bold text-rose-600 mt-1">
                  {summary?.cancelledOrders || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

            {/* 10. DISCOUNTED ORDERS */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  DISCOUNTED ORDERS
                </span>
                <p className="text-xl font-bold text-purple-600 mt-1">
                  {summary?.discountedOrders || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>

            {/* 11. DISCOUNT AMOUNT */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  DISCOUNT AMOUNT
                </span>
                <p className="text-xl font-bold text-purple-600 mt-1">
                  ৳{(summary?.discountAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>

            {/* 12. RETURNED ORDERS */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  RETURNED ORDERS
                </span>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {summary?.returnedOrders || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Tabs Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 px-4 bg-slate-50/70 overflow-x-auto">
          <button
            onClick={() => setActiveTab("activeOrders")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "activeOrders"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("purchaseHistory")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "purchaseHistory"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Purchase History ({purchaseHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("paymentHistory")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "paymentHistory"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Payment History ({paymentsTotal})
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "activities"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Activities ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab("addresses")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "addresses"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Shipping Addresses ({addresses.length})
          </button>
        </div>

        {/* Tab 1: Active Orders */}
        {activeTab === "activeOrders" && (
          <div className="p-4">
            {isLoadingOrders ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm font-medium">No active orders in progress for this customer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-4">ORDER ID</th>
                      <th className="py-3 px-4">DATE</th>
                      <th className="py-3 px-4">ITEMS</th>
                      <th className="py-3 px-4">TOTAL</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          #{o.orderCode}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatDateTime(o.createdAt)}</td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={o.itemsSummary}>
                          {o.itemsSummary}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ৳{o.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {o.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link href={`/admin/orders/${o.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-600">
                              <ExternalLink className="w-3.5 h-3.5" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Purchase History */}
        {activeTab === "purchaseHistory" && (
          <div className="p-4">
            {isLoadingOrders ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : purchaseHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm font-medium">No purchase history recorded for this customer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-4">ORDER ID</th>
                      <th className="py-3 px-4">DATE</th>
                      <th className="py-3 px-4">ITEMS</th>
                      <th className="py-3 px-4">TOTAL</th>
                      <th className="py-3 px-4">PAID</th>
                      <th className="py-3 px-4">DUE</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseHistory.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          #{o.orderCode}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatDateTime(o.createdAt)}</td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={o.itemsSummary}>
                          {o.itemsSummary}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ৳{o.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-emerald-600">
                          ৳{o.paidAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-rose-600">
                          ৳{o.dueAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              o.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : o.status === "CANCELLED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {o.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link href={`/admin/orders/${o.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-600">
                              <ExternalLink className="w-3.5 h-3.5" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payment History */}
        {activeTab === "paymentHistory" && (
          <div className="p-4 space-y-4">
            {isLoadingPayments ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm font-medium">No payment records found for this customer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-4">DATE & TIME</th>
                      <th className="py-3 px-4">ORDER ID</th>
                      <th className="py-3 px-4">ITEMS</th>
                      <th className="py-3 px-4">WALLET DETAILS</th>
                      <th className="py-3 px-4">PAID AMOUNT</th>
                      <th className="py-3 px-4">DISCOUNT</th>
                      <th className="py-3 px-4">NOTE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        {/* DATE & TIME */}
                        <td className="py-3 px-4 text-slate-600 text-xs font-mono">
                          {formatDateTime(p.createdAt)}
                        </td>

                        {/* ORDER ID */}
                        <td className="py-3 px-4">
                          {p.orderId ? (
                            <span className="font-mono font-bold text-emerald-600">
                              #{p.orderId}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* ITEMS */}
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={p.items}>
                          {p.items}
                        </td>

                        {/* WALLET DETAILS (Method + Channel stacked) */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-xs">
                              {p.paymentMethod}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {p.paymentChannel || p.paymentMethod}
                            </span>
                          </div>
                        </td>

                        {/* PAID AMOUNT (green) */}
                        <td className="py-3 px-4 font-bold text-emerald-600">
                          ৳{p.amount.toLocaleString()}
                        </td>

                        {/* DISCOUNT (purple) */}
                        <td className="py-3 px-4 text-purple-600 font-medium">
                          {p.discount > 0 ? `৳${p.discount.toLocaleString()}` : "—"}
                        </td>

                        {/* NOTE */}
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {p.note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination for Payments */}
            {paymentsTotal > 10 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {(paymentsPage - 1) * 10 + 1} to{" "}
                  {Math.min(paymentsPage * 10, paymentsTotal)} of {paymentsTotal} payments
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paymentsPage <= 1}
                    onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paymentsPage >= paymentsTotalPages}
                    onClick={() => setPaymentsPage((p) => Math.min(paymentsTotalPages, p + 1))}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Activities */}
        {activeTab === "activities" && (
          <div className="p-6">
            {isLoadingActivities ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm font-medium">No recorded activities yet.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                {activities.map((act) => (
                  <div key={act.id} className="relative pl-6">
                    {/* Circle dot */}
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-500" />
                    <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800 text-sm">
                          {act.description}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {act.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400 font-mono mt-1 block">
                        {formatDateTime(act.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Shipping Addresses */}
        {activeTab === "addresses" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Customer Shipping Addresses</h3>
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenAddressModal()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Address
              </Button>
            </div>

            {isLoadingAddresses ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm font-medium">No shipping addresses saved for this customer.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`rounded-xl border p-4 transition-all relative ${
                      addr.isDefault
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {addr.tag || "HOME"}
                        </Badge>
                        {addr.isDefault && (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAddressModal(addr)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {addr.fullAddress}
                    </p>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span className="font-mono">{addr.phone}</span>
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-emerald-600 hover:underline text-xs font-medium"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Receive Payment Modal */}
      <Dialog open={isReceivePaymentOpen} onOpenChange={setIsReceivePaymentOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleReceivePaymentSubmit}>
            <DialogHeader>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <CreditCard className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Receive Customer Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Record a payment for customer <strong>{customer.name}</strong>. This updates order balances and records an audit activity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Payment Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="payAmount" className="text-xs font-semibold text-slate-700">
                  Payment Amount (৳) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="payAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="bg-slate-50 text-base font-bold text-emerald-700"
                  required
                />
              </div>

              {/* Discount Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="payDiscount" className="text-xs font-medium text-slate-600">
                  Discount (৳) <span className="text-slate-400">(Optional)</span>
                </Label>
                <Input
                  id="payDiscount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={payDiscount}
                  onChange={(e) => setPayDiscount(e.target.value)}
                  className="bg-slate-50 text-sm"
                />
              </div>

              {/* Payment Method & Channel */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="payMethod" className="text-xs font-semibold text-slate-700">
                    Payment Method <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="payMethod"
                    value={payMethod}
                    onChange={(e) => {
                      setPayMethod(e.target.value);
                      if (!payChannel || payChannel === payMethod) setPayChannel(e.target.value);
                    }}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bkash">Bkash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Card">Credit/Debit Card</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payChannel" className="text-xs font-semibold text-slate-700">
                    Payment Channel
                  </Label>
                  <Input
                    id="payChannel"
                    type="text"
                    placeholder="e.g. Agent / Merchant"
                    value={payChannel}
                    onChange={(e) => setPayChannel(e.target.value)}
                    className="bg-slate-50 text-sm"
                  />
                </div>
              </div>

              {/* Optional Link to Unpaid Order */}
              {activeOrders.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="payOrderId" className="text-xs font-semibold text-slate-700">
                    Link to Active Order (Optional)
                  </Label>
                  <select
                    id="payOrderId"
                    value={payOrderId}
                    onChange={(e) => setPayOrderId(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">None (Advance Money / Wallet Deposit)</option>
                    {activeOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.orderCode} — Total: ৳{o.totalAmount.toLocaleString()} (Due: ৳{o.dueAmount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Note */}
              <div className="space-y-1.5">
                <Label htmlFor="payNote" className="text-xs font-medium text-slate-600">
                  Transaction Note (Optional)
                </Label>
                <Input
                  id="payNote"
                  type="text"
                  placeholder="e.g. Counter deposit, TxID: 9X82..."
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="bg-slate-50 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReceivePaymentOpen(false)}
                disabled={isSubmittingPayment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {isSubmittingPayment ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Address Modal */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSaveAddress}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {editingAddressId ? "Edit Shipping Address" : "Add New Shipping Address"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Saved shipping address for customer {customer.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Recipient Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={addressFullName}
                    onChange={(e) => setAddressFullName(e.target.value)}
                    required
                    className="bg-slate-50 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Contact Phone <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={addressPhone}
                    onChange={(e) => setAddressPhone(e.target.value)}
                    required
                    className="bg-slate-50 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Full Address <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={addressFull}
                  onChange={(e) => setAddressFull(e.target.value)}
                  placeholder="House #, Street, Thana, City"
                  required
                  className="bg-slate-50 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Address Tag</Label>
                  <select
                    value={addressTag}
                    onChange={(e) => setAddressTag(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md"
                  >
                    <option value="HOME">Home</option>
                    <option value="OFFICE">Office</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Custom Label</Label>
                  <Input
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    placeholder="e.g. Warehouse, Parents"
                    className="bg-slate-50 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="addrDefault"
                  checked={addressIsDefault}
                  onChange={(e) => setAddressIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <Label htmlFor="addrDefault" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Set as default shipping address
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(false)}
                disabled={isSavingAddress}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingAddress}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {isSavingAddress ? "Saving..." : "Save Address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
