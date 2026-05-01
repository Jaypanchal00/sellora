import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { useWishlist } from "@/hooks/useWishlist";
import { CATEGORIES } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ChevronRight, 
  MapPin, 
  Filter, 
  Car, 
  Smartphone, 
  Home, 
  Laptop, 
  Bike, 
  Tv, 
  ShoppingBag,
  Grid
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero-banner.png";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Sort = "latest" | "price_asc" | "price_desc";

const CATEGORY_ICONS: Record<string, any> = {
  cars: Car,
  mobiles: Smartphone,
  property: Home,
  electronics: Laptop,
  bikes: Bike,
  furniture: Tv,
  fashion: ShoppingBag,
};

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
      <div className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto no-scrollbar">
          <button onClick={() => setCategory("all")} className={cn("text-xs font-black shrink-0 uppercase tracking-widest transition-colors", category === "all" ? "text-primary" : "text-gray-500 hover:text-primary")}>
            All Categories
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => setCategory(c.value)} className={cn("text-xs font-bold shrink-0 uppercase tracking-widest transition-colors", category === c.value ? "text-primary" : "text-gray-400 hover:text-primary")}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Section - Minimalist Style (Theme #1) */}
      <div className="container mx-auto px-4 py-8">
        <div className="relative h-[300px] md:h-[400px] w-full rounded-lg overflow-hidden bg-white shadow-olx flex flex-col md:flex-row items-center justify-between border border-border/40">
           <div className="p-8 md:p-16 z-10 space-y-4 max-w-2xl text-center md:text-left">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-primary leading-tight tracking-tighter">
                Find the best deals <br /> <span className="text-teal-600">near you</span>
              </h1>
              <p className="text-gray-500 text-sm md:text-lg font-medium">Buy and sell everything from used cars to mobile phones.</p>
              <Button onClick={() => navigate({ to: "/sell" })} className="rounded-sm bg-primary text-white font-black uppercase tracking-widest h-12 px-10 hover:bg-primary/90 transition-all">Post an Ad</Button>
           </div>
           <div className="hidden md:block h-full pr-12 lg:pr-24">
              <img src={heroImg} alt="" className="h-full w-full object-contain" />
           </div>
           
           {/* Mobile Background Decoration */}
           <div className="absolute inset-0 -z-10 md:hidden bg-gradient-to-b from-teal-50 to-white" />
        </div>
      </div>

      {/* Main Browse Section */}
      <div className="container mx-auto px-4 pb-20">
        {/* Quick Category Icons (Theme #1 style) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-lg font-black text-primary uppercase tracking-widest">Browse Categories</h2>
             <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">View all</button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
             {CATEGORIES.slice(0, 7).map((c) => {
               const Icon = CATEGORY_ICONS[c.value] || Grid;
               return (
                 <button 
                   key={c.value} 
                   onClick={() => setCategory(c.value)}
                   className={cn(
                     "flex flex-col items-center gap-3 p-6 rounded-lg border transition-all hover:shadow-md",
                     category === c.value ? "bg-primary text-white border-primary" : "bg-white text-primary border-border/60"
                   )}
                 >
                   <Icon className="h-8 w-8" />
                   <span className="text-xs font-black uppercase tracking-widest text-center">{c.label}</span>
                 </button>
               );
             })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-olx border border-border/40">
               <h2 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 mb-8 border-b pb-4">
                 <Filter className="h-4 w-4" /> Filters
               </h2>
               
               <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input placeholder="Search location" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-10 h-12 border-2 border-gray-100 rounded-sm focus:border-primary transition-all font-bold text-sm" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Categories</label>
                    <div className="space-y-1">
                       <button onClick={() => setCategory("all")} className={cn("flex w-full items-center justify-between py-2 px-2 rounded-sm text-xs font-bold transition-all", category === "all" ? "bg-teal-50 text-primary" : "text-gray-600 hover:bg-gray-50")}>
                          All Categories <span><ChevronRight className="h-3 w-3" /></span>
                       </button>
                       {CATEGORIES.map(c => (
                         <button key={c.value} onClick={() => setCategory(c.value)} className={cn("flex w-full items-center justify-between py-2 px-2 rounded-sm text-xs font-bold transition-all", category === c.value ? "bg-teal-50 text-primary" : "text-gray-600 hover:bg-gray-50")}>
                            {c.label} <span><ChevronRight className="h-3 w-3" /></span>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Price Range</label>
                    <div className="flex items-center gap-2">
                       <Input type="number" placeholder="Min" className="h-12 border-2 border-gray-100 rounded-sm" />
                       <span className="text-gray-300">—</span>
                       <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-12 border-2 border-gray-100 rounded-sm" />
                    </div>
                  </div>
               </div>
            </div>
          </aside>

          {/* Listings Area */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Fresh Recommendations</h2>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort by:</span>
                  <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                    <SelectTrigger className="w-48 bg-white border-2 border-gray-100 h-11 font-black uppercase tracking-widest text-[10px]">
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
              <div className="bg-white rounded-lg p-24 text-center border-2 border-dashed border-gray-200">
                 <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-8 w-8 text-gray-300" />
                 </div>
                 <h3 className="text-xl font-black text-primary uppercase">No results found</h3>
                 <p className="text-gray-400 text-sm mt-2 font-medium">Try different filters or search terms.</p>
                 <Button onClick={() => { setCategory("all"); setAppliedSearch(""); setLocation(""); }} variant="outline" className="mt-6 rounded-sm border-primary text-primary font-black uppercase tracking-widest px-8">Clear all filters</Button>
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
            
            {!loading && listings.length > 0 && (
              <div className="mt-12 text-center">
                 <Button variant="outline" className="rounded-sm border-2 border-primary text-primary font-black uppercase tracking-widest px-12 h-12 hover:bg-primary hover:text-white transition-all">Load More</Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
