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
import { useTheme } from "@/hooks/useTheme";
import {
  Heart,
  MessageCircle,
  Moon,
  Plus,
  Sun,
  User as UserIcon,
  LayoutDashboard,
  LogOut,
  Search,
  ChevronDown,
} from "lucide-react";
import logo from "@/assets/sellora-logo.png";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const initial = user?.email?.[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`id, conversations!inner(buyer_id, seller_id)`)
        .is("read_at", null)
        .neq("sender_id", user.id)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`, { foreignTable: "conversations" });
      if (!error && data) setUnreadCount(data.length);
    };
    fetchUnread();
    const channel = supabase.channel("header-notifications").on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchUnread()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-4 md:gap-8">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img src={logo} alt="Sellora" className="h-8 w-auto md:h-10" />
          </Link>

          {/* Search Bar - OLX Style */}
          <div className="hidden flex-1 items-center gap-3 lg:flex">
            <div className="relative flex h-11 w-64 items-center rounded-sm border-2 border-primary bg-white px-3">
              <Search className="mr-2 h-5 w-5 text-primary" />
              <input type="text" placeholder="India" className="w-full text-sm font-medium outline-none" />
              <ChevronDown className="ml-2 h-5 w-5 text-primary" />
            </div>
            <div className="relative flex h-11 flex-1 items-center rounded-sm border-2 border-primary bg-white px-3 overflow-hidden">
              <input type="text" placeholder="Find Cars, Mobile Phones and more..." className="w-full text-sm font-medium outline-none" />
              <button className="flex h-11 w-11 items-center justify-center bg-primary text-white -mr-3">
                <Search className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4 md:gap-6">
            <Button variant="ghost" size="icon" onClick={toggle} className="rounded-full h-10 w-10">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5 text-primary" />}
            </Button>

            {!user ? (
              <button 
                onClick={() => navigate({ to: "/auth", search: { redirect: "/" } })}
                className="text-sm font-bold border-b-2 border-transparent hover:border-primary transition-all text-primary"
              >
                Login
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 group">
                    <Avatar className="h-8 w-8 ring-2 ring-transparent transition-all group-hover:ring-primary/20">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-primary text-white text-xs font-bold">{initial}</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-primary" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}><UserIcon className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/messages" })} className="relative">
                    <MessageCircle className="mr-2 h-4 w-4" /> Chat
                    {unreadCount > 0 && <span className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/wishlist" })}><Heart className="mr-2 h-4 w-4" /> Wishlist</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="text-red-500 focus:text-red-500"><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              onClick={() => navigate({ to: user ? "/sell" : "/auth", search: user ? undefined : { redirect: "/sell" } })}
              className="group relative flex h-11 items-center gap-1 rounded-full border-4 border-l-yellow-400 border-t-yellow-400 border-r-blue-500 border-b-blue-500 bg-white px-5 font-black text-primary shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-wide">Sell</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
