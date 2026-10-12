"use client";

import React from "react";
import {
  Building2,
  Banknote,
  CreditCard,
  Smartphone,
  Wallet,
  Receipt,
  Coins,
  CircleDollarSign,
  Landmark,
} from "lucide-react";

export const WALLET_PRESET_ICONS = [
  { id: "bank", label: "Bank", icon: Landmark },
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "mobile", label: "Mobile Banking", icon: Smartphone },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "receipt", label: "Receipt", icon: Receipt },
  { id: "coins", label: "Coins", icon: Coins },
  { id: "money-bag", label: "Money Bag", icon: CircleDollarSign },
];

export function getWalletIconComponent(iconName?: string | null, kind?: string, className = "w-5 h-5") {
  if (iconName) {
    const found = WALLET_PRESET_ICONS.find(
      (p) => p.id.toLowerCase() === iconName.toLowerCase() || p.label.toLowerCase() === iconName.toLowerCase()
    );
    if (found) {
      const IconComp = found.icon;
      return <IconComp className={className} />;
    }
  }

  // Fallback by kind
  switch (kind) {
    case "CASH":
      return <Banknote className={className} />;
    case "BANK":
      return <Building2 className={className} />;
    case "MOBILE_BANKING":
      return <Smartphone className={className} />;
    default:
      return <Wallet className={className} />;
  }
}
