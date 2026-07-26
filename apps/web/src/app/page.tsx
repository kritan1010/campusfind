import Link from "next/link";
import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { ZoneList } from "@/components/zone-list";
import { createClient } from "@/lib/supabase/server";
import { Compass, PlusCircle, ShieldCheck, CheckCircle2, MapPin, Sparkles } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="landing-page">
        <nav className="landing-nav" aria-label="Landing page navigation">
          <Link className="landing-wordmark" href="/">CampusFind</Link>
          <Link className="landing-login" href="/login">Sign in</Link>
        </nav>
        <section className="landing-hero">
          <div className="landing-copy">
            <p className="eyebrow">The campus return board</p>
            <h1>Lost something?<br /><em>Find your way back.</em></h1>
            <p>CampusFind helps students report lost and found items, discover nearby matches, and return things safely without exposing private contact details.</p>
            <div className="landing-actions"><Link className="primary-button" href="/login">Get started</Link><Link className="landing-text-link" href="/login">Browse the board <span>→</span></Link></div>
          </div>
          <div className="landing-board" aria-label="CampusFind workflow preview"><div className="landing-board-top"><span>LIVE BOARD</span><span>CampusFind</span></div><div className="landing-note landing-note-lost"><small>LOST · TODAY</small><strong>Blue water bottle</strong><span>Science block · 2 hours ago</span></div><div className="landing-note landing-note-found"><small>FOUND · MATCHED</small><strong>Black notebook</strong><span>Library steps · returned</span></div><div className="landing-route"><span>Post</span><i>→</i><span>Match</span><i>→</i><span>Return</span></div></div>
        </section>
        <section className="landing-points"><article><span>01</span><h2>Report clearly</h2><p>Add a photo, a campus place, and the details that help the right person recognise it.</p></article><article><span>02</span><h2>Match privately</h2><p>Use in-app messages and proof questions without putting your email or phone number on the board.</p></article><article><span>03</span><h2>Return safely</h2><p>Keep the handover simple, visible to the right people, and easy to close when it is done.</p></article></section>
      </main>
    );
  }

  const [{ data: profile }, { data: zones }] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, college_id, is_admin, onboarding_completed_at").eq("id", user.id).single(),
    supabase.from("campus_zones").select("id, name").order("name"),
  ]);
  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  return (
    <main className="dashboard-shell min-h-screen px-4 pb-16 pt-2 max-w-6xl mx-auto space-y-8">
      <BoardHeader isAdmin={profile?.is_admin} />

      {/* Welcome Card Hero */}
      <section className="welcome-card relative overflow-hidden border-2 border-[var(--manila-dark)] bg-[var(--paper-bright)] p-8 sm:p-12 shadow-md">
        <span className="note-pin absolute left-1/2 top-3 -translate-x-1/2 z-20" aria-hidden="true" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mt-2">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-[var(--found)] bg-[var(--found)]/10 px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest text-[var(--found)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Community board · Live active</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[var(--ink)] leading-[1.1] block">
              Welcome, <em className="text-[var(--found)] font-normal not-italic">{profile?.display_name ?? "neighbour"}</em>.
            </h1>

            <p className="lede text-base sm:text-lg text-[var(--muted-ink)] leading-relaxed max-w-xl pt-2">
              The board is open. Browse recent reports or pin a lost or found item while the trail is fresh.
            </p>

            <div className="home-actions pt-2 flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs hover:bg-black transition-all hover:scale-[1.02] active:scale-95"
                href="/listings"
                style={{ color: "#ffffff" }}
              >
                <Compass className="h-4 w-4 text-white" />
                <span className="text-white">Browse reports</span>
              </Link>
              <Link
                className="inline-flex items-center gap-2 border border-[var(--found)] bg-[var(--found)] px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#23533d] transition-all hover:scale-[1.02] active:scale-95"
                href="/listings/new"
                style={{ color: "#ffffff" }}
              >
                <PlusCircle className="h-4 w-4 text-white" />
                <span className="text-white">Post an item</span>
              </Link>
              {profile?.is_admin && (
                <Link
                  className="inline-flex items-center gap-2 border border-[var(--manila-dark)] bg-[var(--manila)] px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)] shadow-xs hover:bg-[var(--manila-dark)] hover:text-white transition-all hover:scale-[1.02] active:scale-95"
                  href="/admin"
                  style={{ color: "var(--ink)" }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Manage campus</span>
                </Link>
              )}
            </div>
          </div>

          <div className="status-stamp inline-flex items-center gap-2 border border-[var(--found)] bg-[var(--paper)] px-4 py-2.5 shadow-xs font-mono text-xs font-bold uppercase tracking-wider text-[var(--found)] shrink-0">
            <CheckCircle2 className="h-4 w-4 text-[var(--found)]" />
            <span className="text-[var(--found)]">Account Verified</span>
          </div>
        </div>
      </section>

      {/* Campus Zones Section */}
      <section className="zones-panel border-2 border-[var(--manila-dark)] bg-[var(--paper-bright)] p-8 shadow-md" aria-labelledby="zones-heading">
        <div className="section-heading flex items-center justify-between pb-4 border-b border-dashed border-[var(--manila-dark)]">
          <div>
            <p className="eyebrow font-mono text-xs uppercase tracking-widest font-bold text-[var(--lost)] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>Pinned places</span>
            </p>
            <h2 id="zones-heading" className="font-serif text-2xl font-bold text-[var(--ink)] mt-1">
              Campus zones
            </h2>
          </div>
          <span className="font-mono text-xs font-bold text-[var(--muted-ink)] border border-[var(--manila-dark)] bg-[var(--paper)] px-3 py-1">
            {zones?.length ?? 0} Locations
          </span>
        </div>
        <ZoneList zones={zones ?? []} />
      </section>
    </main>
  );
}
