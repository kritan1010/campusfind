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
      description="Use Google to sign in securely. No passwords or email codes to manage."
    >
      <LoginForm nextPath={getSafeNextPath(next)} />
    </AuthShell>
  );
}
