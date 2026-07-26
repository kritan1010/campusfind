import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { OnboardingForm } from "@/components/onboarding-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const [{ data: profile }, { data: colleges }] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, college_id, onboarding_completed_at").eq("id", user.id).single(),
    supabase.from("colleges").select("id, name").eq("status", "approved").order("name"),
  ]);
  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  return (
    <main className="board-shell form-page">
      <BoardHeader />
      <header className="form-page-heading">
        <p className="eyebrow">Your profile</p>
        <h1>Keep your place <em>current.</em></h1>
        <p>Choose the community and visibility preferences that shape your CampusFind experience.</p>
      </header>
      <section className="form-paper">
        <OnboardingForm
          mode="profile"
          colleges={colleges ?? []}
          initialAvatarUrl={profile.avatar_url ?? ""}
          initialCollegeId={profile.college_id ?? null}
          initialDisplayName={profile.display_name ?? user.email?.split("@")[0] ?? ""}
        />
      </section>
    </main>
  );
}
