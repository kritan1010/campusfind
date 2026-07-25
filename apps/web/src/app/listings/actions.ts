"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Authentication required.");
  return { supabase, user };
}

export async function closeListing(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) throw new Error("Listing ID is required.");

  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("close_listing", { p_listing_id: listingId });
  if (error) throw new Error(error.message);

  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
}

export async function deleteListing(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) throw new Error("Listing ID is required.");

  const { supabase, user } = await authenticatedClient();
  const { data: listing } = await supabase
    .from("listings_public")
    .select("id, poster_id")
    .eq("id", listingId)
    .eq("poster_id", user.id)
    .maybeSingle();
  if (!listing) throw new Error("Only the poster can delete this listing.");

  const { data: images } = await supabase
    .from("listing_images")
    .select("storage_path")
    .eq("listing_id", listingId);
  const paths = images?.map((image) => image.storage_path) ?? [];
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("listing-images").remove(paths);
    if (storageError) throw new Error(storageError.message);
  }

  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) throw new Error(error.message);

  revalidatePath("/listings");
  redirect("/listings");
}

export async function toggleIndependentPosts(formData: FormData) {
  const enabled = formData.get("enabled") === "true";
  const { supabase, user } = await authenticatedClient();
  const { error } = await supabase
    .from("profiles")
    .update({ show_independent_posts: enabled })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/listings");
}

export async function submitClaim(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) throw new Error("Listing ID is required.");
  const answers = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("answer:"))
    .map(([key, answer]) => ({ question_id: key.slice("answer:".length), answer: String(answer).trim() }));
  if (!answers.length || answers.some((item) => !item.answer)) throw new Error("Answer every proof question.");
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("create_claim_with_answers", { p_listing_id: listingId, p_answers: answers });
  if (error) throw new Error(error.message);
  revalidatePath(`/listings/${listingId}`);
  redirect(`/listings/${listingId}?claim=submitted`);
}

export async function decideClaim(formData: FormData) {
  const claimId = String(formData.get("claimId") ?? "");
  const listingId = String(formData.get("listingId") ?? "");
  const accept = formData.get("decision") === "accept";
  if (!claimId || !listingId) throw new Error("Claim details are required.");
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("decide_claim", { p_claim_id: claimId, p_accept: accept });
  if (error) throw new Error(error.message);
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/claims`);
}

export async function dismissMatch(formData: FormData) {
  const matchId = String(formData.get("matchId") ?? "");
  const listingId = String(formData.get("listingId") ?? "");
  const side = String(formData.get("side") ?? "");
  if (!matchId || !listingId || !["lost", "found"].includes(side)) throw new Error("Match details are required.");
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("dismiss_match", { p_match_id: matchId });
  if (error) throw new Error(error.message);
  revalidatePath(`/listings/${listingId}/matches`);
}
