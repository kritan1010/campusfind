import { redirect } from "next/navigation";
import Link from "next/link";
import { BoardHeader } from "@/components/board-header";
import { createClient } from "@/lib/supabase/server";
import { addLoyolaAcademy, approveCollege } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");
  const { data: colleges } = await supabase.from("colleges").select("id, name, status, created_at").order("created_at", { ascending: false });
  const pending = (colleges ?? []).filter((college) => college.status === "pending");
  const approved = (colleges ?? []).filter((college) => college.status === "approved");
  return <main className="board-shell"><BoardHeader />
    <section className="admin-hero"><p className="eyebrow">Campus operations</p><h1>Keep the board <em>real.</em></h1><p>Approve campus communities and keep CampusFind focused on places people actually use.</p></section>
    <section className="admin-grid">
      <article className="admin-card"><p className="section-kicker">Quick setup</p><h2>Loyola Academy</h2><p>Make Loyola Academy available in the college picker.</p><form action={addLoyolaAcademy}><button className="primary-button" type="submit">Add or approve Loyola Academy</button></form></article>
      <article className="admin-card"><p className="section-kicker">Pending review</p><h2>{pending.length} awaiting approval</h2>{pending.length ? <ul className="admin-list">{pending.map((college) => <li key={college.id}><span>{college.name}</span><form action={approveCollege}><input type="hidden" name="collegeId" value={college.id} /><button className="secondary-button">Approve</button></form></li>)}</ul> : <p>No college requests are waiting.</p>}</article>
      <article className="admin-card"><p className="section-kicker">Active communities</p><h2>{approved.length} approved</h2><ul className="admin-list">{approved.map((college) => <li key={college.id}><span>{college.name}</span><small>Live</small></li>)}</ul></article>
    </section><Link className="text-link" href="/">← Back to dashboard</Link>
  </main>;
}
