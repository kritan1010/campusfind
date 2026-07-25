import { AuthShell } from "@/components/auth-shell";
import { VerifyForm } from "@/components/verify-form";
import { getSafeNextPath } from "@/lib/auth/routes";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email = "", next } = await searchParams;

  return (
    <AuthShell
      step="Ticket 02 · Verify"
      title={<>Check your <em>inbox.</em></>}
      description="Enter the six-digit code in the email we just sent. It expires in one hour."
    >
      <VerifyForm initialEmail={email} initialNextPath={getSafeNextPath(next)} />
    </AuthShell>
  );
}
