"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSafeNextPath } from "@/lib/auth/routes";
import { normalizeEmail, normalizeOtp } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

type VerifyFormProps = { initialEmail: string; initialNextPath: string };

export function VerifyForm({ initialEmail, initialNextPath }: VerifyFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(() =>
    initialEmail ||
    (typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem("campusfind:otp-email") ?? "")),
  );
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const normalizedEmail = normalizeEmail(email);
      const normalizedToken = normalizeOtp(token);
      setPending(true);
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedToken,
        type: "email",
      });
      if (verifyError) throw verifyError;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase
            .from("profiles")
            .select("onboarding_completed_at")
            .eq("id", user.id)
            .single()
        : { data: null };
      const storedNext = sessionStorage.getItem("campusfind:next");
      const nextPath = getSafeNextPath(initialNextPath || storedNext);
      router.replace(profile?.onboarding_completed_at ? nextPath : "/onboarding");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not verify the code.");
      setPending(false);
    }
  }

  return (
    <form className="stacked-form" onSubmit={submit} noValidate>
      <label htmlFor="otp-email">Email address</label>
      <input
        id="otp-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <label htmlFor="otp">Six-digit code</label>
      <input
        className="otp-input"
        id="otp"
        name="otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        value={token}
        onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))}
        aria-invalid={Boolean(error)}
        autoFocus
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Checking code…" : "Verify and continue"}
      </button>
      <button className="secondary-button" type="button" onClick={() => router.push("/login")}>
        Use a different email
      </button>
    </form>
  );
}
