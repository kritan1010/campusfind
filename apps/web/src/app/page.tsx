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

  if (!user) redirect("/login");

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
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-[var(--found)] bg-[var(--found)]/10 px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest text-[var(--found)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Community board · Live active</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[var(--ink)] leading-none">
              Welcome, <em className="text-[var(--found)] font-normal">{profile?.display_name ?? "neighbour"}</em>.
            </h1>

            <p className="lede text-base sm:text-lg text-[var(--muted-ink)] leading-relaxed max-w-xl">
              The board is open. Browse recent reports or pin a lost or found item while the trail is fresh.
            </p>

            <div className="home-actions pt-2 flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs hover:bg-black transition-all hover:scale-[1.02] active:scale-95"
                href="/listings"
              >
                <Compass className="h-4 w-4" />
                <span>Browse reports</span>
              </Link>
              <Link
                className="inline-flex items-center gap-2 border border-[var(--found)] bg-[var(--found)] px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#23533d] transition-all hover:scale-[1.02] active:scale-95"
                href="/listings/new"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Post an item</span>
              </Link>
              {profile?.is_admin && (
                <Link
                  className="inline-flex items-center gap-2 border border-[var(--manila-dark)] bg-[var(--manila)] px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)] shadow-xs hover:bg-[var(--manila-dark)] hover:text-white transition-all hover:scale-[1.02] active:scale-95"
                  href="/admin"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Manage campus</span>
                </Link>
              )}
            </div>
          </div>

          <div className="status-stamp inline-flex items-center gap-2 border border-[var(--found)] bg-[var(--paper)] px-4 py-2.5 shadow-xs font-mono text-xs font-bold uppercase tracking-wider text-[var(--found)] shrink-0">
            <CheckCircle2 className="h-4 w-4" />
            <span>Account Verified</span>
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
