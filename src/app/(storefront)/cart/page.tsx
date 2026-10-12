"use client";

import Link from "next/link";
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft, 
  ShieldCheck, Truck, Smartphone 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { getImageUrl } from "@/lib/api-client";

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const freeShippingThreshold = 5000;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center bg-white border rounded-2xl p-8 shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Your Cart is Empty</h1>
          <p className="text-slate-500 text-sm mb-6">
            Looks like you haven't added any products or replacement parts to your cart yet.
          </p>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold" asChild>
            <Link href="/category/all" className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Start Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-1">You have {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-slate-500 hover:text-danger">
          <Trash2 className="w-4 h-4 mr-1.5" /> Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Free Shipping Notification Bar */}
          <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                {remainingForFreeShipping === 0 ? (
                  <span className="text-emerald-600 font-bold">You qualify for FREE Delivery!</span>
                ) : (
                  <span>Add ৳{remainingForFreeShipping.toLocaleString()} more to get <strong className="text-emerald-600">FREE Delivery</strong></span>
                )}
              </span>
              <span className="font-bold text-slate-500">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white border rounded-xl shadow-sm divide-y">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity;
              return (
                <div key={`${item.productId}-${item.variantId}`} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-slate-50 border flex items-center justify-center p-2 flex-shrink-0">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <Smartphone className="w-10 h-10 text-slate-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{item.name}</h3>
                    {(item.color || item.quality) && (
                      <p className="text-xs text-slate-500 mt-1">
                        {[item.color, item.quality].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    <p className="text-sm font-bold text-emerald-600 mt-1 sm:hidden">
                      ৳{item.price.toLocaleString()} × {item.quantity} = ৳{lineTotal.toLocaleString()}
                    </p>
                  </div>

                  {/* Unit Price */}
                  <div className="hidden sm:block text-right pr-4">
                    <p className="text-xs text-slate-400">Unit Price</p>
                    <p className="text-sm font-semibold text-slate-700">৳{item.price.toLocaleString()}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center border rounded-lg h-9">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      className="px-2.5 h-full hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      className="px-2.5 h-full hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="hidden sm:block text-right w-24">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-base font-bold text-slate-900">৳{lineTotal.toLocaleString()}</p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-slate-400 hover:text-danger p-2 rounded-lg hover:bg-danger/5 transition-colors self-end sm:self-center"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" asChild>
              <Link href="/category/all" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Order Summary</h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-800">
                  {subtotal >= freeShippingThreshold ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    "৳60 - ৳120"
                  )}
                </span>
              </div>
            </div>

            <div className="border-t pt-3 flex items-center justify-between">
              <span className="font-bold text-slate-900">Estimated Total</span>
              <span className="font-extrabold text-xl text-emerald-600">৳{subtotal.toLocaleString()}</span>
            </div>

            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-12 text-base text-white shadow-sm" asChild>
              <Link href="/checkout" className="flex items-center justify-center gap-2">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Security & Warranty Card */}
          <div className="bg-slate-50 border rounded-xl p-4 text-xs text-slate-600 space-y-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>100% Genuine Mobile Spares & Tested Parts</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Express Delivery across all 64 districts in Bangladesh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
