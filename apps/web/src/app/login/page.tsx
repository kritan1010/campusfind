import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { getSafeNextPath } from "@/lib/auth/routes";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      step="Ticket 01 · Identify"
      title={<>Find your way <em>back in.</em></>}
      description="We’ll send a one-time code. No password to remember, and no student-only gatekeeping."
    >
      <LoginForm nextPath={getSafeNextPath(next)} />
    </AuthShell>
  );
}
