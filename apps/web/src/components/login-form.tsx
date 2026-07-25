"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { normalizeEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const normalizedEmail = normalizeEmail(email);
      setPending(true);
      if (password) {
        const { error: passwordError } = await createClient().auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (passwordError) throw passwordError;
        router.replace(nextPath);
        router.refresh();
        return;
      }
      const { error: authError } = await createClient().auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          // Hosted Supabase uses this for confirmation/magic-link callbacks.
          // OTP verification itself still happens on the next screen.
          emailRedirectTo: `${window.location.origin}/login/verify?email=${encodeURIComponent(normalizedEmail)}&next=${encodeURIComponent(nextPath)}`,
        },
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

  async function signInWithGoogle() {
    setError(null);
    setPending(true);
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
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
      <label htmlFor="password">Password <span className="field-hint">(demo/admin only)</span></label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Leave blank for a sign-in code"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
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
        {pending ? "Signing in…" : password ? "Sign in with password" : "Email me a sign-in code"}
      </button>
      <div className="auth-divider"><span>or</span></div>
      <button className="google-button" type="button" onClick={() => void signInWithGoogle()} disabled={pending}>
        <span aria-hidden="true">G</span> Continue with Google
      </button>
    </form>
  );
}
