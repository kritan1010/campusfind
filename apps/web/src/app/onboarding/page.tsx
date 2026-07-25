import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/onboarding");

  const [{ data: profile }, { data: colleges }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, college_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("colleges")
      .select("id, name")
      .eq("status", "approved")
      .order("name"),
  ]);

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <p className="wordmark">Campus<span>Find</span></p>
        <div className="status-stamp">Profile setup</div>
        <p className="eyebrow">One last pin on the board</p>
        <h1>Choose the community <em>you call home.</em></h1>
        <p className="lede">
          Your choice controls which campus board you see. You can update it
          later, and independent neighbours are welcome too.
        </p>
      </header>
      <section className="onboarding-card">
        <OnboardingForm
          colleges={colleges ?? []}
          initialAvatarUrl={profile?.avatar_url ?? ""}
          initialCollegeId={profile?.college_id ?? null}
          initialDisplayName={profile?.display_name ?? user.email?.split("@")[0] ?? ""}
        />
      </section>
    </main>
  );
}
