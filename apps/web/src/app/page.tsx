import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "./actions";
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
      <header className="topbar">
        <Link href="/" className="wordmark" aria-label="CampusFind home">
          Campus<span>Find</span>
        </Link>
        <div className="topbar-actions">
          <Link className="text-link" href="/onboarding">
            Edit profile
          </Link>
          <form action={signOut}>
            <button className="text-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="welcome-card">
        <div>
          <p className="eyebrow">Community board · foundation live</p>
          <h1>
            Welcome, <em>{profile?.display_name ?? "neighbour"}</em>.
          </h1>
          <p className="lede">
            Your account is ready. Lost-and-found listings arrive in Phase 2;
            for now, your campus map is pinned below.
          </p>
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
          <span className="phase-label">Phase 1</span>
        </div>
        <ZoneList />
      </section>
    </main>
  );
}
