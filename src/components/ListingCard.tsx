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
      className="group block bg-white rounded-md border border-border/60 overflow-hidden card-hover"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-20">📦</div>
        )}
        
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(listing.id);
            }}
            className="absolute right-2 top-2 rounded-full bg-white/80 p-2 text-primary shadow-sm hover:bg-white transition-colors"
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-primary text-primary")} />
          </button>
        )}

        {listing.status !== "active" && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-primary text-white px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-sm">
              {listing.status}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-1">
        <p className="text-xl font-black text-primary truncate">
          {formatPrice(Number(listing.price), listing.currency || "USD")}
        </p>
        <h3 className="text-sm font-medium text-gray-600 line-clamp-1">
          {listing.title}
        </h3>
        <div className="flex items-center justify-between pt-2 text-[10px] uppercase font-bold tracking-wider text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {listing.location}
          </span>
          <span>{formatRelativeTime(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-md border border-border/60 overflow-hidden">
      <div className="aspect-[4/3] w-full animate-pulse bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-6 w-1/2 animate-pulse bg-gray-200 rounded" />
        <div className="h-4 w-3/4 animate-pulse bg-gray-100 rounded" />
        <div className="flex justify-between pt-2">
          <div className="h-3 w-1/4 animate-pulse bg-gray-100 rounded" />
          <div className="h-3 w-1/4 animate-pulse bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
