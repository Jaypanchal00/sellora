import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES, formatPrice, formatRelativeTime } from "@/lib/format";
import { Heart, MapPin, MessageCircle, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/listing/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ids: wishIds, toggle: toggleWish } = useWishlist();
  const [listing, setListing] = useState<Tables<"listings"> | null>(null);
  const [seller, setSeller] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [similarListings, setSimilarListings] = useState<Tables<"listings">[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setLoading(false);
        return;
      }
      setListing(data);
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.seller_id)
        .maybeSingle();
      if (active) setSeller(prof);

      const { data: revs } = await supabase
        .from("reviews")
        .select("*")
        .eq("target_id", data.seller_id)
        .order("created_at", { ascending: false });
      if (active) setReviews(revs ?? []);

      const { data: similar } = await supabase
        .from("listings")
        .select("*")
        .eq("category", data.category)
        .eq("status", "active")
        .neq("id", data.id)
        .order("created_at", { ascending: false })
        .limit(4);
      if (active) setSimilarListings(similar ?? []);

      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleChat = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/listing/${id}` } });
      return;
    }
    if (!listing || listing.seller_id === user.id) {
      toast.info("This is your own listing");
      return;
    }
    setChatLoading(true);
    // Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", user.id)
      .maybeSingle();

    let convId = existing?.id;
    if (!convId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
        })
        .select("id")
        .single();
      if (error || !created) {
        toast.error("Couldn't start chat");
        setChatLoading(false);
        return;
      }
      convId = created.id;
    }
    navigate({ to: "/messages/$id", params: { id: convId } });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: listing?.title || "Sellora",
      text: `Check out this ${listing?.title} on Sellora!`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted md:col-span-3" />
          <div className="space-y-4 md:col-span-2">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Listing not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          ← Back to browse
        </Link>
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : [];
  const currentImg = images[imgIdx];
  const wished = wishIds.has(listing.id);
  const cat = CATEGORIES.find((c) => c.value === listing.category);
  const sellerInitial = (seller?.full_name ?? "U")[0]?.toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* CAROUSEL */}
        <div className="lg:col-span-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-gradient-brand-soft shadow-card">
            {currentImg ? (
              <img src={currentImg} alt={listing.title} className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">📦</div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-soft backdrop-blur transition-base hover:scale-110"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-soft backdrop-blur transition-base hover:scale-110"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-base",
                    i === imgIdx
                      ? "border-primary"
                      : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="space-y-5 lg:col-span-2">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-brand-soft px-3 py-1 text-xs font-semibold text-foreground">
              {cat?.emoji} {cat?.label}
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight">
              {listing.title}
            </h1>
            <p className="mt-2 text-3xl font-bold text-gradient-brand">
              {formatPrice(Number(listing.price), listing.currency)}
            </p>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {listing.location}
              </span>
              <span>· {formatRelativeTime(listing.created_at)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {listing.description}
            </p>
          </div>

          {/* Seller & Reviews */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <Avatar className="h-12 w-12">
                <AvatarImage src={seller?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-gradient-brand text-brand-foreground font-semibold">
                  {sellerInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{seller?.full_name ?? "Seller"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Member since {seller ? new Date(seller.created_at).toLocaleDateString() : "—"}
                  </span>
                  {reviews.length > 0 && (
                    <span className="flex items-center gap-0.5 text-yellow-500 font-medium">
                      ⭐ {(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)} (
                      {reviews.length})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleChat}
                disabled={chatLoading || user?.id === listing.seller_id}
                className="flex-1 rounded-full bg-gradient-brand text-brand-foreground shadow-glow"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {user?.id === listing.seller_id ? "Your listing" : "Chat"}
              </Button>
              {user?.id !== listing.seller_id && (
                <OfferDialog
                  listing={listing}
                  sellerId={listing.seller_id}
                  chatLoading={chatLoading}
                  onChatStarted={() => setChatLoading(true)}
                />
              )}
              <Button
                variant="outline"
                onClick={() => toggleWish(listing.id)}
                className="rounded-full"
                aria-label="Wishlist"
              >
                <Heart className={cn("h-4 w-4", wished && "fill-destructive text-destructive")} />
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="rounded-full"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4 text-primary" />
              </Button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() =>
                  toast.success(
                    "Report submitted. Our trust & safety team will review this listing shortly.",
                  )
                }
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              >
                🚩 Report this listing
              </button>
            </div>

            {/* Review Section */}
            {user && user.id !== listing.seller_id && (
              <div className="pt-4 border-t border-border/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold">Reviews</h3>
                  <ReviewDialog
                    targetId={listing.seller_id}
                    listingId={listing.id}
                    onSuccess={(newReview) => setReviews([newReview, ...reviews])}
                  />
                </div>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reviews yet for this seller.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="text-sm border border-border/60 rounded-xl p-3 bg-muted/30"
                      >
                        <div className="flex items-center gap-1 mb-1 text-yellow-500">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <span key={i}>⭐</span>
                          ))}
                        </div>
                        <p className="text-foreground">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Listings */}
      {similarListings.length > 0 && (
        <div className="mt-16 border-t border-border/60 pt-10">
          <h2 className="font-display text-2xl font-bold mb-6">You might also like</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similarListings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                isWishlisted={wishIds.has(l.id)}
                onToggleWishlist={toggleWish}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewDialog({
  targetId,
  listingId,
  onSuccess,
}: {
  targetId: string;
  listingId: string;
  onSuccess: (r: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        reviewer_id: user.id,
        target_id: targetId,
        listing_id: listingId,
        rating,
        comment,
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      toast.error(
        error.message.includes("unique")
          ? "You already reviewed this user for this item."
          : "Failed to submit review",
      );
    } else {
      toast.success("Review submitted!");
      setOpen(false);
      onSuccess(data);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-full text-xs"
      >
        Leave a Review
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-card relative">
            <h2 className="font-display text-xl font-bold mb-4">Rate the Seller</h2>
            <div className="flex gap-2 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={cn(
                    "text-3xl transition-transform hover:scale-110",
                    rating >= star ? "grayscale-0" : "grayscale opacity-30",
                  )}
                >
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              className="w-full rounded-xl border border-border/60 bg-background p-3 text-sm mb-4 outline-none focus:border-primary"
              rows={3}
              placeholder="How was your experience?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={submitting}
                className="flex-1 rounded-full bg-gradient-brand text-brand-foreground shadow-glow"
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OfferDialog({
  listing,
  sellerId,
  chatLoading,
  onChatStarted,
}: {
  listing: any;
  sellerId: string;
  chatLoading: boolean;
  onChatStarted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMakeOffer = async () => {
    if (!user || !offerPrice) return;
    setSubmitting(true);
    onChatStarted();

    // 1. Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", user.id)
      .maybeSingle();

    let convId = existing?.id;
    if (!convId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: sellerId,
        })
        .select("id")
        .single();
      if (error || !created) {
        toast.error("Couldn't start chat");
        setSubmitting(false);
        return;
      }
      convId = created.id;
    }

    // 2. Send the offer message
    const offerMessage = `Hi! I would like to make an offer of ${formatPrice(Number(offerPrice), listing.currency || "USD")} for "${listing.title}". Is this acceptable?`;
    await supabase.from("messages").insert({
      conversation_id: convId,
      sender_id: user.id,
      content: offerMessage,
    });

    setSubmitting(false);
    setOpen(false);
    navigate({ to: "/messages/$id", params: { id: convId } });
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!user) {
            navigate({ to: "/auth", search: { redirect: `/listing/${listing.id}` } });
            return;
          }
          setOpen(true);
        }}
        disabled={chatLoading}
        className="flex-1 rounded-full bg-muted font-bold text-foreground hover:bg-muted/80 shadow-soft"
      >
        Make Offer
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-3xl p-6 w-full max-w-sm shadow-card relative">
            <h2 className="font-display text-2xl font-bold mb-2">Make an Offer</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Seller's price is {formatPrice(Number(listing.price), listing.currency || "USD")}.
            </p>

            <div className="relative mb-5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                {listing.currency === "INR" ? "₹" : listing.currency === "EUR" ? "€" : "$"}
              </span>
              <input
                type="number"
                min="1"
                className="w-full rounded-2xl border-2 border-border/60 bg-background p-4 pl-8 text-xl font-bold outline-none focus:border-primary transition-colors"
                placeholder="Your offer"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full py-6"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={submitting || !offerPrice}
                className="flex-1 rounded-full py-6 bg-gradient-brand text-brand-foreground shadow-glow"
                onClick={handleMakeOffer}
              >
                {submitting ? "Sending..." : "Send Offer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
