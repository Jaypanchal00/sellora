import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import {
  Heart,
  MessageCircle,
  Plus,
  User as UserIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Search,
  ChevronDown,
  Bell,
  Hexagon,
  Menu,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [headerLocation, setHeaderLocation] = useState("Ahmedabad");
  const [locationLoading, setLocationLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const initial = user?.email?.[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    const savedLoc = localStorage.getItem("sellora-header-location");
    if (savedLoc) setHeaderLocation(savedLoc);
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.state || "Unknown";
            setHeaderLocation(city);
            localStorage.setItem("sellora-header-location", city);
            toast.success(`Location updated to ${city}`);
          }
        } catch (err) {
          toast.error("Could not fetch city name");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        toast.error("Location permission denied");
        setLocationLoading(false);
      }
    );
  };

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread messages count
    const fetchUnreadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`id, conversations!inner(buyer_id, seller_id)`)
        .is("read_at", null)
        .neq("sender_id", user.id)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`, { foreignTable: "conversations" });

      if (!error && data) {
        setUnreadCount(data.length);
      }
    };

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setNotifications(data);
        setUnreadNotifications(data.filter(n => !n.read_at).length);
      }
    };

    fetchUnreadMessages();
    fetchNotifications();

    const messagesChannel = supabase
      .channel("header-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchUnreadMessages();
      })
      .subscribe();

    const notifChannel = supabase
      .channel("header-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user]);

  const markNotificationRead = async (id: string, link: string | null) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadNotifications((prev) => Math.max(0, prev - 1));
    if (link) navigate({ to: link as any });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate({ to: "/search", search: { q: search.trim() } });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-[72px] items-center justify-between gap-4 px-4 lg:px-8">
        
        {/* LEFT: Logo & Location & Mobile Menu */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <div className="flex flex-col h-full bg-white">
                  <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-sm">
                      <span className="font-bold text-lg leading-none mt-[-1px]">S</span>
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-[#2563eb] uppercase">
                      SELLORA
                    </span>
                  </div>
                  <div className="p-4">
                    <form onSubmit={handleSearch} className="flex h-10 w-full items-center rounded bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden mb-6">
                      <div className="flex items-center pl-3">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search for cars..."
                        className="h-full border-0 bg-transparent px-3 text-[13px] font-medium text-slate-600 focus-visible:ring-0 shadow-none flex-1"
                      />
                    </form>
                    <div className="space-y-4">
                      {user && (
                        <>
                          <Link to="/dashboard" className="flex items-center gap-3 text-slate-700 font-semibold p-2 hover:bg-slate-50 rounded-lg">
                            <LayoutDashboard className="h-5 w-5 text-blue-600" /> Dashboard
                          </Link>
                          <Link to="/messages" className="flex items-center justify-between text-slate-700 font-semibold p-2 hover:bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <MessageCircle className="h-5 w-5 text-blue-600" /> Messages
                            </div>
                            {unreadCount > 0 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                                {unreadCount}
                              </span>
                            )}
                          </Link>
                          <Link to="/wishlist" className="flex items-center gap-3 text-slate-700 font-semibold p-2 hover:bg-slate-50 rounded-lg">
                            <Heart className="h-5 w-5 text-blue-600" /> Wishlist
                          </Link>
                          <Link to="/profile" className="flex items-center gap-3 text-slate-700 font-semibold p-2 hover:bg-slate-50 rounded-lg">
                            <UserIcon className="h-5 w-5 text-blue-600" /> Profile
                          </Link>
                        </>
                      )}
                      {!user && (
                        <Link to="/auth" className="flex items-center gap-3 text-slate-700 font-semibold p-2 hover:bg-slate-50 rounded-lg">
                          <UserIcon className="h-5 w-5 text-blue-600" /> Login / Register
                        </Link>
                      )}
                    </div>
                  </div>
                  {user && (
                    <div className="mt-auto p-4 border-t border-slate-100">
                      <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="flex w-full items-center gap-3 text-red-600 font-semibold p-2 hover:bg-red-50 rounded-lg">
                        <LogOut className="h-5 w-5" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link to="/" className="flex items-center gap-1.5 group transition-all duration-300">
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-sm">
              <span className="font-bold text-lg leading-none mt-[-1px]">S</span>
            </div>
            <span className="font-extrabold text-[20px] sm:text-[22px] tracking-tight text-[#2563eb] uppercase">
              SELLORA
            </span>
          </Link>
          
          <button 
            onClick={handleLocateMe}
            disabled={locationLoading}
            className="hidden lg:flex items-center gap-1.5 text-[13px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer transition-colors max-w-[150px] disabled:opacity-70"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#05c46b]" />
            ) : (
              <MapPin className="h-4 w-4 text-[#05c46b]" />
            )}
            <span className="truncate">{headerLocation}</span>
          </button>
        </div>

        {/* MIDDLE: Search Bar */}
        <div className="hidden flex-1 max-w-[600px] lg:block px-4">
          <form onSubmit={handleSearch} className="flex h-10 w-full items-center rounded bg-white border border-slate-200 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden">
            <div className="flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for cars, mobiles, bikes and more..."
              className="h-full border-0 bg-transparent px-3 text-[13px] font-medium text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 shadow-none placeholder:text-slate-400 rounded-r"
            />
          </form>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-5">
          <Link
            to="/messages"
            className="hidden md:flex items-center gap-1.5 text-[13px] font-bold text-slate-700 hover:text-blue-600 transition-colors relative"
          >
            <MessageCircle className="h-[18px] w-[18px] text-slate-600" /> Chat
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-1.5 text-[13px] font-bold text-slate-700 hover:text-blue-600 transition-colors relative">
                  <Bell className="h-[18px] w-[18px] text-slate-600" /> Notifications
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => markNotificationRead(n.id, n.link)}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 cursor-pointer",
                          !n.read_at && "bg-blue-50/50"
                        )}
                      >
                        <span className="font-semibold text-sm text-slate-900">{n.title}</span>
                        <span className="text-xs text-slate-500 line-clamp-2">{n.message}</span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button 
              onClick={() => navigate({ to: "/auth", search: { redirect: "/" } })}
              className="hidden md:flex items-center gap-1.5 text-[13px] font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Bell className="h-[18px] w-[18px] text-slate-600" /> Notifications
            </button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full ring-2 ring-transparent transition-all hover:ring-blue-100 p-0.5">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[13px] font-bold text-slate-700 hidden sm:block truncate max-w-[100px]">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-500 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/wishlist" })}>
                  <Heart className="mr-2 h-4 w-4" /> Wishlist
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              search={{ redirect: "/" }}
              className="hidden md:flex items-center gap-1.5 text-[13px] font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              <UserIcon className="h-[18px] w-[18px] text-slate-600" /> Login
            </Link>
          )}

          <Button
            onClick={() =>
              navigate({
                to: user ? "/sell" : "/auth",
                search: user ? undefined : { redirect: "/sell" },
              })
            }
            className="rounded bg-[#2563eb] hover:bg-blue-700 text-white font-bold px-4 h-9 text-[13px] shadow-sm ml-1"
          >
            <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={3} /> Sell Now
          </Button>
        </div>
      </div>
    </header>
  );
}
