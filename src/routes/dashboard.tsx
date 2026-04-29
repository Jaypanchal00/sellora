import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { ListingCardSkeleton } from "@/components/ListingCard";
import { Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Your dashboard — Sellora" }] }),
});

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Tables<"listings">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/dashboard" } });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("listings")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast.error("Failed to load listings");
        } else {
          setListings(data ?? []);
        }
        setLoading(false);
      });
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete listing");
    } else {
      setListings((p) => p.filter((l) => l.id !== id));
      toast.success("Listing deleted");
    }
  };

  const handleMarkSold = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "sold" : "active";
    const { error } = await supabase.from("listings").update({ status: newStatus as Tables<"listings">["status"] }).eq("id", id);
    if (error) {
      toast.error("Couldn't update status");
    } else {
      setListings((p) => p.map((l) => l.id === id ? { ...l, status: newStatus as Tables<"listings">["status"] } : l));
      toast.success(newStatus === "sold" ? "Marked as sold!" : "Listing reactivated");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Your listings</h1>
          <p className="text-sm text-muted-foreground">Manage everything you have for sale.</p>
        </div>
        <Button
          onClick={() => navigate({ to: "/sell" })}
          className="rounded-full bg-gradient-brand text-brand-foreground shadow-glow"
        >
          <Plus className="mr-1 h-4 w-4" /> New listing
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <h3 className="font-display text-xl font-bold">No listings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Post your first item and reach buyers today.
          </p>
          <Button
            onClick={() => navigate({ to: "/sell" })}
            className="mt-5 rounded-full bg-gradient-brand text-brand-foreground shadow-glow"
          >
            Create your first listing
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card"
            >
              <Link to="/listing/$id" params={{ id: l.id }} className="block">
                <div className="aspect-[4/3] overflow-hidden bg-gradient-brand-soft">
                  {l.images?.[0] ? (
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">📦</div>
                  )}
                </div>
              </Link>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="line-clamp-1 font-semibold">{l.title}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                    {l.status}
                  </span>
                </div>
                <p className="font-bold text-gradient-brand">
                  {formatPrice(Number(l.price), l.currency)}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {l.views} views
                  </span>
                  <span>{formatRelativeTime(l.created_at)}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 rounded-full">
                    <Link to="/listing/$id" params={{ id: l.id }}>
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-full"
                    onClick={() => handleMarkSold(l.id, l.status)}
                  >
                    {l.status === "active" ? "Mark Sold" : "Reactivate"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove "{l.title}" from Sellora.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(l.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
