import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type CategoryValue } from "@/lib/format";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sell")({
  component: SellPage,
  head: () => ({ meta: [{ title: "Post a listing — Sellora" }] }),
});

const schema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().min(10, "Description is too short").max(4000),
  price: z.number({ message: "Price must be a number" }).min(0).max(99999999),
  category: z.enum([
    "electronics",
    "vehicles",
    "property",
    "fashion",
    "home",
    "jobs",
    "services",
    "hobbies",
    "other",
  ]),
  location: z.string().trim().min(2).max(120),
});

function SellPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<CategoryValue>("electronics");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/sell" } });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    const filtered = incoming.filter((f) => f.size <= 5 * 1024 * 1024);
    if (filtered.length < incoming.length) toast.warning("Some images were over 5MB and skipped");
    setFiles((prev) => [...prev, ...filtered].slice(0, 6));
    e.target.value = "";
  };

  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      title,
      description,
      price: Number(price),
      category,
      location,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (files.length === 0) {
      toast.error("Please add at least one photo");
      return;
    }
    setSubmitting(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("listings")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("listings").getPublicUrl(path);
        urls.push(data.publicUrl);
      }

      const { data: inserted, error: insErr } = await supabase
        .from("listings")
        .insert({
          seller_id: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          price: parsed.data.price,
          category: parsed.data.category,
          location: parsed.data.location,
          images: urls,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      toast.success("Your listing is live!");
      navigate({ to: "/listing/$id", params: { id: inserted.id } });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't create listing");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold">Post a listing</h1>
        <p className="text-sm text-muted-foreground">Reach thousands of buyers on Sellora.</p>
      </div>

      <Card className="border-border/60 p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos (up to 6)</Label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {previews.map((p, i) => (
                <div
                  key={p}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <img src={p} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 shadow-soft transition-base group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {files.length < 6 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-base hover:border-primary hover:text-foreground">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs font-medium">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onPickFiles}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="iPhone 14 Pro, 256GB, like new"
              maxLength={120}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CategoryValue)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Brooklyn, NY"
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe condition, what's included, why you're selling…"
              maxLength={4000}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gradient-brand text-brand-foreground shadow-glow"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting…
              </>
            ) : (
              "Post listing"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
