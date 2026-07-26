import { notFound, redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { ListingForm } from "@/components/listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [listingResult, zonesResult, imagesResult, attributesResult, locationResult, questionsResult] = await Promise.all([
    supabase.from("listings_public").select("id, poster_id, kind, title, description, category, colour, brand, model, event_date, zone_id, visibility").eq("id", id).eq("poster_id", user.id).maybeSingle(),
    supabase.from("campus_zones").select("id, name").order("name"),
    supabase.from("listing_images").select("id, storage_path, position").eq("listing_id", id).order("position"),
    supabase.from("item_attributes").select("value").eq("listing_id", id).eq("key", "keyword"),
    supabase.rpc("get_listing_exact_location", { p_listing_id: id }),
    supabase.from("proof_questions").select("question").eq("listing_id", id).order("position"),
  ]);
  const listing = listingResult.data;
  if (!listing?.id || !listing.poster_id || !listing.kind || !listing.title || !listing.description || !listing.category || !listing.event_date) notFound();
  const location = locationResult.data?.[0];
  const images = (imagesResult.data ?? []).map((image) => ({ ...image, url: supabase.storage.from("listing-images").getPublicUrl(image.storage_path).data.publicUrl }));

  return <main className="board-shell form-page"><BoardHeader /><header className="form-page-heading"><p className="eyebrow">Revise evidence card</p><h1>Keep the trail <em>accurate</em>.</h1></header><section className="form-paper"><ListingForm zones={zonesResult.data ?? []} listing={{ id: listing.id, kind: listing.kind, title: listing.title, description: listing.description, category: listing.category, colour: listing.colour, brand: listing.brand, model: listing.model, event_date: listing.event_date, zone_id: listing.zone_id, visibility: listing.visibility ?? "campus_only", exact_lat: location?.exact_lat ?? null, exact_lng: location?.exact_lng ?? null }} existingImages={images} keywords={(attributesResult.data ?? []).map((attribute) => attribute.value)} proofQuestions={(questionsResult.data ?? []).map((item) => item.question)} /></section></main>;
}
