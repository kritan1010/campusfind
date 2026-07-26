import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { BoardHeader } from "@/components/board-header";
import { categoryLabel } from "@/lib/listings/validation";
import { createClient } from "@/lib/supabase/server";
import { ShareListingButton } from "@/components/share-listing-button";
import { closeListing, confirmHandover, deleteListing, startConversation } from "../actions";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase.from("listings_public").select("id, poster_id, kind, status, title, description, category, colour, brand, model, event_date, zone_id, created_at").eq("id", id).maybeSingle();
  if (!listing?.id || !listing.poster_id || !listing.kind || !listing.status || !listing.title || !listing.description || !listing.category || !listing.event_date) notFound();
  const isPoster = listing.poster_id === user.id;
  const [imagesResult, attributesResult, zoneResult, posterResult, locationResult, acceptedClaimResult] = await Promise.all([
    supabase.from("listing_images").select("id, storage_path, position").eq("listing_id", id).order("position"),
    supabase.from("item_attributes").select("key, value").eq("listing_id", id),
    listing.zone_id ? supabase.from("campus_zones").select("name").eq("id", listing.zone_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("profiles").select("display_name").eq("id", listing.poster_id).maybeSingle(),
    isPoster ? supabase.rpc("get_listing_exact_location", { p_listing_id: id }) : Promise.resolve({ data: null }),
    supabase.from("claims").select("id, claimant_id").eq("listing_id", id).eq("status", "accepted").maybeSingle(),
  ]);
  const location = locationResult.data?.[0];
  const attributes = attributesResult.data ?? [];

  return <main className="board-shell"><BoardHeader /><article className={`case-file ${listing.kind}`}>
    <div className="case-share-action"><ShareListingButton listingId={id} title={listing.title} /></div>
    <header className="case-header"><div><p className="eyebrow">Case file · {listing.id.slice(0, 8)}</p><div className="evidence-row"><span className={`kind-label ${listing.kind}`}>{listing.kind}</span><span>{listing.status.replaceAll("_", " ")}</span></div><h1>{listing.title}</h1><p>Reported by {posterResult.data?.display_name ?? "a CampusFind member"}</p></div><div className="owner-actions">{isPoster ? <><Link className="secondary-button" href={`/listings/${id}/edit`}>Edit report</Link><Link className="secondary-button" href={`/listings/${id}/matches`}>View matches</Link>{listing.kind === "found" && <Link className="secondary-button" href={`/listings/${id}/claims`}>Review claims</Link>}{listing.status === "open" && <form action={closeListing}><input type="hidden" name="listingId" value={id} /><button className="secondary-button" type="submit">Close listing</button></form>}<form action={deleteListing}><input type="hidden" name="listingId" value={id} /><button className="danger-button" type="submit">Delete</button></form></> : <><form action={startConversation}><input type="hidden" name="listingId" value={id} /><input type="hidden" name="otherUserId" value={listing.poster_id} /><button className="secondary-button icon-button" type="submit"><MessageCircle size={16} aria-hidden="true" />Message</button></form>{listing.kind === "found" && listing.status === "open" && <Link className="primary-button" href={`/listings/${id}/claim`}>This is mine</Link>}</>}{acceptedClaimResult.data && (isPoster || acceptedClaimResult.data.claimant_id === user.id) && <form action={confirmHandover}><input type="hidden" name="claimId" value={acceptedClaimResult.data.id} /><input type="hidden" name="listingId" value={id} /><button className="primary-button" type="submit">Confirm handover</button></form>}</div></header>
    <div className="case-grid"><section><div className="case-gallery">{(imagesResult.data ?? []).map((image) => <Image key={image.id} src={supabase.storage.from("listing-images").getPublicUrl(image.storage_path).data.publicUrl} alt={`Photo of ${listing.title}`} width={900} height={680} />)}</div></section><aside className="case-notes"><p className="section-kicker">Recorded details</p><dl><div><dt>Category</dt><dd>{categoryLabel(listing.category)}</dd></div><div><dt>Date {listing.kind}</dt><dd>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${listing.event_date}T00:00:00`))}</dd></div><div><dt>Approximate zone</dt><dd>{zoneResult.data?.name ?? "Campus zone"}</dd></div>{listing.colour && <div><dt>Colour</dt><dd>{listing.colour}</dd></div>}{listing.brand && <div><dt>Brand</dt><dd>{listing.brand}</dd></div>}{listing.model && <div><dt>Model</dt><dd>{listing.model}</dd></div>}</dl>{isPoster && <div className="private-pin"><strong>Private exact pin</strong><p>{location?.exact_lat != null && location?.exact_lng != null ? `${location.exact_lat}, ${location.exact_lng}` : "No exact pin recorded."}</p><small>Only you received this coordinate payload.</small></div>}</aside></div>
    <section className="case-description"><p className="section-kicker">Statement</p><p>{listing.description}</p>{attributes.length > 0 && <div className="keyword-list">{attributes.map((attribute) => <span key={`${attribute.key}-${attribute.value}`}>{attribute.value}</span>)}</div>}</section>
  </article></main>;
}
