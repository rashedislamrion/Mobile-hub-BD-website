"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Search, Heart, ShoppingCart, ChevronDown, Menu, LayoutGrid, 
  Monitor, Battery, Zap, Volume2, Smartphone, Camera, Shield, CreditCard, 
  Disc, PenTool, Headphones, BatteryCharging, LogOut, Trash2, Plus, Minus, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiGet, getImageUrl } from "@/lib/api-client";

const categoryIconMap: Record<string, JSX.Element> = {
  'Display': <Monitor className="w-6 h-6" />,
  'Battery': <Battery className="w-6 h-6" />,
  'Charging Port': <Zap className="w-6 h-6" />,
  'Speaker': <Volume2 className="w-6 h-6" />,
  'Housing': <Smartphone className="w-6 h-6" />,
  'Camera Lens': <Camera className="w-6 h-6" />,
  'Camera Glass': <Shield className="w-6 h-6" />,
  'Motherboard': <CreditCard className="w-6 h-6" />,
  'Back Glass': <Disc className="w-6 h-6" />,
  'OCA': <PenTool className="w-6 h-6" />,
  'AirPods': <Headphones className="w-6 h-6" />,
  'Power Bank': <BatteryCharging className="w-6 h-6" />,
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [headerMenus, setHeaderMenus] = useState<any[]>([]);
  const { user, isAuthenticated, logout } = useAuth();
  const { items, itemCount, subtotal, isCartOpen, setIsCartOpen, toggleCart, updateQuantity, removeItem } = useCart();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [tree, menus] = await Promise.all([
          apiGet<any[]>("/categories/tree").catch(() => []),
          apiGet<any[]>("/menus?type=HEADER").catch(() => []),
        ]);
        setCategories(tree || []);
        setHeaderMenus(menus || []);
      } catch (e) {
        console.error("Failed to load header data", e);
      }
    })();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      {/* Top Row */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-4 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="p-4 border-b text-left">
                <SheetTitle>
                  <Image src="/images/logo-full.jpeg" alt="MobileHubBD" width={200} height={40} className="w-auto h-8" />
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 flex flex-col gap-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="categories">
                    <AccordionTrigger className="text-base font-semibold">Categories</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2 pl-2">
                        {categories.map((cat) => (
                          <Link key={cat.id} href={`/category/${cat.slug}`} className="text-sm py-2 text-slate-600 hover:text-primary flex items-center gap-3">
                            <span className="text-slate-400">{categoryIconMap[cat.name] || <LayoutGrid className="w-4 h-4"/>}</span>
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div className="flex flex-col gap-3 mt-2 text-sm font-semibold text-slate-700">
                  <Link
                    href="/category/all"
                    className={`py-1 transition-colors ${pathname === "/category/all" ? "text-emerald-600 font-bold" : "hover:text-primary text-slate-700"}`}
                  >
                    All Products
                  </Link>
                  <Link
                    href="/phones"
                    className={`py-1 flex items-center gap-2 transition-colors ${pathname === "/phones" || pathname.startsWith("/phones/") ? "text-emerald-600 font-bold" : "hover:text-primary text-slate-700"}`}
                  >
                    <Smartphone className="w-4 h-4" /> Phones
                  </Link>
                  {headerMenus.map((m) => {
                    const isActive = pathname === m.linkValue;
                    return (
                      <Link
                        key={m.id}
                        href={m.linkValue}
                        className={`py-1 transition-colors ${isActive ? "text-emerald-600 font-bold" : "hover:text-primary text-slate-700"}`}
                      >
                        {m.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/blog"
                    className={`py-1 transition-colors ${pathname === "/blog" || pathname.startsWith("/blog/") ? "text-emerald-600 font-bold" : "hover:text-primary text-slate-700"}`}
                  >
                    Blogs
                  </Link>
                  <Link
                    href="/contact"
                    className={`py-1 transition-colors ${pathname === "/contact" ? "text-emerald-600 font-bold" : "hover:text-primary text-slate-700"}`}
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center">
            <Image src="/images/logo-full.jpeg" alt="MobileHubBD" width={200} height={40} className="w-auto h-8 sm:h-10" />
          </Link>
        </div>

        {/* Desktop Logo */}
        <div className="hidden lg:flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/images/logo-full.jpeg" alt="MobileHubBD" width={240} height={48} className="w-auto h-12" />
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-xl relative mx-8">
          <Input 
            type="search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product, model, brand..." 
            className="w-full pl-4 pr-12 rounded-full border-slate-300 focus-visible:ring-primary h-11"
          />
          <Button type="submit" size="icon" className="absolute right-1 top-1 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-white">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/account/wishlist" className="relative text-slate-600 hover:text-primary hidden sm:block">
            <Heart className="w-6 h-6" />
          </Link>
          
          {/* Cart Icon & Trigger */}
          <button onClick={toggleCart} className="relative text-slate-600 hover:text-primary p-1 focus:outline-none" title="View Cart">
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-2 w-5 h-5 flex items-center justify-center p-0 bg-emerald-600 text-white rounded-full text-[11px] font-bold border-2 border-white">
                {itemCount}
              </Badge>
            )}
          </button>

          <div className="hidden lg:block h-8 w-px bg-slate-200 mx-2"></div>

          <div className="hidden lg:flex items-center">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 py-1 hover:bg-slate-50 rounded-full h-10">
                    <Avatar className="w-8 h-8">
                      {user.avatar ? (
                        <AvatarImage src={getImageUrl(user.avatar)} alt={user.name} />
                      ) : (
                        <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-semibold leading-none text-slate-700">{user.name}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">My Account <ChevronDown className="w-3 h-3"/></span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuItem asChild><Link href="/account" className="cursor-pointer">Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/account/orders" className="cursor-pointer">Order History</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/account/profile" className="cursor-pointer">My Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/account/support" className="cursor-pointer">Support Tickets</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-danger focus:text-danger focus:bg-danger/10 cursor-pointer"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3 text-sm font-medium">
                <Link href="/login" className="text-slate-600 hover:text-primary transition-colors">Login</Link>
                <span className="text-slate-300">|</span>
                <Link href="/register" className="text-slate-600 hover:text-primary transition-colors">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row - Desktop Nav */}
      <div className="hidden lg:block border-t bg-white">
        <div className="container mx-auto px-4 h-12 flex items-center gap-8 relative">
          
          <div 
            className="h-full flex items-center"
            onMouseEnter={() => setIsMegaMenuOpen(true)}
            onMouseLeave={() => setIsMegaMenuOpen(false)}
          >
            <Button
              variant="ghost"
              className={`h-9 px-4 rounded-full flex items-center gap-2 font-semibold transition-colors ${
                (pathname.startsWith("/category/") && pathname !== "/category/all") || isMegaMenuOpen
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Categories
            </Button>
            
            {/* Mega Menu Dropdown */}
            {isMegaMenuOpen && categories.length > 0 && (
              <div className="absolute top-[48px] left-4 w-[800px] bg-white border rounded-xl shadow-lg p-6 z-50 animate-in fade-in duration-200">
                <div className="grid grid-cols-4 gap-4">
                  {categories.map((cat) => {
                    const isCatActive = pathname === `/category/${cat.slug}`;
                    return (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className={`flex items-center gap-3 group p-3 rounded-xl transition-colors border ${
                          isCatActive
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "hover:bg-slate-50 border-transparent hover:border-slate-100"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors overflow-hidden ${
                          isCatActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-white"
                        }`}>
                          {cat.image ? (
                            <img src={getImageUrl(cat.image)} alt={cat.name} className="w-6 h-6 object-contain" />
                          ) : (
                            categoryIconMap[cat.name] || <LayoutGrid className="w-5 h-5"/>
                          )}
                        </div>
                        <span className={`text-sm font-medium transition-colors truncate ${
                          isCatActive ? "text-emerald-800 font-bold" : "text-slate-700 group-hover:text-primary"
                        }`}>{cat.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <nav className="flex items-center gap-8 text-sm font-semibold">
            <Link
              href="/category/all"
              className={`transition-colors py-1 ${
                pathname === "/category/all"
                  ? "text-emerald-600 font-bold border-b-2 border-emerald-600"
                  : "text-slate-600 hover:text-primary"
              }`}
            >
              All Products
            </Link>
            <Link
              href="/phones"
              className={`transition-colors flex items-center gap-1.5 py-1 ${
                pathname === "/phones" || pathname.startsWith("/phones/")
                  ? "text-emerald-600 font-bold border-b-2 border-emerald-600"
                  : "text-slate-600 hover:text-primary"
              }`}
            >
              <Smartphone className="w-4 h-4" /> Phones
            </Link>
            {headerMenus.length > 0 ? (
              headerMenus.map((m) => {
                const isActive = pathname === m.linkValue;
                return (
                  <Link
                    key={m.id}
                    href={m.linkValue}
                    target={m.openInNewTab ? "_blank" : undefined}
                    className={`transition-colors py-1 ${
                      isActive
                        ? "text-emerald-600 font-bold border-b-2 border-emerald-600"
                        : "text-slate-600 hover:text-primary"
                    }`}
                  >
                    {m.label}
                  </Link>
                );
              })
            ) : (
              categories.slice(0, 4).map((c) => {
                const isActive = pathname === `/category/${c.slug}`;
                return (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className={`transition-colors py-1 ${
                      isActive
                        ? "text-emerald-600 font-bold border-b-2 border-emerald-600"
                        : "text-slate-600 hover:text-primary"
                    }`}
                  >
                    {c.name}
                  </Link>
                );
              })
            )}
            <Link
              href="/blog"
              className={`transition-colors py-1 ${
                pathname === "/blog" || pathname.startsWith("/blog/")
                  ? "text-emerald-600 font-bold border-b-2 border-emerald-600"
                  : "text-slate-600 hover:text-primary"
              }`}
            >
              Blogs
            </Link>
            <Link
              href="/contact"
              className={`transition-colors py-1 ${
                pathname === "/contact"
                  ? "text-emerald-600 font-bold border-b-2 border-emerald-600"
                  : "text-slate-600 hover:text-primary"
              }`}
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>

      {/* Cart Drawer / Slide-Over Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 bg-white">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center justify-between text-lg font-bold text-slate-800">
              <span>Shopping Cart ({itemCount})</span>
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">Your cart is empty</h3>
              <p className="text-sm text-slate-500 mb-6">Looks like you haven't added any products yet.</p>
              <Button onClick={() => setIsCartOpen(false)} asChild>
                <Link href="/category/all">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0">
                    <div className="w-16 h-16 rounded-lg bg-slate-50 border flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                      {item.image ? (
                        <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <Smartphone className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{item.name}</h4>
                      {(item.color || item.quality) && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {[item.color, item.quality].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      <p className="text-sm font-bold text-emerald-600 mt-1">৳{item.price.toLocaleString()}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md h-7">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="px-2 h-full hover:bg-slate-100 text-slate-600 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="px-2 h-full hover:bg-slate-100 text-slate-600 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-slate-400 hover:text-danger p-1"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t bg-slate-50 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-bold text-slate-900 text-base">৳{subtotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-500">Shipping and taxes calculated at checkout.</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button variant="outline" onClick={() => setIsCartOpen(false)} asChild>
                    <Link href="/cart">View Cart</Link>
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={() => setIsCartOpen(false)} asChild>
                    <Link href="/checkout" className="flex items-center justify-center gap-1.5">
                      Checkout <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}
