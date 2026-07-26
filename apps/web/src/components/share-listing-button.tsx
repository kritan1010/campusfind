"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareListingButton({ listingId, title }: { listingId: string; title: string }) {
  const [message, setMessage] = useState<string | null>(null);
  async function share() {
    const url = `${window.location.origin}/share/${listingId}`;
    try {
      if (navigator.share) { await navigator.share({ title: `CampusFind · ${title}`, url }); setMessage("Shared"); }
      else { await navigator.clipboard.writeText(url); setMessage("Link copied"); }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Could not share link");
    }
    window.setTimeout(() => setMessage(null), 2200);
  }
  return <button className="secondary-button share-button" type="button" onClick={() => void share()}>{message ? <Check aria-hidden="true" size={15} /> : <Share2 aria-hidden="true" size={15} />}<span>{message ?? "Share"}</span></button>;
}
