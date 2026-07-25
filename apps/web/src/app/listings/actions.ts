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
