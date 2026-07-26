import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { BoardHeader } from "@/components/board-header";
import { createClient } from "@/lib/supabase/server";
import { markNotificationRead } from "./actions";

const labels: Record<string, string> = { new_comment: "Someone commented on your report", new_message: "You have a new private message", match_suggested: "A new possible match was found", claim_received: "Someone submitted a claim", claim_accepted: "A claim was accepted", claim_rejected: "A claim was declined", handover_requested: "A handover is waiting for you", listing_returned: "A listing was marked returned" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");
  const { data: notifications } = await supabase.from("notifications").select("id, kind, payload, read_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  return <main className="board-shell"><BoardHeader /><header className="form-page-heading"><p className="eyebrow"><Bell size={14} /> Your updates</p><h1>Signals from the <em>board.</em></h1><p>Comments, matches, claims, and private messages in one place.</p></header><section className="notification-list">{notifications?.length ? notifications.map((notification) => <article className={`notification-row ${notification.read_at ? "read" : "unread"}`} key={notification.id}><div><strong>{labels[notification.kind] ?? "CampusFind update"}</strong><time dateTime={notification.created_at}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.created_at))}</time></div>{!notification.read_at && <form action={markNotificationRead}><input type="hidden" name="id" value={notification.id} /><button className="text-button" type="submit">Mark read</button></form>}</article>) : <div className="empty-board"><p className="eyebrow">All caught up</p><h2>No updates yet.</h2><p>New activity will appear here.</p></div>}</section></main>;
}
