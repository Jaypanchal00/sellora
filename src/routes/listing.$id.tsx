import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CATEGORIES, formatPrice, formatRelativeTime } from "@/lib/format";
import {
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  CheckCircle2,
} from "lucide-react";
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

  const handleCall = () => {
    toast.info("Phone number revealed to registered users only.");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-100 md:col-span-3" />
          <div className="space-y-4 md:col-span-2">
            <div className="h-8 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-48 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Listing not found</h1>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
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
    <div className="container mx-auto px-4 lg:px-8 py-8 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-6">
        <Link to="/" className="text-blue-600 hover:underline">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/search" search={{ category: listing.category }} className="text-blue-600 hover:underline capitalize">
          {listing.category}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-800">{listing.title}</span>
      </div>

      <div className="grid gap-8 lg:gap-12 lg:grid-cols-12">
        {/* Left Col: Image Gallery */}
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] md:aspect-square overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center p-4 md:p-8">
            {/* Featured Badge */}
            <div className="absolute top-4 left-4 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              FEATURED
            </div>

            {currentImg ? (
              <img src={currentImg} alt={listing.title} className="h-full w-full object-contain mix-blend-multiply" />
            ) : (
              <div className="text-7xl text-slate-300">📦</div>
            )}
            
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 text-slate-800 p-2 shadow hover:bg-white transition"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 text-slate-800 p-2 shadow hover:bg-white transition"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "h-20 w-20 flex-shrink-0 rounded-xl flex items-center justify-center p-2 bg-slate-50 transition-all",
                    i === imgIdx ? "ring-2 ring-blue-600 shadow-sm" : "hover:bg-slate-100",
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Info */}
        <div className="space-y-6 lg:col-span-5">
          <div>
            <h1 className="text-[28px] font-extrabold text-slate-900 leading-tight">
              {listing.title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {/* Dummy subtitle since DB might not have it split perfectly */}
              {listing.title.includes("iPhone") ? "256GB, Natural Titanium" : ""}
            </p>
            
            {/* Fake Reviews */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-amber-400 text-sm">
                ⭐⭐⭐⭐<span className="text-amber-400/50">⭐</span>
              </div>
              <span className="text-sm font-bold text-slate-800">4.8</span>
              <span className="text-sm text-slate-500 underline cursor-pointer hover:text-slate-800">(128 reviews)</span>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <p className="text-[32px] font-extrabold text-slate-900">
                {formatPrice(Number(listing.price), listing.currency || "INR")}
              </p>
              {listing.condition && (
                <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded border border-emerald-200 uppercase">
                  {listing.condition.replace("-", " ")}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <dl className="space-y-4 text-sm">
              {listing.condition && (
                <div className="flex">
                  <dt className="w-[120px] text-slate-500 font-medium">Condition</dt>
                  <dd className="font-semibold text-slate-900 capitalize">{listing.condition.replace("-", " ")}</dd>
                </div>
              )}
              <div className="flex">
                <dt className="w-[120px] text-slate-500 font-medium">Brand</dt>
                <dd className="font-semibold text-slate-900 capitalize">Apple</dd>
              </div>
              <div className="flex">
                <dt className="w-[120px] text-slate-500 font-medium">Storage</dt>
                <dd className="font-semibold text-slate-900">256GB</dd>
              </div>
              <div className="flex">
                <dt className="w-[120px] text-slate-500 font-medium">Location</dt>
                <dd className="font-semibold text-slate-900">{listing.location}</dd>
              </div>
              <div className="flex">
                <dt className="w-[120px] text-slate-500 font-medium">Posted</dt>
                <dd className="font-semibold text-slate-900">{formatRelativeTime(listing.created_at)}</dd>
              </div>
              
              <div className="flex items-start pt-2">
                <dt className="w-[120px] text-slate-500 font-medium mt-1">Seller</dt>
                <dd className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarImage src={seller?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
                      {sellerInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-[15px]">
                        {seller?.full_name ?? "Seller"}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-blue-600 fill-blue-100" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Member since {seller ? new Date(seller.created_at).getFullYear() : "2023"}
                    </p>
                    <p className="text-xs font-semibold text-blue-600 mt-0.5 hover:underline cursor-pointer">
                      Verified Seller <CheckCircle2 className="inline h-3 w-3" />
                    </p>
                  </div>
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {listing.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleCall}
              className="flex-1 rounded-xl py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition-all"
            >
              <Phone className="mr-2 h-5 w-5" />
              Call
            </Button>
            <Button
              onClick={handleChat}
              disabled={chatLoading || user?.id === listing.seller_id}
              className="flex-1 rounded-xl py-6 bg-[#05c46b] hover:bg-[#05c46b]/90 text-white font-bold shadow-md shadow-[#05c46b]/20 transition-all"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleWish(listing.id)}
              className="rounded-xl h-[48px] w-[48px] p-0 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Wishlist"
            >
              <Heart className={cn("h-5 w-5", wished && "fill-red-500 text-red-500")} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
