"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setPending(true);
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setPending(false);
    }
  }

  return <div className="stacked-form">
    <p className="field-hint">Use your Google account to join the CampusFind board.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="google-button" type="button" onClick={() => void signInWithGoogle()} disabled={pending}>
      <span aria-hidden="true">G</span>{pending ? "Opening Google…" : "Continue with Google"}
    </button>
  </div>;
}
