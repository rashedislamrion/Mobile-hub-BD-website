"use client";

import { useEffect, useState } from "react";
import { OFFICIAL_CONTACT } from "@/config/contact";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, Truck, CreditCard, Tag, ArrowRight, Loader2, 
  MapPin, CheckCircle2, AlertCircle, ShoppingBag, Plus 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiGet, apiPost, getImageUrl } from "@/lib/api-client";

interface PaymentGatewayPublic {
  gateway: string;
  isActive: boolean;
  title: string;
  logoUrl?: string | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items, itemCount, subtotal, clearCart } = useCart();

  // Shipping & Contact
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Guest Contact Form
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [guestCity, setGuestCity] = useState("Dhaka");
  const [orderNotes, setOrderNotes] = useState("");

  // Delivery & Payment
  const [deliveryType, setDeliveryType] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayPublic[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("COD");

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill user contact info if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !guestName) setGuestName(user.name);
      if (user.phone && !guestPhone) setGuestPhone(user.phone);
      if (user.email && !guestEmail) setGuestEmail(user.email);
    }
  }, [user]);

  // Load Saved Addresses for logged-in user and active payment gateways
  useEffect(() => {
    (async () => {
      try {
        const gateways = await apiGet<PaymentGatewayPublic[]>("/payment-gateways/public");
        setPaymentGateways(gateways || []);
        if (gateways && gateways.length > 0) {
          setSelectedPaymentMethod(gateways[0].gateway);
        }
      } catch (e) {
        console.error("Failed to load payment gateways", e);
      }

      if (isAuthenticated) {
        try {
          const profile = await apiGet<any>("/customers/me/profile");
          if (profile?.addresses && profile.addresses.length > 0) {
            setAddresses(profile.addresses);
            const defaultAddr = profile.addresses.find((a: any) => a.isDefault) || profile.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            if (defaultAddr.address) setGuestAddress(defaultAddr.address);
            if (defaultAddr.city) setGuestCity(defaultAddr.city);
          } else {
            setIsAddingNewAddress(true);
          }
        } catch (e) {
          console.error("Failed to load user profile", e);
        }
      }
    })();
  }, [isAuthenticated]);

  // Pricing math
  const deliveryCharge = subtotal >= 5000 ? 0 : (deliveryType === "EXPRESS" ? 120 : 60);
  const discountAmount = appliedPromo?.discountAmount || 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsValidatingPromo(true);
    try {
      const res = await apiPost<any>("/promo-codes/validate", {
        code: promoCodeInput.trim(),
        orderSubtotal: subtotal,
        orderAmount: subtotal,
        productIds: items.map((i) => i.productId).filter(Boolean),
      });
      setAppliedPromo(res);
      toast.success(`Promo code "${res.code}" applied! You saved ৳${res.discountAmount.toLocaleString()}`);
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired promo code");
      setAppliedPromo(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    toast.info("Promo code removed");
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (isAuthenticated) {
      if (!selectedAddressId && !isAddingNewAddress) {
        toast.error("Please select or add a shipping address.");
        return;
      }
      if (isAddingNewAddress) {
        if (!guestAddress.trim()) {
          toast.error("Please enter your full delivery address.");
          return;
        }
      }
    } else {
      if (!guestName.trim() || !guestPhone.trim() || !guestAddress.trim()) {
        toast.error("Please fill in your name, phone number, and delivery address.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId === "default" ? undefined : i.variantId,
          quantity: i.quantity,
        })),
        deliveryType,
        paymentMethod: selectedPaymentMethod,
        orderNotes: orderNotes.trim() || undefined,
        promoCode: appliedPromo?.code || undefined,
      };

      if (isAuthenticated && selectedAddressId && !isAddingNewAddress) {
        payload.shippingAddressId = selectedAddressId;
      } else {
        payload.guestInfo = {
          name: isAuthenticated ? (user?.name || guestName) : guestName.trim(),
          phone: guestPhone.trim() || (user as any)?.phone || OFFICIAL_CONTACT.phone.display,
          email: guestEmail.trim() || (user?.email || undefined),
          address: guestAddress.trim(),
          city: guestCity || "Dhaka",
        };
      }

      const checkoutRes = await apiPost<any>("/orders/checkout", payload);

      const orderId = checkoutRes.orderId;
      clearCart();

      if (selectedPaymentMethod === "COD") {
        toast.success("Order placed successfully with Cash on Delivery!");
        router.push(`/order/confirmation/${orderId}`);
      } else if (selectedPaymentMethod === "BKASH") {
        toast.loading("Initiating bKash payment...");
        try {
          const bkashRes = await apiPost<any>("/payments/bkash/initiate", { orderId });
          if (bkashRes.bkashURL) {
            window.location.href = bkashRes.bkashURL;
          } else {
            router.push(`/order/confirmation/${orderId}`);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to initiate bKash payment");
          router.push(`/order/payment-failed?orderId=${orderId}&reason=bKashInitFailed`);
        }
      } else if (selectedPaymentMethod === "SSLCOMMERZ") {
        toast.loading("Redirecting to SSLCommerz Secure Gateway...");
        try {
          const sslRes = await apiPost<any>("/payments/sslcommerz/initiate", { orderId });
          if (sslRes.GatewayPageURL) {
            window.location.href = sslRes.GatewayPageURL;
          } else {
            router.push(`/order/confirmation/${orderId}`);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to initiate SSLCommerz payment");
          router.push(`/order/payment-failed?orderId=${orderId}&reason=SSLCommerzInitFailed`);
        }
      } else {
        router.push(`/order/confirmation/${orderId}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto bg-white border rounded-2xl p-8 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2>
          <p className="text-slate-500 text-sm mb-6">Add parts or smartphones to proceed with checkout.</p>
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Link href="/category/all">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-sm text-slate-500 mt-1">Complete your order with secure delivery & payment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Step 1: Customer Information & Address */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h2 className="text-lg font-bold text-slate-900">Delivery Address</h2>
              </div>
              {!isAuthenticated && (
                <Link href="/login?redirect=/checkout" className="text-xs font-semibold text-emerald-600 hover:underline">
                  Already have an account? Login
                </Link>
              )}
            </div>

            {isAuthenticated && addresses.length > 0 && !isAddingNewAddress ? (
              <div className="space-y-3">
                <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                        selectedAddressId === addr.id ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{addr.fullName}</span>
                          <Badge variant="outline" className="text-[10px] uppercase">{addr.tag}</Badge>
                          {addr.isDefault && <Badge className="bg-emerald-600 text-white text-[10px]">Default</Badge>}
                        </div>
                        <p className="text-slate-600 mt-1">{addr.fullAddress}</p>
                        <p className="text-slate-500 text-xs mt-0.5">Phone: {addr.phone}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAddingNewAddress(true)}
                  className="w-full text-xs font-semibold text-slate-700"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Deliver to another address
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {isAuthenticated && isAddingNewAddress && addresses.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsAddingNewAddress(false)}
                    className="text-xs text-emerald-600 mb-2"
                  >
                    ← Select from saved addresses
                  </Button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Full Name *</Label>
                    <Input 
                      placeholder="e.g. Tanvir Ahmed" 
                      value={guestName} 
                      onChange={(e) => setGuestName(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Phone Number *</Label>
                    <Input 
                      placeholder="017XXXXXXXX" 
                      value={guestPhone} 
                      onChange={(e) => setGuestPhone(e.target.value)} 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Email Address (Optional)</Label>
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={guestEmail} 
                    onChange={(e) => setGuestEmail(e.target.value)} 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Detailed Delivery Address *</Label>
                  <Textarea 
                    placeholder="House, Road, Area, Thana, District (e.g. House 12, Road 4, Dhanmondi, Dhaka)" 
                    value={guestAddress} 
                    onChange={(e) => setGuestAddress(e.target.value)} 
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">City / District</Label>
                  <Input 
                    value={guestCity} 
                    onChange={(e) => setGuestCity(e.target.value)} 
                    placeholder="Dhaka"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Delivery Option */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h2 className="text-lg font-bold text-slate-900">Delivery Method</h2>
            </div>

            <RadioGroup value={deliveryType} onValueChange={(val: any) => setDeliveryType(val)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  deliveryType === "STANDARD" ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200"
                }`}
                onClick={() => setDeliveryType("STANDARD")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="STANDARD" id="del-standard" />
                    <Label htmlFor="del-standard" className="font-bold text-slate-800 cursor-pointer">Regular Delivery</Label>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {subtotal >= 5000 ? "FREE" : "৳60"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 pl-6">Estimated delivery 2-4 business days</p>
              </div>

              <div
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  deliveryType === "EXPRESS" ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200"
                }`}
                onClick={() => setDeliveryType("EXPRESS")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="EXPRESS" id="del-express" />
                    <Label htmlFor="del-express" className="font-bold text-slate-800 cursor-pointer">Express 24h</Label>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {subtotal >= 5000 ? "FREE" : "৳120"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 pl-6">Priority handling with same/next-day courier</p>
              </div>
            </RadioGroup>
          </div>

          {/* Step 3: Payment Method */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h2 className="text-lg font-bold text-slate-900">Payment Gateway</h2>
            </div>

            <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="space-y-3">
              {paymentGateways.length > 0 ? (
                paymentGateways.map((gw) => (
                  <div
                    key={gw.gateway}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                      selectedPaymentMethod === gw.gateway ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => setSelectedPaymentMethod(gw.gateway)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={gw.gateway} id={`gw-${gw.gateway}`} />
                      <div>
                        <Label htmlFor={`gw-${gw.gateway}`} className="font-bold text-slate-800 cursor-pointer text-sm">
                          {gw.title}
                        </Label>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {gw.gateway === "COD" && "Pay cash upon parcel delivery at your doorstep"}
                          {gw.gateway === "BKASH" && "Pay instantly using your bKash digital wallet"}
                          {gw.gateway === "SSLCOMMERZ" && "Cards (Visa, Master, Amex), Mobile Wallets & Internet Banking"}
                        </p>
                      </div>
                    </div>
                    {gw.logoUrl ? (
                      <img src={getImageUrl(gw.logoUrl)} alt={gw.title} className="h-6 object-contain" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                ))
              ) : (
                <div
                  className="flex items-center justify-between p-4 rounded-xl border border-emerald-500 bg-emerald-50/40"
                  onClick={() => setSelectedPaymentMethod("COD")}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="COD" id="gw-cod" />
                    <div>
                      <Label htmlFor="gw-cod" className="font-bold text-slate-800 cursor-pointer text-sm">
                        Cash on Delivery (COD)
                      </Label>
                      <p className="text-xs text-slate-500 mt-0.5">Pay in cash when parcel arrives at your door</p>
                    </div>
                  </div>
                </div>
              )}
            </RadioGroup>

            <div className="pt-2">
              <Label className="text-xs font-semibold text-slate-600">Order Notes / Instructions (Optional)</Label>
              <Input 
                placeholder="e.g. Please call before delivery, deliver in the evening" 
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">
              Order Review ({itemCount} {itemCount === 1 ? "item" : "items"})
            </h2>

            {/* Item Mini List */}
            <div className="space-y-3 max-h-64 overflow-y-auto divide-y pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 border flex items-center justify-center p-1 flex-shrink-0">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      Qty: {item.quantity} × ৳{item.price.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            <div className="border-t pt-4">
              <Label className="text-xs font-bold text-slate-700 block mb-1.5">Have a Promo Code?</Label>
              {appliedPromo ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">{appliedPromo.code}</span>
                    <span className="text-xs text-emerald-600 font-semibold">(-৳{discountAmount.toLocaleString()})</span>
                  </div>
                  <button 
                    onClick={handleRemovePromo}
                    className="text-xs font-semibold text-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter promo code" 
                    value={promoCodeInput} 
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="text-xs font-semibold uppercase"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleApplyPromo}
                    disabled={isValidatingPromo || !promoCodeInput.trim()}
                    className="text-xs font-bold border-slate-300"
                  >
                    {isValidatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">৳{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span>Promo Discount</span>
                  <span>-৳{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-800">
                  {deliveryCharge === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `৳${deliveryCharge}`}
                </span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between text-base">
                <span className="font-bold text-slate-900">Total Payable</span>
                <span className="font-extrabold text-2xl text-emerald-600">৳{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <Button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-xl shadow-md transition-transform active:scale-[0.99]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing Order...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Place Order • ৳{totalAmount.toLocaleString()} <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>

            <div className="space-y-2 pt-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Encrypted checkout & 100% genuine product replacement warranty.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
