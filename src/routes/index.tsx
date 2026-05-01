import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { useWishlist } from "@/hooks/useWishlist";
import { CATEGORIES } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, ChevronRight, MapPin, Filter } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Sort = "latest" | "price_asc" | "price_desc";

function HomePage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Tables<"listings">[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<Sort>("latest");
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      let q = supabase.from("listings").select("*").eq("status", "active");
      if (appliedSearch.trim()) {
        const term = appliedSearch.trim().replace(/[%,]/g, "");
        q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      if (category !== "all") q = q.eq("category", category as Tables<"listings">["category"]);
      if (location.trim()) q = q.ilike("location", `%${location.trim()}%`);
      if (maxPrice && !Number.isNaN(Number(maxPrice))) q = q.lte("price", Number(maxPrice));
      if (sort === "latest") q = q.order("created_at", { ascending: false });
      if (sort === "price_asc") q = q.order("price", { ascending: true });
      if (sort === "price_desc") q = q.order("price", { ascending: false });

      const { data, error } = await q.limit(60);
      if (!active) return;
      if (error) { console.error(error); setListings([]); } 
      else { setListings(data ?? []); }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [appliedSearch, category, location, maxPrice, sort]);

  return (
    <div className="min-h-screen bg-[#f2f4f5]">
      {/* Categories Sub-Header */}
      <div className="bg-white border-b border-border/60">
        <div className="container mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto no-scrollbar">
          <button onClick={() => setCategory("all")} className={cn("text-sm font-bold shrink-0 uppercase tracking-wide transition-colors", category === "all" ? "text-primary" : "text-gray-700 hover:text-primary")}>
            All Categories
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => setCategory(c.value)} className={cn("text-sm font-medium shrink-0 transition-colors", category === c.value ? "text-primary font-bold" : "text-gray-600 hover:text-primary")}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero / Banner Area */}
      <div className="container mx-auto px-4 py-8">
        <div className="relative h-48 md:h-64 w-full rounded-md overflow-hidden shadow-sm bg-gradient-to-r from-teal-50 to-white flex items-center px-12 border border-border/40">
           <div className="max-w-lg z-10">
              <h1 className="text-3xl md:text-5xl font-black text-primary leading-tight">Find the best deals <br /> near you</h1>
              <p className="mt-4 text-gray-600 text-sm md:text-base font-medium">Buy and sell everything from used cars to mobile phones.</p>
              <Button onClick={() => navigate({ to: "/sell" })} className="mt-6 rounded-sm bg-primary text-white font-bold h-12 px-8 hover:bg-primary/90">Post an Ad</Button>
           </div>
           <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block opacity-80">
              <img src="https://cdni.iconscout.com/illustration/premium/thumb/online-marketplace-illustration-download-in-svg-png-gif-file-formats--shopping-buying-and-selling-e-commerce-digital-retail-business-strategic-marketing-pack-illustrations-5211824.png" alt="" className="h-64 object-contain" />
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-md shadow-olx border border-border/40">
               <h2 className="text-lg font-black text-primary uppercase tracking-tight flex items-center gap-2 mb-6">
                 <Filter className="h-5 w-5" /> Filters
               </h2>
               
               <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input placeholder="Enter location" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-9 h-11 border-2 focus:ring-primary/20" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Price Range</label>
                    <div className="flex items-center gap-2">
                       <Input type="number" placeholder="Min" className="h-11 border-2" />
                       <span className="text-gray-400">—</span>
                       <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-11 border-2" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Categories</label>
                    <div className="space-y-2">
                       <button onClick={() => setCategory("all")} className={cn("flex w-full items-center justify-between py-1 text-sm transition-colors", category === "all" ? "text-primary font-bold" : "text-gray-600 hover:text-primary")}>
                          All <span><ChevronRight className="h-4 w-4" /></span>
                       </button>
                       {CATEGORIES.map(c => (
                         <button key={c.value} onClick={() => setCategory(c.value)} className={cn("flex w-full items-center justify-between py-1 text-sm transition-colors", category === c.value ? "text-primary font-bold" : "text-gray-600 hover:text-primary")}>
                            {c.label} <span><ChevronRight className="h-4 w-4" /></span>
                         </button>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-black text-primary uppercase tracking-tight">Fresh Recommendations</h2>
               <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400">Sort by:</span>
                  <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                    <SelectTrigger className="w-48 bg-white border-2 h-10 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Newest first</SelectItem>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-md p-20 text-center border-2 border-dashed border-gray-200">
                 <h3 className="text-xl font-bold text-gray-400">No results found</h3>
                 <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {listings.map((l) => (
                    <motion.div key={l.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <ListingCard listing={l} isWishlisted={wishlistIds.has(l.id)} onToggleWishlist={toggleWishlist} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
