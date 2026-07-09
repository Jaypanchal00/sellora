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
import { cn } from "@/lib/utils";

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
    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus as Tables<"listings">["status"] })
      .eq("id", id);
    if (error) {
      toast.error("Couldn't update status");
    } else {
      setListings((p) =>
        p.map((l) =>
          l.id === id ? { ...l, status: newStatus as Tables<"listings">["status"] } : l,
        ),
      );
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your listings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage everything you have for sale.</p>
        </div>
        <Button
          onClick={() => navigate({ to: "/sell" })}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 font-bold text-sm shadow-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" /> New listing
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center mt-10">
          <h3 className="text-xl font-bold text-slate-900">No listings yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Post your first item and reach buyers today.
          </p>
          <Button
            onClick={() => navigate({ to: "/sell" })}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 font-bold shadow-sm"
          >
            Create your first listing
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className="group flex flex-col overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md"
            >
              <Link to="/listing/$id" params={{ id: l.id }} className="block overflow-hidden relative">
                <div className="aspect-[4/3] bg-slate-100 w-full overflow-hidden">
                  {l.images?.[0] ? (
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-slate-300">📦</div>
                  )}
                </div>
              </Link>
              <div className="space-y-3 p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-bold text-slate-900 leading-tight">{l.title}</h3>
                  <span className={cn(
                    "shrink-0 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                    l.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {l.status}
                  </span>
                </div>
                <p className="font-extrabold text-[18px] text-blue-600 mt-auto pt-2">
                  {formatPrice(Number(l.price), l.currency)}
                </p>
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> {l.views} views
                  </span>
                  <span>{formatRelativeTime(l.created_at)}</span>
                </div>
                <div className="flex gap-2 pt-3 mt-1 border-t border-slate-100">
                  <Button asChild variant="outline" size="sm" className="flex-1 rounded-lg font-semibold text-slate-700 border-slate-200 hover:bg-slate-50">
                    <Link to="/listing/$id" params={{ id: l.id }}>
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg font-semibold text-slate-700 border-slate-200 hover:bg-slate-50"
                    onClick={() => handleMarkSold(l.id, l.status)}
                  >
                    {l.status === "active" ? "Mark Sold" : "Reactivate"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
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
