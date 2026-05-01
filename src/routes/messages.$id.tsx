import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/messages/$id")({
  component: ChatRoom,
  head: () => ({ meta: [{ title: "Chat — Sellora" }] }),
});

function ChatRoom() {
  const { id: conversationId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [conv, setConv] = useState<Tables<"conversations"> | null>(null);
  const [listing, setListing] = useState<Pick<
    Tables<"listings">,
    "id" | "title" | "images" | "price" | "currency"
  > | null>(null);
  const [other, setOther] = useState<Tables<"profiles"> | null>(null);
  const [messages, setMessages] = useState<Tables<"messages">[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user)
      navigate({ to: "/auth", search: { redirect: `/messages/${conversationId}` } });
  }, [authLoading, user, navigate, conversationId]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data: c } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();
      if (!c || !active) {
        setLoading(false);
        return;
      }
      setConv(c);
      const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
      const [{ data: l }, { data: p }, { data: msgs }] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, images, price, currency")
          .eq("id", c.listing_id)
          .maybeSingle(),
        supabase.from("profiles").select("*").eq("id", otherId).maybeSingle(),
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setListing(l);
      setOther(p);
      setMessages(msgs ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [conversationId, user]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !conv) return;
    const channel = supabase
      .channel(`messages:${conv.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conv.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const msg = payload.new as Tables<"messages">;
            setMessages((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]));
          } else if (payload.eventType === "UPDATE") {
            const msg = payload.new as Tables<"messages">;
            setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conv, user]);

  // Mark messages as read when they appear
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read_at);
    if (unread.length === 0) return;

    const markAsRead = async () => {
      console.log("Marking messages as read:", unread.length);
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in(
          "id",
          unread.map((m) => m.id),
        );
      if (error) {
        console.error("Error marking messages as read:", error);
      } else {
        // Optimistically update local state for faster feedback if we are the recipient
        // though we don't show checkmarks for incoming messages, this keeps the state in sync
        setMessages((prev) => 
          prev.map((m) => unread.find(u => u.id === m.id) ? { ...m, read_at: new Date().toISOString() } : m)
        );
      }
    };
    markAsRead();
  }, [messages, user]);

  // Autoscroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user || !conv) return;
    setSending(true);
    setInput("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: text,
    });
    if (error) {
      toast.error("Couldn't send message");
      setInput(text);
    }
    setSending(false);
  };

  if (authLoading || !user || loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (!conv) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Conversation not found</h1>
        <Link to="/messages" className="mt-4 inline-block text-primary hover:underline">
          ← Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto flex max-w-3xl flex-col px-0 py-0 sm:px-4 sm:py-6"
      style={{ minHeight: "calc(100vh - 4rem)" }}
    >
      <div className="flex flex-1 flex-col overflow-hidden border-border/60 bg-card shadow-card sm:rounded-2xl sm:border">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/60 p-3">
          <Link
            to="/messages"
            className="rounded-full p-2 text-muted-foreground transition-base hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Avatar className="h-10 w-10">
            <AvatarImage src={other?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gradient-brand text-brand-foreground">
              {(other?.full_name ?? "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{other?.full_name ?? "User"}</p>
            {listing && (
              <Link
                to="/listing/$id"
                params={{ id: listing.id }}
                className="truncate text-xs text-muted-foreground hover:text-primary"
              >
                Re: {listing.title}
              </Link>
            )}
          </div>
          {listing?.images?.[0] && (
            <Link to="/listing/$id" params={{ id: listing.id }}>
              <img src={listing.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
            </Link>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-2 overflow-y-auto p-4"
          style={{ maxHeight: "calc(100vh - 16rem)" }}
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Say hi 👋 — start the conversation about this item.
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-soft",
                      mine ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <div
                      className={cn(
                        "mt-1 flex items-center justify-between gap-2 text-[10px]",
                        mine ? "text-brand-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      <span>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {mine && (
                        <span className="flex items-center gap-0.5">
                          {m.read_at ? (
                            <svg className="h-3.5 w-3.5 text-[#3b82f6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L7 17l-5-5" />
                              <path d="M22 10L13 19l-5-5" />
                            </svg>
                          ) : (
                            <svg className="h-3.5 w-3.5 text-brand-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={send} className="flex items-center gap-2 border-t border-border/60 p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message…"
            maxLength={4000}
            className="rounded-full"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !input.trim()}
            className="rounded-full bg-gradient-brand text-brand-foreground shadow-glow"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
