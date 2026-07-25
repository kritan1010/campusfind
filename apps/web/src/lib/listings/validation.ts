export const LISTING_CATEGORIES = [
  "electronics",
  "bag",
  "id_card",
  "clothing",
  "keys",
  "book",
  "bottle",
  "other",
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];
export type ListingKind = "lost" | "found";

export type ListingDraft = {
  kind: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  zoneId: string;
  exactLat: string;
  exactLng: string;
};

export function validateListingDraft(draft: ListingDraft, today = new Date()) {
  if (draft.kind !== "lost" && draft.kind !== "found") {
    return "Choose whether the item was lost or found.";
  }
  if (draft.title.trim().length < 3 || draft.title.trim().length > 120) {
    return "Title must contain between 3 and 120 characters.";
  }
  if (
    draft.description.trim().length < 10 ||
    draft.description.trim().length > 4000
  ) {
    return "Description must contain between 10 and 4,000 characters.";
  }
  if (!LISTING_CATEGORIES.includes(draft.category as ListingCategory)) {
    return "Choose a valid category.";
  }
  if (!draft.eventDate) return "Choose the date the item was lost or found.";

  const eventDate = new Date(`${draft.eventDate}T00:00:00`);
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (Number.isNaN(eventDate.getTime())) return "Choose a valid event date.";
  if (eventDate > localToday) return "The event date cannot be in the future.";
  if (!draft.zoneId) return "Choose the closest campus zone.";

  const hasLat = draft.exactLat.trim() !== "";
  const hasLng = draft.exactLng.trim() !== "";
  if (hasLat !== hasLng) return "Enter both latitude and longitude, or leave both blank.";
  if (hasLat) {
    const lat = Number(draft.exactLat);
    const lng = Number(draft.exactLng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return "Latitude must be between -90 and 90.";
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return "Longitude must be between -180 and 180.";
  }

  return null;
}

export function normalizeKeywords(value: string) {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => {
      const normalized = keyword.toLocaleLowerCase();
      if (!keyword || keyword.length > 120 || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, 12);
}

export function toPrefixTsQuery(value: string) {
  return value
    .trim()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 8)
    .map((term) => `${term}:*`)
    .join(" & ");
}

export function categoryLabel(category: string) {
  return category === "id_card"
    ? "ID card"
    : category.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
