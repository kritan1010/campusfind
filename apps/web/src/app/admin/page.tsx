import { redirect } from "next/navigation";
import Link from "next/link";
import { BoardHeader } from "@/components/board-header";
import { PlaceManager } from "@/components/place-manager";
import { createClient } from "@/lib/supabase/server";
import { addLoyolaAcademy, approveCollege, decideReport } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");
  const [{ data: colleges }, { data: places }, { data: reports }] = await Promise.all([
    supabase.from("colleges").select("id, name, status, created_at").order("created_at", { ascending: false }),
    supabase.from("campus_zones").select("id, name, category, description, centroid_lat, centroid_lng, is_active").order("name"),
    supabase.from("reports").select("id, reason, details, status, listing_id, reported_user_id, created_at").in("status", ["open", "reviewing"]).order("created_at", { ascending: false }),
  ]);
  const pending = (colleges ?? []).filter((college) => college.status === "pending");
  const approved = (colleges ?? []).filter((college) => college.status === "approved");
  const loyola = (colleges ?? []).find((college) => college.name.toLowerCase() === "loyola academy");

  return <main className="board-shell"><BoardHeader /><section className="admin-hero"><p className="eyebrow">Campus operations</p><h1>Keep the board <em>real.</em></h1><p>Review communities, public places, and safety reports from one calm workspace.</p></section><section className="admin-grid"><article className="admin-card"><p className="section-kicker">Pending campuses</p><h2>{pending.length} awaiting approval</h2>{pending.length ? <ul className="admin-list">{pending.map((college) => <li key={college.id}><span>{college.name}</span><form action={approveCollege}><input type="hidden" name="collegeId" value={college.id} /><button className="secondary-button" type="submit">Approve</button></form></li>)}</ul> : <p>No campus requests are waiting.</p>}</article><article className="admin-card"><p className="section-kicker">Active communities</p><h2>{approved.length} approved</h2><ul className="admin-list">{approved.map((college) => <li key={college.id}><span>{college.name}</span><small>Live</small></li>)}</ul></article><article className="admin-card"><p className="section-kicker">Safety queue</p><h2>{reports?.length ?? 0} open reports</h2><p>Review user and listing reports below.</p></article></section><section className="admin-card admin-loyola"><p className="section-kicker">Bootstrap campus</p><h2>Loyola Academy</h2>{loyola?.status === "approved" ? <p><strong className="admin-live">Live</strong> Available in the college picker.</p> : <><p>Make Loyola Academy available in the college picker.</p><form action={addLoyolaAcademy}><button className="primary-button" type="submit">Approve Loyola Academy</button></form></>}</section><PlaceManager places={places ?? []} /><section className="admin-card"><p className="section-kicker">Moderation queue</p><h2>Reports needing attention</h2>{reports?.length ? <ul className="admin-list">{reports.map((report) => <li className="admin-report" key={report.id}><span><strong>{report.reason}</strong><small>{report.details || "No additional detail"}</small></span><form action={decideReport}><input type="hidden" name="reportId" value={report.id} /><select name="status" defaultValue={report.status}><option value="reviewing">Reviewing</option><option value="resolved">Resolve</option><option value="dismissed">Dismiss</option></select><select name="action" defaultValue=""><option value="">No action</option><option value="warn">Warn user</option><option value="suspend_user">Suspend user</option><option value="remove_listing">Remove listing</option></select><button className="secondary-button" type="submit">Save</button></form></li>)}</ul> : <p>No open reports.</p>}</section><Link className="text-link" href="/">← Back to dashboard</Link></main>;
}
