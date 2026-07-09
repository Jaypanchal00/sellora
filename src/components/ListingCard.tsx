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
      className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 flex items-center justify-center p-4">
        {cover ? (
          <img
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl text-slate-300">📦</div>
        )}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(listing.id);
            }}
            aria-label="Toggle wishlist"
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm transition-all hover:scale-110 hover:bg-white border border-slate-100"
          >
            <Heart className={cn("h-4 w-4", isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400")} />
          </button>
        )}
        {listing.status !== "active" && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-slate-900 shadow-lg">
              {listing.status}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3 pt-2.5">
        <h3 className="font-bold text-slate-900 text-[15px] line-clamp-1 leading-snug">{listing.title}</h3>
        <p className="text-xs text-slate-500 line-clamp-1">
          {listing.description?.slice(0, 40)}
        </p>
        <p className="font-extrabold text-slate-900 text-base mt-0.5">
          {formatPrice(Number(listing.price), listing.currency || "INR")}
        </p>
        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="truncate">{listing.location}</span>
          <span className="mx-1 text-slate-300">•</span>
          <span className="shrink-0">{formatRelativeTime(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="aspect-[4/3] w-full animate-pulse bg-slate-100" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

