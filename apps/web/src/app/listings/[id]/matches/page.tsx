import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { createClient } from "@/lib/supabase/server";
import { dismissMatch } from "../../actions";

export default async function MatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: listing } = await supabase.from("listings_public").select("id, poster_id, kind, title").eq("id", id).eq("poster_id", user.id).maybeSingle();
  if (!listing?.id || !listing.poster_id || !listing.kind) notFound();
  const column = listing.kind === "lost" ? "lost_listing_id" : "found_listing_id";
  const { data: matches } = await supabase.from("match_suggestions").select("id, lost_listing_id, found_listing_id, score, dismissed_by_lost_poster, dismissed_by_found_poster").eq(column, id).order("score", { ascending: false });
  const visible = (matches ?? []).filter((match) => listing.kind === "lost" ? !match.dismissed_by_lost_poster : !match.dismissed_by_found_poster);
  const otherIds = visible.map((match) => listing.kind === "lost" ? match.found_listing_id : match.lost_listing_id);
  const { data: others } = otherIds.length ? await supabase.from("listings_public").select("id, title, category, description").in("id", otherIds) : { data: [] };
  const byId = new Map((others ?? []).flatMap((item) => item.id ? [[item.id, item]] : []));
  return <main className="board-shell"><BoardHeader /><section className="case-file"><p className="eyebrow">Automatic leads</p><h1>Potential matches for {listing.title}</h1>{visible.length ? <div className="match-list">{visible.map((match) => { const otherId = listing.kind === "lost" ? match.found_listing_id : match.lost_listing_id; const other = byId.get(otherId); return <article className="match-card" key={match.id}><span className="score-stamp">{Math.round(match.score * 100)}% match</span><h2>{other?.title ?? "Listing unavailable"}</h2><p>{other?.description}</p><div><Link className="secondary-button" href={`/listings/${otherId}`}>Open listing</Link><form action={dismissMatch}><input type="hidden" name="matchId" value={match.id} /><input type="hidden" name="listingId" value={id} /><input type="hidden" name="side" value={listing.kind ?? "lost"} /><button className="location-button" type="submit">Dismiss lead</button></form></div></article>; })}</div> : <p>No strong matches yet. New compatible reports will be added automatically.</p>}</section></main>;
}
