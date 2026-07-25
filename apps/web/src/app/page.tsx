import Link from "next/link";
import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { ZoneList } from "@/components/zone-list";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, college_id")
    .eq("id", user.id)
    .single();

  return (
    <main className="dashboard-shell">
      <BoardHeader />

      <section className="welcome-card">
        <div>
          <p className="eyebrow">Community board · listings live</p>
          <h1>
            Welcome, <em>{profile?.display_name ?? "neighbour"}</em>.
          </h1>
          <p className="lede">
            The board is open. Browse recent reports or pin a lost or found item
            while the trail is still fresh.
          </p>
          <div className="home-actions"><Link className="primary-button" href="/listings">Browse reports</Link><Link className="secondary-button" href="/listings/new">Post an item</Link></div>
        </div>
        <div className="status-stamp" aria-label="Account verified">
          Email verified
        </div>
      </section>

      <section className="zones-panel" aria-labelledby="zones-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Pinned places</p>
            <h2 id="zones-heading">Campus zones</h2>
          </div>
          <span className="phase-label">Phase 2</span>
        </div>
        <ZoneList />
      </section>
    </main>
  );
}
