/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Search, SlidersHorizontal, Sparkles, Mic } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<Sort>("latest");
  const [isListening, setIsListening] = useState(false);
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Your browser doesn't support voice search.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setAppliedSearch(transcript);
      toast.success(`Searching for "${transcript}"`);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

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
  }, [appliedSearch, category, location, maxPrice, sort]);

  const featured = useMemo(() => listings.slice(0, 4), [listings]);

  return (
    <div className="min-h-screen pb-20">
      {/* HERO */}
      <section className="relative overflow-hidden py-16 md:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold text-primary backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4" /> Welcome to the new standard of local commerce
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-6 font-display text-4xl font-black leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
            >
              Buy, Sell, <span className="text-gradient-brand">Connect.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-xl leading-relaxed"
            >
              Sellora is the most beautiful way to discover great deals near you and chat with
              sellers instantly.
            </motion.p>

            {/* Search bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAppliedSearch(search);
              }}
              className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full border border-border/80 bg-background/80 p-1.5 shadow-xl backdrop-blur-xl ring-1 ring-black/5"
            >
              <div className="flex flex-1 items-center gap-3 px-4">
                <Search className="h-5 w-5 text-primary" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search iPhones, sofas, cars…"
                  className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`p-2.5 rounded-full transition-all ${isListening ? "bg-red-500/20 text-red-500 animate-pulse scale-110" : "hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105"}`}
                  aria-label="Voice Search"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
              <Button
                type="submit"
                size="lg"
                className="rounded-full bg-primary px-8 text-base font-bold text-primary-foreground shadow-glow hover:scale-105 transition-transform"
              >
                Search
              </Button>
            </form>
          </motion.div>

          {/* Category chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center justify-center gap-3"
          >
            <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
              <span className="text-xl">✨</span> All
            </CategoryChip>
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c.value}
                active={category === c.value}
                onClick={() => setCategory(c.value)}
              >
                <span className="text-xl">{c.emoji}</span> {c.label}
              </CategoryChip>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-surface/50 py-16">
        <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 text-center">
          <h2 className="mb-10 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
            How Sellora Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-col items-center p-8 bg-background rounded-[2rem] border border-border/40 shadow-xl"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary text-4xl mb-6 shadow-sm">
                1
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Create an Account</h3>
              <p className="text-muted-foreground text-sm">
                Sign up in seconds and build your verified profile to gain buyer trust.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center p-8 bg-background rounded-[2rem] border border-border/40 shadow-xl"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary text-4xl mb-6 shadow-sm">
                2
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">Post your Listing</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Snap a few photos, set a price, and publish your ad instantly for free.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col items-center p-8 bg-background rounded-[2rem] border border-border/40 shadow-xl"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary text-4xl mb-6 shadow-sm">
                3
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">Chat & Sell</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Negotiate securely via real-time chat and close the deal locally.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 mt-12">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-background/50 p-4 shadow-lg backdrop-blur-xl md:flex-row md:items-center">
          <div className="flex items-center gap-2 px-4 text-lg font-bold text-foreground">
            <SlidersHorizontal className="h-5 w-5 text-primary" /> Filters
          </div>
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="md:max-w-[200px] rounded-xl bg-background border-border/60 py-5 px-4 text-base"
          />
          <Input
            placeholder="Max price"
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="md:max-w-[160px] rounded-xl bg-background border-border/60 py-5 px-4 text-base"
          />
          <div className="flex-1" />
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="md:max-w-[200px] rounded-xl bg-background border-border/60 py-5 px-4 text-base font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="latest">Newest first</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* GRID */}
      <section className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState onSell={() => navigate({ to: "/sell" })} />
        ) : (
          <>
            {featured.length > 0 &&
              appliedSearch === "" &&
              category === "all" &&
              !location &&
              !maxPrice && (
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold">Recommended for you</h2>
                  <Link to="/" className="text-sm font-medium text-primary hover:underline">
                    See all
                  </Link>
                </div>
              )}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {listings.map((l) => (
                  <motion.div
                    key={l.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <ListingCard
                      listing={l}
                      isWishlisted={wishlistIds.has(l.id)}
                      onToggleWishlist={toggleWishlist}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </section>
    </div>
  );
}

function CategoryChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "border-border/40 bg-background text-foreground shadow-sm hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ onSell }: { onSell: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-2xl text-brand-foreground shadow-glow">
        🔎
      </div>
      <h3 className="font-display text-xl font-bold">No listings yet</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Try adjusting your filters, or be the first to post something amazing.
      </p>
      <Button
        onClick={onSell}
        className="mt-5 rounded-full bg-gradient-brand text-brand-foreground shadow-glow"
      >
        Post a listing
      </Button>
    </div>
  );
}
