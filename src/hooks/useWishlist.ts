import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    supabase
      .from("wishlists")
      .select("listing_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
        } else if (data) {
          setIds(new Set(data.map((r) => r.listing_id)));
        }
        setLoading(false);
      });
  }, [user]);

  const toggle = async (listingId: string) => {
    if (!user) {
      toast.error("Please sign in to save items");
      return;
    }
    const next = new Set(ids);
    if (ids.has(listingId)) {
      next.delete(listingId);
      setIds(next);
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);
      if (error) {
        toast.error("Couldn't remove from wishlist");
        setIds(ids);
      }
    } else {
      next.add(listingId);
      setIds(next);
      const { error } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, listing_id: listingId });
      if (error) {
        toast.error("Couldn't add to wishlist");
        setIds(ids);
      } else {
        toast.success("Saved to wishlist");
      }
    }
  };

  return { ids, toggle, loading };
}
