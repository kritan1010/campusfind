import { notFound, redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { ChatView } from "@/components/chat-view";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/inbox/${id}`);
  const { data: membership } = await supabase.from("conversation_members").select("conversation_id").eq("conversation_id", id).eq("user_id", user.id).maybeSingle();
  if (!membership) notFound();
  const [{ data: conversation }, { data: messages }, { data: members }] = await Promise.all([
    supabase.from("conversations").select("id, listing_id").eq("id", id).maybeSingle(),
    supabase.from("messages").select("id, conversation_id, sender_id, body, created_at").eq("conversation_id", id).order("created_at"),
    supabase.from("conversation_members").select("user_id").eq("conversation_id", id),
  ]);
  if (!conversation) notFound();
  const otherId = members?.find((member) => member.user_id !== user.id)?.user_id;
  const { data: other } = otherId ? await supabase.from("profiles").select("display_name").eq("id", otherId).maybeSingle() : { data: null };
  const { data: listing } = conversation.listing_id ? await supabase.from("listings_public").select("title").eq("id", conversation.listing_id).maybeSingle() : { data: null };
  return <main className="board-shell"><BoardHeader /><ChatView conversationId={id} currentUserId={user.id} initialMessages={messages ?? []} otherName={other?.display_name ?? "CampusFind member"} listingTitle={listing?.title} /></main>;
}
