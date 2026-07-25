import Link from "next/link";
import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/board-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { categoryLabel, LISTING_CATEGORIES, toPrefixTsQuery, type ListingCategory } from "@/lib/listings/validation";
import { createClient } from "@/lib/supabase/server";
import { toggleIndependentPosts } from "./actions";

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
  const page = Math.max(1, Number(one(params.page)) || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, zonesResult] = await Promise.all([
    supabase.from("profiles").select("college_id, show_independent_posts").eq("id", user.id).single(),
    supabase.from("campus_zones").select("id, name").order("name"),
  ]);

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
    <main className="board-shell">
      <BoardHeader />
      <section className="board-intro">
        <div><p className="eyebrow">Live community evidence board</p><h1>What went <em>missing</em>.<br />What turned <em>up</em>.</h1></div>
        <Link className="primary-button post-cta" href="/listings/new">+ Pin a report</Link>
      </section>

      <div className="kind-tabs" aria-label="Listing kind">
        <Link className={kind === "lost" ? "active lost" : ""} href="/listings?kind=lost">Lost</Link>
        <Link className={kind === "found" ? "active found" : ""} href="/listings?kind=found">Found</Link>
      </div>

      <section className="filter-ticket" aria-label="Search and filters">
        <form method="get">
          <input type="hidden" name="kind" value={kind} />
          <label>Search<input type="search" name="q" defaultValue={query} placeholder="wallet, blue bottle, calculator…" /></label>
          <label>Category<select name="category" defaultValue={category}><option value="">All items</option>{LISTING_CATEGORIES.map((item) => <option key={item} value={item}>{categoryLabel(item as ListingCategory)}</option>)}</select></label>
          <label>Zone<select name="zone" defaultValue={zoneId}><option value="">All zones</option>{(zonesResult.data ?? []).map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
          <label>From<input type="date" name="from" defaultValue={from} /></label>
          <label>To<input type="date" name="to" defaultValue={to} /></label>
          <button className="secondary-button" type="submit">Search board</button>
        </form>
        {profileResult.data?.college_id && <form className="outside-toggle" action={toggleIndependentPosts}><input type="hidden" name="enabled" value={profileResult.data.show_independent_posts ? "false" : "true"} /><span>Posts from people outside your college</span><button type="submit" aria-pressed={profileResult.data.show_independent_posts}>{profileResult.data.show_independent_posts ? "Showing · turn off" : "Hidden · turn on"}</button></form>}
      </section>

      {error ? <p className="form-error">Could not load the board: {error.message}</p> : cards.length ? <section className="cork-board" aria-label={`${kind} listings`}>{cards.map((card) => <ListingCard key={card.id} listing={card} />)}</section> : <section className="empty-board"><span className="note-pin" /><p className="eyebrow">No reports pinned</p><h2>This side of the board is clear.</h2><p>Try removing a filter or be the first person to post.</p></section>}

      <nav className="pagination" aria-label="Listing pages">
        {page > 1 && <Link href={hrefForPage(page - 1)}>← Newer</Link>}
        <span>Page {page}</span>
        {page * PAGE_SIZE < (count ?? 0) && <Link href={hrefForPage(page + 1)}>Older →</Link>}
      </nav>
    </main>
  );
}
