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
  Compass,
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
    
    // Fetch initial unread messages count
    const fetchUnread = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`id, conversations!inner(buyer_id, seller_id)`)
        .is('read_at', null)
        .neq('sender_id', user.id)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`, { foreignTable: 'conversations' });
        
      if (!error && data) {
        setUnreadCount(data.length);
      }
    };
    
    fetchUnread();

    // Listen for new messages
    const channel = supabase
      .channel('header-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Sellora" width={36} height={36} className="h-9 w-9" />
          <span className="font-display text-2xl font-extrabold tracking-tight">
            <span className="text-gradient-brand">Sellora</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-base hover:bg-muted hover:text-foreground"
          >
            Browse
          </Link>
          {user && (
            <>
              <Link
                to="/messages"
                className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-base hover:bg-muted hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" /> Chat
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-base hover:bg-muted hover:text-foreground"
              >
                <Heart className="h-4 w-4" /> Wishlist
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            onClick={() =>
              navigate({
                to: user ? "/sell" : "/auth",
                search: user ? undefined : { redirect: "/sell" },
              })
            }
            className="hidden rounded-full bg-gradient-brand text-brand-foreground shadow-glow transition-base hover:opacity-95 sm:inline-flex"
          >
            <Plus className="mr-1 h-4 w-4" /> Sell
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-2 ring-transparent transition-base hover:ring-primary/40">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-brand text-brand-foreground font-semibold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
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
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={() => navigate({ to: "/" })} className="md:hidden">
                  <Compass className="mr-2 h-4 w-4" /> Browse
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/messages" })} className="md:hidden">
                  <MessageCircle className="mr-2 h-4 w-4" /> Chat
                  {unreadCount > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/wishlist" })} className="md:hidden">
                  <Heart className="mr-2 h-4 w-4" /> Wishlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/sell" })} className="md:hidden">
                  <Plus className="mr-2 h-4 w-4" /> Sell something
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
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/auth", search: { redirect: "/" } })}
              className="rounded-full"
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
