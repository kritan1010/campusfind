"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { normalizeEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const normalizedEmail = normalizeEmail(email);
      setPending(true);
      const { error: authError } = await createClient().auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true },
      });
      if (authError) throw authError;

      sessionStorage.setItem("campusfind:otp-email", normalizedEmail);
      sessionStorage.setItem("campusfind:next", nextPath);
      const query = new URLSearchParams({ email: normalizedEmail, next: nextPath });
      router.push(`/login/verify?${query.toString()}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send the code.");
      setPending(false);
    }
  }

  return (
    <form className="stacked-form" onSubmit={submit} noValidate>
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.edu"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-describedby={error ? "login-error" : "email-hint"}
        aria-invalid={Boolean(error)}
        autoFocus
      />
      <p className="field-hint" id="email-hint">
        Any email works—an institutional address is not required.
      </p>
      {error && (
        <p className="form-error" id="login-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Sending code…" : "Email me a sign-in code"}
      </button>
    </form>
  );
}
