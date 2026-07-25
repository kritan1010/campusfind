import { notFound, redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { createClient } from "@/lib/supabase/server";
import { submitClaim } from "../../actions";

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: listing }, { data: questions }] = await Promise.all([
    supabase.from("listings_public").select("id, poster_id, kind, status, title").eq("id", id).maybeSingle(),
    supabase.rpc("get_proof_questions_for_claim", { p_listing_id: id }),
  ]);
  if (!listing?.id || listing.kind !== "found" || listing.status !== "open" || listing.poster_id === user.id || !questions?.length) notFound();
  return <main className="board-shell form-page"><BoardHeader /><header className="form-page-heading"><p className="eyebrow">Private verification</p><h1>Help prove it is <em>yours</em>.</h1><p>Answer these questions from memory. The finder will review your answers privately.</p></header><section className="form-paper"><form className="listing-form" action={submitClaim}><input type="hidden" name="listingId" value={id} />{questions.map((question) => <label key={question.question_id}>{question.question}<textarea name={`answer:${question.question_id}`} required minLength={1} maxLength={1000} rows={3} /></label>)}<button className="primary-button" type="submit">Submit private answers</button></form></section></main>;
}
