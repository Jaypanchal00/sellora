import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import BannerImg from "@/components/ui/Banner1.png";
import {
  Car,
  Bike,
  Smartphone,
  Laptop,
  Home,
  Sofa,
  Shirt,
  Dog,
  Briefcase,
  Wrench,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const SIDEBAR_CATEGORIES = [
  { label: "Cars", icon: Car, id: "cars" },
  { label: "Bikes", icon: Bike, id: "bikes" },
  { label: "Mobiles", icon: Smartphone, id: "mobiles" },
  { label: "Electronics", icon: Laptop, id: "electronics" },
  { label: "Property", icon: Home, id: "property" },
  { label: "Furniture", icon: Sofa, id: "furniture" },
  { label: "Fashion", icon: Shirt, id: "fashion" },
  { label: "Pets", icon: Dog, id: "pets" },
  { label: "Jobs", icon: Briefcase, id: "jobs" },
  { label: "Services", icon: Wrench, id: "services" },
];

const BROWSE_CATEGORIES = [
  { label: "Cars", icon: Car, id: "cars", color: "bg-red-50 text-red-500" },
  { label: "Bikes", icon: Bike, id: "bikes", color: "bg-orange-50 text-orange-500" },
  { label: "Mobiles", icon: Smartphone, id: "mobiles", color: "bg-purple-50 text-purple-500" },
  { label: "Electronics", icon: Laptop, id: "electronics", color: "bg-blue-50 text-blue-500" },
  { label: "Property", icon: Home, id: "property", color: "bg-teal-50 text-teal-500" },
  { label: "Furniture", icon: Sofa, id: "furniture", color: "bg-amber-50 text-amber-500" },
  { label: "Fashion", icon: Shirt, id: "fashion", color: "bg-pink-50 text-pink-500" },
  { label: "Pets", icon: Dog, id: "pets", color: "bg-rose-50 text-rose-500" },
  { label: "Jobs", icon: Briefcase, id: "jobs", color: "bg-indigo-50 text-indigo-500" },
  { label: "Services", icon: Wrench, id: "services", color: "bg-cyan-50 text-cyan-500" },
];

function HomePage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Tables<"listings">[]>([]);
  const [loading, setLoading] = useState(true);
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(4);

      if (!active) return;
      if (error) {
        console.error(error);
        setListings([]);
      } else {
        setListings(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="container mx-auto px-4 lg:px-8 py-6 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar */}
        <aside className="hidden md:flex w-[200px] flex-col shrink-0">
          <h2 className="font-bold text-slate-900 text-sm mb-4 px-1">Categories</h2>
          <nav className="flex flex-col">
            {(showAllCategories ? SIDEBAR_CATEGORIES : SIDEBAR_CATEGORIES.slice(0, 5)).map((c) => (
              <button
                key={c.id}
                onClick={() => navigate({ to: "/search", search: { category: c.id } })}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors text-left"
              >
                <c.icon className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
                {c.label}
              </button>
            ))}
            <button 
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 text-sm font-semibold text-blue-600 transition-colors text-left mt-1"
            >
              {showAllCategories ? "See Less" : "See More"}
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl w-full group">
            <img 
              src={BannerImg} 
              alt="Buy, Sell & Discover Great Deals Near You" 
              className="w-full h-auto object-cover"
            />
            <div className="absolute bottom-4 left-6 sm:bottom-6 sm:left-10 lg:bottom-8 lg:left-14">
              <Button
                onClick={() => navigate({ to: "/search" })}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-5 sm:px-8 sm:py-6 font-extrabold text-sm sm:text-base shadow-xl transition-transform hover:-translate-y-1"
              >
                Explore Now
              </Button>
            </div>
          </div>

          {/* Featured Products */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Featured Products</h2>
              <Link to="/search" className="text-sm font-semibold text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <EmptyState onSell={() => navigate({ to: "/sell" })} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {listings.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    isWishlisted={wishlistIds.has(l.id)}
                    onToggleWishlist={toggleWishlist}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Browse by Category */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-5">Browse by Category</h2>
            <div className="flex flex-wrap gap-5">
              {BROWSE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate({ to: "/search", search: { category: c.id } })}
                  className="flex flex-col items-center gap-2.5 group min-w-[72px]"
                >
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm", c.color)}>
                    <c.icon className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{c.label}</span>
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSell }: { onSell: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
        <Search className="h-6 w-6" />
      </div>
      <h3 className="font-display text-xl font-bold text-slate-900">No listings yet</h3>
      <p className="mt-1.5 text-sm text-slate-500 mb-6">
        Try adjusting your filters, or be the first to post something amazing.
      </p>
      <Button
        onClick={onSell}
        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
      >
        Post a listing
      </Button>
    </div>
  );
}
