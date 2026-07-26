"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ShareListingButton({ listingId }: { listingId: string; title?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  async function share() {
    const url = `${window.location.origin}/share/${listingId}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Could not share link");
    }
    window.setTimeout(() => setMessage(null), 2200);
  }
  return <button className="secondary-button share-button" type="button" onClick={() => void share()}>{message ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}<span>{message ?? "Copy link"}</span></button>;
}
