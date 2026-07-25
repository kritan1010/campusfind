import { notFound, redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { createClient } from "@/lib/supabase/server";
import { decideClaim } from "../../actions";

export default async function ClaimsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const [{ data: listing }, { data: questions }, { data: claims }] = await Promise.all([
    supabase.from("listings_public").select("id, poster_id, title, kind, status").eq("id", id).eq("poster_id", user.id).maybeSingle(),
    supabase.from("proof_questions").select("id, question, position").eq("listing_id", id).order("position"),
    supabase.from("claims").select("id, claimant_id, status, created_at").eq("listing_id", id).order("created_at", { ascending: false }),
  ]);
  if (!listing?.id || listing.kind !== "found") notFound();
  const claimIds = claims?.map((claim) => claim.id) ?? [];
  const { data: answers } = claimIds.length ? await supabase.from("proof_answers").select("claim_id, proof_question_id, answer").in("claim_id", claimIds) : { data: [] };
  const answersByClaim = new Map<string, Map<string, string>>();
  for (const answer of answers ?? []) { const bucket = answersByClaim.get(answer.claim_id) ?? new Map<string, string>(); bucket.set(answer.proof_question_id, answer.answer); answersByClaim.set(answer.claim_id, bucket); }
  return <main className="board-shell"><BoardHeader /><section className="case-file found"><p className="eyebrow">Claim review desk</p><h1>{listing.title}</h1>{claims?.length ? claims.map((claim) => <article className="claim-card" key={claim.id}><div className="evidence-row"><span>Claim {claim.id.slice(0, 8)}</span><span>{claim.status}</span></div>{(questions ?? []).map((question) => <div className="claim-answer" key={question.id}><strong>{question.question}</strong><p>{answersByClaim.get(claim.id)?.get(question.id) ?? "No answer"}</p></div>)}{claim.status === "pending" && listing.status === "open" && <form className="claim-actions" action={decideClaim}><input type="hidden" name="claimId" value={claim.id} /><input type="hidden" name="listingId" value={id} /><button className="primary-button" name="decision" value="accept">Accept claim</button><button className="danger-button" name="decision" value="reject">Reject claim</button></form>}</article>) : <p>No claims yet.</p>}</section></main>;
}
