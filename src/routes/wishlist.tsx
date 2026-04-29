import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { useWishlist } from "@/hooks/useWishlist";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
  head: () => ({ meta: [{ title: "Your wishlist — Sellora" }] }),
});

function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { ids, toggle } = useWishlist();
  const [items, setItems] = useState<Tables<"listings">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/wishlist" } });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    if (ids.size === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("listings")
      .select("*")
      .in("id", Array.from(ids))
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, [user, ids]);

  if (authLoading || !user)
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>
    );

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">Your wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">Items you've saved for later.</p>

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <div className="mx-auto mb-3 text-4xl">💖</div>
            <h3 className="font-display text-xl font-bold">No saved items</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any listing to save it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} isWishlisted onToggleWishlist={toggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
