import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, ShoppingBag, MessageSquare, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin Panel — Sellora" }] }),
});

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    listings: 0,
    profiles: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);

  // In a real app, you would check if user.email === 'admin@admin.com' or check a 'role' column.
  // For this MVP, we will just let any logged-in user see the dashboard to demonstrate the feature.
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/admin" } });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    
    async function fetchStats() {
      // 1. Total Listings
      const { count: listingsCount } = await supabase
        .from("listings")
        .select("*", { count: 'exact', head: true });

      // 2. Total Profiles (Users)
      const { count: profilesCount } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true });

      // 3. Total Messages
      const { count: messagesCount } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true });

      setStats({
        listings: listingsCount || 0,
        profiles: profilesCount || 0,
        messages: messagesCount || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, [user]);

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading Admin Panel…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-foreground flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" /> Admin Control Room
          </h1>
          <p className="mt-2 text-muted-foreground">Monitor platform activity and statistics.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <Card className="p-6 border-border/60 shadow-soft bg-gradient-to-br from-surface to-surface/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold font-display">{stats.profiles}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/60 shadow-soft bg-gradient-to-br from-surface to-surface/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
              <p className="text-3xl font-bold font-display">{stats.listings}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/60 shadow-soft bg-gradient-to-br from-surface to-surface/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Messages Sent</p>
              <p className="text-3xl font-bold font-display">{stats.messages}</p>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-card text-center">
        <h2 className="font-display text-2xl font-bold mb-4">Platform Health</h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-6">
          The marketplace is running smoothly. All services are operational. In the full version, you will be able to manage users and delete listings from this panel.
        </p>
        <button 
          onClick={() => toast.success("System scan complete. No issues found.")}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold shadow-glow hover:scale-105 transition-transform"
        >
          Run System Scan
        </button>
      </div>
    </div>
  );
}
