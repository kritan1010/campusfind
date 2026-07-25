"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";

export function MagicLinkCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    void (async () => {
      setMessage("Signing you in…");
      const { error } = await createClient().auth.exchangeCodeForSession(code);
      if (error) {
        setMessage("That sign-in link has expired. Request a new code.");
        return;
      }
      router.replace(getSafeNextPath(searchParams.get("next")));
      router.refresh();
    })();
  }, [router, searchParams]);

  return message ? <p className="field-hint" role="status">{message}</p> : null;
}
