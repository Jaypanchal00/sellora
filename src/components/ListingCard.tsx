import { Link } from "@tanstack/react-router";
import { Heart, MapPin } from "lucide-react";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

interface ListingCardProps {
  listing: Tables<"listings">;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
}

export function ListingCard({ listing, isWishlisted, onToggleWishlist }: ListingCardProps) {
  const cover = listing.images?.[0];
  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group flex flex-col gap-3 transition-base hover:-translate-y-1"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">📦</div>
        )}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(listing.id);
            }}
            aria-label="Toggle wishlist"
            className="absolute right-3 top-3 rounded-full bg-background/50 p-2 text-foreground backdrop-blur-md transition-all hover:scale-110 hover:bg-background/80"
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-destructive text-destructive")} />
          </button>
        )}
        {listing.status !== "active" && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <span className="rounded-full bg-background px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-foreground shadow-lg">
              {listing.status}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-foreground md:text-lg">{listing.title}</h3>
          <p className="shrink-0 font-display font-bold text-foreground md:text-lg">
            {formatPrice(Number(listing.price), listing.currency || "USD")}
          </p>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {listing.location}
          </span>
          <span className="mx-2 text-muted-foreground/40">•</span>
          <span>{formatRelativeTime(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
      <div className="space-y-2">
        <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
