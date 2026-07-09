import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/messages/")({
  component: MessagesIndex,
  head: () => ({ meta: [{ title: "Messages — Sellora" }] }),
});

interface ConvWithDetails {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  listing: { id: string; title: string; images: string[] } | null;
  other_profile: { id: string; full_name: string | null; avatar_url: string | null } | null;
  last_message: string | null;
  last_message_unread: boolean;
}

function MessagesIndex() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<ConvWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/messages" } });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data: convsData } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (!convsData || !active) {
        setLoading(false);
        return;
      }

      const listingIds = [...new Set(convsData.map((c) => c.listing_id))];
      const otherIds = [
        ...new Set(convsData.map((c) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id))),
      ];

      const [{ data: listings }, { data: profiles }, { data: lastMsgs }] = await Promise.all([
        supabase.from("listings").select("id, title, images").in("id", listingIds),
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds),
        supabase
          .from("messages")
          .select("conversation_id, content, created_at, sender_id, read_at")
          .in(
            "conversation_id",
            convsData.map((c) => c.id),
          )
          .order("created_at", { ascending: false }),
      ]);

      const lastByConv = new Map<string, { content: string; unread: boolean }>();
      lastMsgs?.forEach((m) => {
        if (!lastByConv.has(m.conversation_id)) {
          lastByConv.set(m.conversation_id, {
            content: m.content,
            unread: m.sender_id !== user.id && !m.read_at,
          });
        }
      });

      if (!active) return;
      setConvs(
        convsData.map((c) => ({
          ...c,
          listing: listings?.find((l) => l.id === c.listing_id) ?? null,
          other_profile:
            profiles?.find((p) => p.id === (c.buyer_id === user.id ? c.seller_id : c.buyer_id)) ??
            null,
          last_message: lastByConv.get(c.id)?.content ?? null,
          last_message_unread: lastByConv.get(c.id)?.unread ?? false,
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading || !user)
    return (
      <div className="container mx-auto px-4 py-20 text-center text-slate-500">Loading…</div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6">
      <div className="container mx-auto max-w-4xl px-4 lg:px-8">
        <h1 className="text-[28px] font-extrabold text-slate-900 mb-6">Messages</h1>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-3">
                  <div className="h-12 w-12 animate-pulse rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : convs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-slate-400" />
              <h3 className="font-display text-xl font-bold text-slate-900">No conversations yet</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Tap "Chat with seller" on any listing to start your first conversation.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {convs.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/messages/$id"
                    params={{ id: c.id }}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50"
                  >
                    <Avatar className="h-14 w-14 border border-slate-200">
                      <AvatarImage src={c.other_profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                        {(c.other_profile?.full_name ?? "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold text-slate-900 text-[15px]">
                          {c.other_profile?.full_name ?? "User"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">
                            {formatRelativeTime(c.last_message_at)}
                          </span>
                          {c.last_message_unread && (
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-600 shadow-sm" />
                          )}
                        </div>
                      </div>
                      <p className="truncate text-sm text-slate-500 mt-0.5 font-medium">
                        <span className="text-slate-700 font-semibold">{c.listing?.title ?? "Listing"}</span>
                        {c.last_message ? <> · {c.last_message}</> : null}
                      </p>
                    </div>
                    {c.listing?.images?.[0] && (
                      <img
                        src={c.listing.images[0]}
                        alt=""
                        className="h-14 w-14 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1 hidden sm:block"
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
