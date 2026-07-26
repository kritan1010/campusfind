import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function SharedListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(`/listings/${id}`);
  const { data } = await supabase.rpc("get_shared_listing_preview", { p_listing_id: id });
  const listing = data?.[0];
  if (!listing) return <main className="share-preview-shell"><section className="share-preview-card"><p className="eyebrow">CampusFind</p><h1>This report is no longer available.</h1><Link className="primary-button" href="/login">Sign in to CampusFind</Link></section></main>;
  return <main className="share-preview-shell"><section className={`share-preview-card ${listing.kind}`}><div className="share-preview-brand">Campus<span>Find</span></div><p className="eyebrow">Shared {listing.kind} report</p><h1>{listing.title}</h1><div className="share-preview-meta"><span>{listing.category.replaceAll("_", " ")}</span><span>{listing.status.replaceAll("_", " ")}</span><span>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${listing.event_date}T00:00:00`))}</span></div><div className="share-preview-lock"><LockKeyhole size={17} /><span>Sign in to see the full report, campus place, photos, and actions.</span></div><Link className="primary-button share-preview-cta" href={`/login?next=/listings/${listing.id}`}><span>Open full report</span><ArrowRight size={16} /></Link><p className="share-preview-note"><MapPin size={14} /> Location and contact details are never shown on shared previews.</p></section></main>;
}
