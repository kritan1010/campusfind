import Link from "next/link";
import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { createClient } from "@/lib/supabase/server";

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/inbox");
  const { data: memberships } = await supabase.from("conversation_members").select("conversation_id, last_read_at").eq("user_id", user.id);
  const ids = memberships?.map((item) => item.conversation_id) ?? [];
  const { data: conversations } = ids.length ? await supabase.from("conversations").select("id, listing_id, created_at").in("id", ids).order("created_at", { ascending: false }) : { data: [] };
  const listingIds = conversations?.flatMap((item) => item.listing_id ? [item.listing_id] : []) ?? [];
  const { data: listings } = listingIds.length ? await supabase.from("listings_public").select("id, title").in("id", listingIds) : { data: [] };
  const listingMap = new Map((listings ?? []).map((listing) => [listing.id, listing.title]));
  return <main className="board-shell"><BoardHeader /><header className="form-page-heading"><p className="eyebrow">Your inbox</p><h1>Keep the return <em>moving.</em></h1><p>Private conversations keep email and phone numbers off the board.</p></header><section className="inbox-list">{conversations?.length ? conversations.map((conversation) => <Link className="inbox-row" href={`/inbox/${conversation.id}`} key={conversation.id}><div><p className="section-kicker">Private thread</p><h2>{listingMap.get(conversation.listing_id ?? "") ?? "CampusFind conversation"}</h2></div><span>Open →</span></Link>) : <div className="empty-board"><p className="eyebrow">Inbox clear</p><h2>No private threads yet.</h2><p>Message the poster on a listing when you need to arrange a return.</p></div>}</section></main>;
}
