import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Phone, Video, Paperclip, Mic } from "lucide-react";
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
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in(
          "id",
          unread.map((m) => m.id),
        );
      if (error) {
        // Silent fail in production
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            unread.find((u) => u.id === m.id) ? { ...m, read_at: new Date().toISOString() } : m,
          ),
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
        <Link to="/messages" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6">
      <div className="container mx-auto max-w-4xl px-4 lg:px-8 h-[80vh] flex flex-col">
        <div className="flex flex-1 flex-col overflow-hidden bg-white shadow-sm border border-slate-200 rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <Link
                to="/messages"
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={other?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                    {(other?.full_name ?? "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div>
                <p className="font-bold text-slate-900">{other?.full_name ?? "User"}</p>
                <p className="text-xs text-slate-500 font-medium">Online</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
                <Video className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Listing Banner */}
          {listing && (
            <div className="flex items-center justify-between bg-slate-50 p-3 px-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt="" className="h-12 w-12 rounded bg-white object-contain p-1 border border-slate-200" />
                ) : (
                  <div className="h-12 w-12 rounded bg-slate-200 flex items-center justify-center text-lg">📦</div>
                )}
                <div>
                  <p className="font-bold text-slate-900 text-sm">{listing.title}</p>
                  <p className="text-sm font-bold text-slate-700">₹{listing.price.toLocaleString()}</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full text-xs font-bold border-slate-300">
                <Link to="/listing/$id" params={{ id: listing.id }}>View Ad</Link>
              </Button>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto p-4 bg-slate-50/50"
          >
            <div className="text-center my-4">
              <span className="text-xs font-medium bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Today</span>
            </div>

            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                Say hi 👋 — start the conversation about this item.
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-[15px] shadow-sm",
                        mine 
                          ? "bg-[#05c46b] text-white rounded-br-sm" 
                          : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <div
                        className={cn(
                          "mt-1 flex items-center justify-end gap-1 text-[11px]",
                          mine ? "text-white/80" : "text-slate-400",
                        )}
                      >
                        <span>
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {mine && (
                          <span
                            className="flex items-center gap-0.5"
                            title={m.read_at ? "Seen" : "Sent"}
                          >
                            {m.read_at ? (
                              <svg
                                className="h-3.5 w-3.5 text-white drop-shadow-sm"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 6L7 17l-5-5" />
                                <path d="M22 10L13 19l-5-5" />
                              </svg>
                            ) : (
                              <svg
                                className="h-3 w-3 text-white/60"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
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
          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={send} className="flex items-center gap-3 bg-slate-100 rounded-full px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-colors border border-transparent focus-within:border-blue-200">
              <Button type="button" variant="ghost" size="icon" className="text-slate-500 rounded-full hover:bg-slate-200 shrink-0 h-9 w-9">
                <Paperclip className="h-5 w-5" />
              </Button>
              
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                maxLength={4000}
                className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 px-0 text-[15px] h-10"
              />
              
              <Button type="button" variant="ghost" size="icon" className="text-slate-500 rounded-full hover:bg-slate-200 shrink-0 h-9 w-9">
                <Mic className="h-5 w-5" />
              </Button>

              <Button
                type="submit"
                size="icon"
                disabled={sending || !input.trim()}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0 h-10 w-10 transition-colors"
                aria-label="Send"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
