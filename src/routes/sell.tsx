import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/LocationPicker";
import {
  ImagePlus,
  X,
  Loader2,
  MapPin,
  Smartphone,
  Car,
  Bike,
  Tv,
  Truck,
  Home,
  Shirt,
  Dog,
  Briefcase,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sell")({
  component: SellPage,
  head: () => ({ meta: [{ title: "Post Your Ad — Sellora" }] }),
});

const schema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().min(10, "Description is too short").max(4000),
  price: z.number({ message: "Price must be a number" }).min(0).max(99999999),
  category: z.string().min(1, "Select a category"),
  condition: z.string(),
  location: z.string().trim().min(2).max(120),
});

const STEPS = [
  { num: 1, label: "Category" },
  { num: 2, label: "Images" },
  { num: 3, label: "Details" },
  { num: 4, label: "Description" },
  { num: 5, label: "Location" },
  { num: 6, label: "Preview" },
];

const SELL_CATEGORIES = [
  { id: "vehicles", label: "Cars & Bikes", icon: Car },
  { id: "electronics", label: "Mobiles & Tech", icon: Smartphone },
  { id: "property", label: "Property", icon: Home },
  { id: "home", label: "Furniture", icon: Truck },
  { id: "fashion", label: "Fashion", icon: Shirt },
  { id: "hobbies", label: "Pets & Hobbies", icon: Dog },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "services", label: "Services", icon: Wrench },
];

function SellPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>("");
  const [condition, setCondition] = useState<string>("like-new");
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

  const handleSubmit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({
      title,
      description,
      price: Number(price),
      category,
      condition,
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
          category: parsed.data.category as any,
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
      <div className="container mx-auto px-4 py-20 text-center text-slate-500">Loading…</div>
    );
  }

  const canGoNext = () => {
    if (step === 1) return !!category;
    if (step === 2) return files.length > 0;
    if (step === 3) return title.length >= 3 && price.length > 0;
    if (step === 4) return description.length >= 10;
    if (step === 5) return location.length >= 2;
    return true;
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="container mx-auto max-w-4xl px-4 lg:px-8 py-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold text-slate-900">Post Your Ad</h1>
          <p className="text-sm text-slate-500 mt-1">Fill the details to list your item for sale</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                    step === s.num
                      ? "bg-blue-600 border-blue-600 text-white"
                      : step > s.num
                        ? "bg-blue-100 border-blue-600 text-blue-600"
                        : "bg-white border-slate-300 text-slate-400",
                  )}
                >
                  {s.num}
                </div>
                <span
                  className={cn(
                    "text-[11px] sm:text-xs font-semibold hidden sm:block text-center",
                    step >= s.num ? "text-slate-900" : "text-slate-400",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 -mt-5",
                    step > s.num ? "bg-blue-600" : "bg-slate-200",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm min-h-[400px]">
          {/* Step 1: Category */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Select Category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {SELL_CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const isSelected = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 rounded-xl p-5 transition-all border-2",
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-slate-100 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50",
                      )}
                    >
                      <Icon className="h-8 w-8" strokeWidth={1.5} />
                      <span className="text-sm font-semibold">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Images */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Upload Images</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {files.length < 6 && (
                  <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-sm font-bold">Add Photos</span>
                    <span className="text-xs font-medium opacity-80">Max 6 images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={onPickFiles}
                    />
                  </label>
                )}
                {previews.map((p, i) => (
                  <div
                    key={p}
                    className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    <img src={p} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 shadow transition-all group-hover:opacity-100 hover:bg-black"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Item Details</h2>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-bold text-slate-800">
                  Ad Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro Max 256GB"
                  maxLength={120}
                  className="h-12 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-bold text-slate-800">
                  Price (₹)
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="h-12 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-800">Condition</Label>
                <div className="flex flex-wrap gap-3">
                  {["New", "Like New", "Good", "Fair", "Used"].map((c) => {
                    const val = c.toLowerCase().replace(" ", "-");
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition(val)}
                        className={cn(
                          "px-5 py-2 rounded-full text-sm font-bold border transition-colors",
                          condition === val
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300",
                        )}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Description */}
          {step === 4 && (
            <div className="max-w-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Description</h2>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="Include condition, features and reason for selling..."
                maxLength={4000}
                className="bg-slate-50 border-slate-200 resize-none"
              />
            </div>
          )}

          {/* Step 5: Location */}
          {step === 5 && (
            <div className="max-w-lg w-full">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Your Location</h2>
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          )}

          {/* Step 6: Preview */}
          {step === 6 && (
            <div className="max-w-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Review Your Ad</h2>
              <div className="space-y-4 text-sm">
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-24">Category:</span>
                  <span className="text-slate-900 capitalize">{category}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-24">Title:</span>
                  <span className="text-slate-900">{title}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-24">Price:</span>
                  <span className="text-slate-900 font-bold">₹{Number(price).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-24">Condition:</span>
                  <span className="text-slate-900 capitalize">{condition.replace("-", " ")}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-24">Location:</span>
                  <span className="text-slate-900">{location}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-24">Images:</span>
                  <span className="text-slate-900">{files.length} photo(s)</span>
                </div>
                {previews.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {previews.map((p) => (
                      <img key={p} src={p} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                    ))}
                  </div>
                )}
                <p className="text-slate-500 mt-4">{description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 1) navigate({ to: "/" });
              else setStep(step - 1);
            }}
            className="rounded-lg px-8 py-6 border-slate-300 text-slate-700 font-bold"
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 6 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              className="rounded-lg px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Posting…
                </>
              ) : (
                "Post Ad"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
