import Link from "next/link";
import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { ListingBoardContainer } from "@/components/listing-board-container";
import { type ListingCardData } from "@/components/listing-card";
import { toPrefixTsQuery } from "@/lib/listings/validation";
import { createClient } from "@/lib/supabase/server";
import { toggleIndependentPosts } from "./actions";
import { PlusCircle } from "lucide-react";

const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const kind = one(params.kind) === "found" ? "found" : "lost";
  const category = one(params.category) ?? "";
  const zoneId = one(params.zone) ?? "";
  const query = one(params.q)?.trim() ?? "";
  const from = one(params.from) ?? "";
  const to = one(params.to) ?? "";
  const visibility = one(params.visibility) === "public" ? "public" : one(params.visibility) === "campus_only" ? "campus_only" : "";
  const page = Math.max(1, Number(one(params.page)) || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, zonesResult] = await Promise.all([
    supabase.from("profiles").select("college_id, show_independent_posts, is_admin, onboarding_completed_at").eq("id", user.id).single(),
    supabase.from("campus_zones").select("id, name").order("name"),
  ]);
  if (!profileResult.data?.onboarding_completed_at) redirect("/onboarding?next=/listings");

  let listingQuery = supabase
    .from("listings_public")
    .select("id, kind, status, title, category, zone_id, event_date, created_at", { count: "exact" })
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (category) listingQuery = listingQuery.eq("category", category);
  if (zoneId) listingQuery = listingQuery.eq("zone_id", zoneId);
  if (from) listingQuery = listingQuery.gte("event_date", from);
  if (to) listingQuery = listingQuery.lte("event_date", to);
  if (visibility) listingQuery = listingQuery.eq("visibility", visibility);
  const searchQuery = toPrefixTsQuery(query);
  if (searchQuery) listingQuery = listingQuery.textSearch("search_document", searchQuery, { config: "english" });

  const { data: rows, count, error } = await listingQuery;
  const ids = rows?.flatMap((row) => row.id ? [row.id] : []) ?? [];
  const { data: images } = ids.length
    ? await supabase.from("listing_images").select("listing_id, storage_path, position").in("listing_id", ids).order("position")
    : { data: [] };
  const imageByListing = new Map<string, string>();
  for (const image of images ?? []) {
    if (!imageByListing.has(image.listing_id)) imageByListing.set(image.listing_id, image.storage_path);
  }
  const zoneById = new Map((zonesResult.data ?? []).map((zone) => [zone.id, zone.name]));
  const cards: ListingCardData[] = (rows ?? []).flatMap((row) => {
    if (!row.id || !row.kind || !row.status || !row.title || !row.category || !row.event_date) return [];
    const path = imageByListing.get(row.id);
    return [{
      id: row.id, kind: row.kind, status: row.status, title: row.title, category: row.category,
      eventDate: row.event_date, zoneName: row.zone_id ? zoneById.get(row.zone_id) ?? "Campus zone" : "Campus zone",
      imageUrl: path ? supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl : undefined,
    }];
  });

  const hrefForPage = (nextPage: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (typeof value === "string" && key !== "page") next.set(key, value);
    next.set("page", String(nextPage));
    return `/listings?${next}`;
  };

  return (
    <main className="board-shell min-h-screen px-4 pb-16 pt-2 max-w-6xl mx-auto">
      <BoardHeader isAdmin={profileResult.data?.is_admin} />

      <section className="board-intro my-8 border-2 border-[var(--manila-dark)] bg-[var(--paper-bright)] p-8 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <span className="note-pin absolute left-1/2 top-3 -translate-x-1/2 z-20" aria-hidden="true" />

        <div className="space-y-4 max-w-2xl mt-2">
          <p className="eyebrow font-mono text-xs uppercase tracking-widest font-bold text-[var(--lost)]">Live community evidence board</p>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15] text-[var(--ink)] mb-3 block">
            What went <em className="text-[var(--lost)] not-italic">missing</em>.<br />What turned <em className="text-[var(--found)] not-italic">up</em>.
          </h1>
          <p className="text-sm text-[var(--muted-ink)] leading-relaxed pt-1">
            Browse pinned reports from your campus community or report a lost or found item while the trail is fresh.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 border border-[var(--found)] bg-[var(--found)] px-6 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#23533d] transition-all hover:scale-[1.02] active:scale-95 shrink-0"
          href="/listings/new"
          style={{ color: "#ffffff" }}
        >
          <PlusCircle className="h-4 w-4 text-white" />
          <span className="text-white">+ Pin a report</span>
        </Link>
      </section>

      {error ? (
        <div className="border border-[var(--lost)] bg-[var(--lost)]/10 p-6 text-center text-xs font-mono font-bold uppercase tracking-wider text-[var(--lost)]">
          Could not load the board: {error.message}
        </div>
      ) : (
        <ListingBoardContainer
          kind={kind}
          query={query}
          category={category}
          zoneId={zoneId}
          from={from}
          to={to}
          visibility={visibility}
          zones={zonesResult.data ?? []}
          cards={cards}
          profile={profileResult.data}
          toggleOutsideAction={toggleIndependentPosts}
        />
      )}

      <nav className="pagination mt-10 flex items-center justify-between border-t border-[var(--manila-dark)]/40 pt-6 text-xs font-mono font-bold uppercase tracking-wider" aria-label="Listing pages">
        {page > 1 ? (
          <Link href={hrefForPage(page - 1)} className="border border-[var(--manila-dark)] bg-[var(--paper-bright)] px-4 py-2 text-[var(--ink)] shadow-xs transition-all hover:bg-[var(--manila)]/30 active:scale-95">
            ← Newer reports
          </Link>
        ) : <div />}
        <span className="text-[var(--muted-ink)]">Page {page}</span>
        {page * PAGE_SIZE < (count ?? 0) ? (
          <Link href={hrefForPage(page + 1)} className="border border-[var(--manila-dark)] bg-[var(--paper-bright)] px-4 py-2 text-[var(--ink)] shadow-xs transition-all hover:bg-[var(--manila)]/30 active:scale-95">
            Older reports →
          </Link>
        ) : <div />}
      </nav>
    </main>
  );
}
