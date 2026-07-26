"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  categoryLabel,
  LISTING_CATEGORIES,
  normalizeKeywords,
  validateListingDraft,
  type ListingKind,
} from "@/lib/listings/validation";
import type { ListingVisibility } from "@/lib/supabase/database.types";

type Zone = { id: string; name: string };
type ExistingImage = { id: string; storage_path: string; position: number; url: string };
type ListingSeed = {
  id: string; kind: ListingKind; title: string; description: string; category: string;
  colour: string | null; brand: string | null; model: string | null; event_date: string;
  zone_id: string | null; exact_lat: number | null; exact_lng: number | null;
  visibility: ListingVisibility;
};

export function ListingForm({
  zones,
  listing,
  existingImages = [],
  keywords = [],
  proofQuestions = [],
}: {
  zones: Zone[];
  listing?: ListingSeed;
  existingImages?: ExistingImage[];
  keywords?: string[];
  proofQuestions?: string[];
}) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [kind, setKind] = useState<ListingKind>(listing?.kind ?? "lost");
  const [visibility, setVisibility] = useState<ListingVisibility>(listing?.visibility ?? "campus_only");
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<string[]>(proofQuestions.length ? proofQuestions : [""]);
  const [exactLat, setExactLat] = useState(listing?.exact_lat?.toString() ?? "");
  const [exactLng, setExactLng] = useState(listing?.exact_lng?.toString() ?? "");
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function useCurrentPosition() {
    if (!("geolocation" in navigator)) return setError("Location capture is not supported in this browser.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setExactLat(coords.latitude.toFixed(6));
        setExactLng(coords.longitude.toFixed(6));
        setError(null);
      },
      () => setError("CampusFind could not access your location. You can enter the pin manually."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const draft = {
      kind,
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      category: String(form.get("category") ?? ""),
      eventDate: String(form.get("eventDate") ?? ""),
      zoneId: String(form.get("zoneId") ?? ""),
      exactLat: String(form.get("exactLat") ?? ""),
      exactLng: String(form.get("exactLng") ?? ""),
    };
    const validationError = validateListingDraft(draft);
    if (validationError) return setError(validationError);

    const retained = existingImages.filter((image) => !removedImageIds.includes(image.id));
    const retainedImages = retained.length;
    if (retainedImages + files.length < 1) return setError("Add at least one photo.");
    if (retainedImages + files.length > 6) return setError("Use no more than six photos.");
    const invalidFile = files.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024,
    );
    if (invalidFile) return setError("Photos must be JPG, PNG, or WebP and no larger than 8 MB each.");

    setPending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPending(false); return setError("Your session expired. Sign in again."); }

    const optional = (name: string) => String(form.get(name) ?? "").trim() || null;
    const payload = {
      poster_id: user.id,
      kind,
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      colour: optional("colour"),
      brand: optional("brand"),
      model: optional("model"),
      event_date: draft.eventDate,
      zone_id: draft.zoneId,
      visibility,
      exact_lat: draft.exactLat ? Number(draft.exactLat) : null,
      exact_lng: draft.exactLng ? Number(draft.exactLng) : null,
    };

    let listingId = listing?.id;
    const creating = !listingId;
    if (listingId) {
      const updates = {
        kind: payload.kind,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        colour: payload.colour,
        brand: payload.brand,
        model: payload.model,
        event_date: payload.event_date,
        zone_id: payload.zone_id,
        visibility: payload.visibility,
        exact_lat: payload.exact_lat,
        exact_lng: payload.exact_lng,
      };
      const { error: updateError } = await supabase.from("listings").update(updates).eq("id", listingId);
      if (updateError) { setPending(false); return setError(updateError.message); }
    } else {
      const { data, error: insertError } = await supabase
        .from("listings").insert(payload).select("id").single();
      if (insertError || !data) { setPending(false); return setError(insertError?.message ?? "Could not create listing."); }
      listingId = data.id;
    }

    const removedImages = existingImages.filter((image) => removedImageIds.includes(image.id));
    if (removedImages.length) {
      const { error: storageError } = await supabase.storage
        .from("listing-images").remove(removedImages.map((image) => image.storage_path));
      if (storageError) { setPending(false); return setError(storageError.message); }
      const { error: rowsError } = await supabase.from("listing_images").delete().in("id", removedImageIds);
      if (rowsError) { setPending(false); return setError(rowsError.message); }
    }

    const uploadedPaths: string[] = [];
    for (const [index, file] of files.entries()) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `${listingId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images").upload(storagePath, file, { contentType: file.type });
      if (uploadError) {
        if (uploadedPaths.length) await supabase.storage.from("listing-images").remove(uploadedPaths);
        if (creating) await supabase.from("listings").delete().eq("id", listingId);
        setPending(false);
        return setError(uploadError.message);
      }
      uploadedPaths.push(storagePath);
      const { error: imageError } = await supabase.from("listing_images").insert({
        listing_id: listingId,
        storage_path: storagePath,
        position: Math.max(-1, ...retained.map((image) => image.position)) + 1 + index,
      });
      if (imageError) {
        await supabase.storage.from("listing-images").remove([storagePath]);
        if (creating) await supabase.from("listings").delete().eq("id", listingId);
        setPending(false);
        return setError(imageError.message);
      }
    }

    const { error: deleteAttributeError } = await supabase
      .from("item_attributes").delete().eq("listing_id", listingId).eq("key", "keyword");
    if (deleteAttributeError) { setPending(false); return setError(deleteAttributeError.message); }
    const normalizedKeywords = normalizeKeywords(String(form.get("keywords") ?? ""));
    if (normalizedKeywords.length) {
      const { error: attributeError } = await supabase.from("item_attributes").insert(
        normalizedKeywords.map((value) => ({ listing_id: listingId!, key: "keyword", value })),
      );
      if (attributeError) { setPending(false); return setError(attributeError.message); }
    }

    if (kind === "found") {
      const cleanedQuestions = questions.map((question) => question.trim()).filter(Boolean);
      if (cleanedQuestions.length < 1 || cleanedQuestions.length > 5 || cleanedQuestions.some((question) => question.length < 5)) {
        setPending(false); return setError("Found reports need 1–5 proof questions of at least five characters.");
      }
      const { error: questionDeleteError } = await supabase.from("proof_questions").delete().eq("listing_id", listingId);
      if (questionDeleteError) { setPending(false); return setError(questionDeleteError.message); }
      const { error: questionInsertError } = await supabase.from("proof_questions").insert(
        cleanedQuestions.map((question, position) => ({ listing_id: listingId!, question, position })),
      );
      if (questionInsertError) { setPending(false); return setError(questionInsertError.message); }
    }

    router.push(`/listings/${listingId}`);
    router.refresh();
  }

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <fieldset className="form-section">
        <legend className="section-kicker">01 · Report type</legend>
        <div className="kind-toggle">
          {(["lost", "found"] as const).map((value) => (
            <button key={value} type="button" className={kind === value ? `active ${value}` : ""} onClick={() => setKind(value)}>
              {value === "lost" ? "I lost something" : "I found something"}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-kicker">02 · Item notes</legend>
        <label>Short title<input name="title" required minLength={3} maxLength={120} defaultValue={listing?.title} placeholder="Black Casio calculator" /></label>
        <div className="field-grid">
          <label>Category<select name="category" defaultValue={listing?.category ?? ""} required><option value="" disabled>Choose one</option>{LISTING_CATEGORIES.map((category) => <option value={category} key={category}>{categoryLabel(category)}</option>)}</select></label>
          <label>Date {kind === "lost" ? "lost" : "found"}<input name="eventDate" type="date" required max={new Date().toISOString().slice(0, 10)} defaultValue={listing?.event_date} /></label>
        </div>
        <label>Description<textarea name="description" required minLength={10} maxLength={4000} rows={6} defaultValue={listing?.description} placeholder="Add where you last saw it and details that help identify it." /></label>
        <div className="field-grid three-fields">
          <label>Colour <span>optional</span><input name="colour" defaultValue={listing?.colour ?? ""} /></label>
          <label>Brand <span>optional</span><input name="brand" defaultValue={listing?.brand ?? ""} /></label>
          <label>Model <span>optional</span><input name="model" defaultValue={listing?.model ?? ""} /></label>
        </div>
        <label>Keywords <span>comma separated</span><input name="keywords" defaultValue={keywords.join(", ")} placeholder="casio, sticker, scratched" /></label>
        {kind === "found" && <div className="proof-editor"><p className="privacy-callout"><strong>Private proof questions</strong><br />Only a claimant and you will use these during verification. Do not put answers in the question.</p>{questions.map((question, index) => <label key={index}>Question {index + 1}<input value={question} minLength={5} onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="What sticker or mark is on it?" />{questions.length > 1 && <button className="location-button" type="button" onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}</label>)}{questions.length < 5 && <button className="location-button" type="button" onClick={() => setQuestions((current) => [...current, ""])}>+ Add another proof question</button>}</div>}
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-kicker">03 · Place</legend>
        <label>Who should see this report?
          <select name="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as ListingVisibility)}>
            <option value="campus_only">People from this campus</option>
            <option value="public">Everyone on CampusFind</option>
          </select>
        </label>
        <p className="field-hint">Public reports are visible to every signed-in CampusFind member. Exact pins and contact details stay private.</p>
        <label>Closest campus zone<select name="zoneId" defaultValue={listing?.zone_id ?? ""} required><option value="" disabled>Choose a pinned place</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
        <p className="privacy-callout">The zone is public. The exact pin stays private to you until a later claim flow explicitly shares it.</p>
        <button className="location-button" type="button" onClick={useCurrentPosition}>Use my current position as the private pin</button>
        <div className="field-grid">
          <label>Exact latitude <span>optional</span><input name="exactLat" inputMode="decimal" value={exactLat} onChange={(event) => setExactLat(event.target.value)} placeholder="12.9716" /></label>
          <label>Exact longitude <span>optional</span><input name="exactLng" inputMode="decimal" value={exactLng} onChange={(event) => setExactLng(event.target.value)} placeholder="77.5946" /></label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-kicker">04 · Evidence</legend>
        {existingImages.length > 0 && <div className="existing-images">{existingImages.map((image) => <label className="image-check" key={image.id}><Image src={image.url} alt="Existing listing upload" width={180} height={130} /><span><input type="checkbox" checked={removedImageIds.includes(image.id)} onChange={(event) => setRemovedImageIds((current) => event.target.checked ? [...current, image.id] : current.filter((id) => id !== image.id))} /> Remove</span></label>)}</div>}
        <label>Photos <span>1–6, JPG/PNG/WebP, 8 MB each</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></label>
        {files.length > 0 && <p className="field-hint">{files.length} new photo{files.length === 1 ? "" : "s"} ready to pin.</p>}
      </fieldset>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={pending} type="submit">{pending ? "Pinning report…" : listing ? "Save changes" : "Pin report to board"}</button>
    </form>
  );
}
