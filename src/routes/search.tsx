import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchParams = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  location?: string;
  sort?: string;
};

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: (search.q as string) || "",
      category: (search.category as string) || "all",
      minPrice: (search.minPrice as string) || "",
      maxPrice: (search.maxPrice as string) || "",
      condition: (search.condition as string) || "all",
      location: (search.location as string) || "",
      sort: (search.sort as string) || "latest",
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [listings, setListings] = useState<Tables<"listings">[]>([]);
  const [loading, setLoading] = useState(true);
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      let q = supabase.from("listings").select("*").eq("status", "active");

      if (searchParams.q) {
        const term = searchParams.q.replace(/[%,]/g, "");
        q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      if (searchParams.category && searchParams.category !== "all") {
        q = q.eq("category", searchParams.category);
      }
      if (searchParams.location) {
        q = q.ilike("location", `%${searchParams.location}%`);
      }
      if (searchParams.minPrice) q = q.gte("price", Number(searchParams.minPrice));
      if (searchParams.maxPrice) q = q.lte("price", Number(searchParams.maxPrice));
      if (searchParams.condition && searchParams.condition !== "all") {
        q = q.eq("condition", searchParams.condition);
      }

      if (searchParams.sort === "latest") q = q.order("created_at", { ascending: false });
      if (searchParams.sort === "price_asc") q = q.order("price", { ascending: true });
      if (searchParams.sort === "price_desc") q = q.order("price", { ascending: false });

      const { data, error } = await q.limit(60);
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
  }, [searchParams]);

  const updateSearch = (newParams: Partial<SearchParams>) => {
    navigate({
      to: "/search",
      search: (prev) => ({ ...prev, ...newParams }),
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="container mx-auto px-4 lg:px-8 py-6 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Filters */}
        <aside className="w-full md:w-[260px] shrink-0 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">Filters</h2>
            <button
              onClick={() => navigate({ to: "/search", search: {} })}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800">Category</label>
            <Select
              value={searchParams.category}
              onValueChange={(val) => updateSearch({ category: val })}
            >
              <SelectTrigger className="w-full bg-white border-slate-200 shadow-none h-11">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="mobiles">Mobiles</SelectItem>
                <SelectItem value="cars">Cars</SelectItem>
                <SelectItem value="bikes">Bikes</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800">Price Range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-11 shadow-sm"
                  value={searchParams.minPrice}
                  onChange={(e) => updateSearch({ minPrice: e.target.value })}
                />
              </div>
              <span className="text-slate-400">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-11 shadow-sm"
                  value={searchParams.maxPrice}
                  onChange={(e) => updateSearch({ maxPrice: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800">Condition</label>
            <div className="space-y-2">
              {[
                { id: "all", label: "All" },
                { id: "like-new", label: "Like New" },
                { id: "good", label: "Good" },
                { id: "fair", label: "Fair" },
                { id: "used", label: "Used" },
              ].map((c) => (
                <label key={c.id} className="flex items-center gap-3 cursor-pointer group py-1">
                  <div className={cn("flex h-5 w-5 items-center justify-center rounded border transition-colors", searchParams.condition === c.id ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white group-hover:border-blue-400")}>
                    {searchParams.condition === c.id && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <input
                    type="radio"
                    className="sr-only"
                    name="condition"
                    value={c.id}
                    checked={searchParams.condition === c.id}
                    onChange={() => updateSearch({ condition: c.id })}
                  />
                  <span className="text-sm text-slate-700 font-medium">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800">Brand</label>
            <input
              type="text"
              placeholder="Search brand..."
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-11 shadow-sm"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800">Location</label>
            <input
              type="text"
              placeholder="e.g. Ahmedabad"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-11 shadow-sm"
              value={searchParams.location}
              onChange={(e) => updateSearch({ location: e.target.value })}
            />
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-lg shadow-sm">
            Apply Filters
          </Button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 capitalize">
                {searchParams.category === "all" ? "All Listings" : searchParams.category}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {listings.length} results found {searchParams.q && `for "${searchParams.q}"`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Sort by:</span>
              <Select
                value={searchParams.sort}
                onValueChange={(val) => updateSearch({ sort: val })}
              >
                <SelectTrigger className="w-[160px] bg-white border-slate-200 h-9 font-semibold text-xs shadow-none">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState onSell={() => navigate({ to: "/sell" })} />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSell }: { onSell: () => void }) {
  return (
    <div className="mx-auto max-w-md mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
        <Search className="h-6 w-6" />
      </div>
      <h3 className="font-display text-xl font-bold text-slate-900">No matching results</h3>
      <p className="mt-1.5 text-sm text-slate-500 mb-6">
        Try adjusting your filters or search terms.
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
