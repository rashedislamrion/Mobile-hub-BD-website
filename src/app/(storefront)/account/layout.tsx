"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Heart, 
  User, 
  MapPin, 
  LifeBuoy, 
  Lock, 
  FileText, 
  ShieldCheck,
  Menu
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getCustomerToken } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/account", icon: LayoutDashboard },
  { name: "Order History", href: "/account/orders", icon: ShoppingBag },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart },
  { name: "My Profile", href: "/account/profile", icon: User },
  { name: "Manage Address", href: "/account/address", icon: MapPin },
  { name: "Support Ticket", href: "/account/support", icon: LifeBuoy },
  { name: "Change Password", href: "/account/change-password", icon: Lock },
];

const LEGAL_ITEMS = [
  { name: "Terms & Conditions", href: "/terms", icon: FileText },
  { name: "Privacy Policy", href: "/privacy", icon: ShieldCheck },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, customerName, isAuthenticated } = useAuth();
  const displayName = user?.name || customerName || "Customer";

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    const token = getCustomerToken();
    if (!token && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Profile Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 mb-4 border-4 border-slate-50">
          <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt={displayName} />
          <AvatarFallback className="text-xl font-bold">{displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
      </div>

      {/* Main Nav */}
      <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 font-medium transition-colors border-l-4 ${
                isActive 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-primary'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        <hr className="my-4 border-slate-100 mx-6" />

        {LEGAL_ITEMS.map((item) => (
          <Link 
            key={item.name} 
            href={item.href}
            className={`flex items-center gap-3 px-6 py-3 font-medium transition-colors border-l-4 border-transparent text-slate-500 hover:bg-slate-50 hover:text-primary`}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Mobile Nav Trigger */}
      <div className="lg:hidden mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <h1 className="font-bold text-lg text-slate-900">Dashboard Navigation</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Menu className="w-4 h-4" /> Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 border-none bg-transparent shadow-none">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-[280px] shrink-0 sticky top-24">
          <SidebarContent />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
