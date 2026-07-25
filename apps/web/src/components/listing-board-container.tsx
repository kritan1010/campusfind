"use client";

import { useState } from "react";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { KindTabs } from "@/components/kind-tabs";
import { QuickViewModal } from "@/components/quick-view-modal";
import { Search, Filter, Calendar, MapPin, Tag } from "lucide-react";
import { categoryLabel, LISTING_CATEGORIES, type ListingCategory } from "@/lib/listings/validation";

type Zone = { id: string; name: string };

export function ListingBoardContainer({
  kind,
  query,
  category,
  zoneId,
  from,
  to,
  zones,
  cards,
  profile,
  toggleOutsideAction,
}: {
  kind: "lost" | "found";
  query: string;
  category: string;
  zoneId: string;
  from: string;
  to: string;
  zones: Zone[];
  cards: ListingCardData[];
  profile?: { college_id: string | null; show_independent_posts: boolean } | null;
  toggleOutsideAction: (formData: FormData) => Promise<void>;
}) {
  const [quickViewListing, setQuickViewListing] = useState<ListingCardData | null>(null);

  return (
    <div className="board-container space-y-6">
      {/* Lost / Found Animated Switcher */}
      <KindTabs activeKind={kind} />

      {/* Filter Ticket Card */}
      <section className="filter-ticket border-2 border-[var(--manila-dark)] bg-[var(--paper-bright)] p-5 shadow-md">
        <form method="get" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
          <input type="hidden" name="kind" value={kind} />

          <div className="lg:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted-ink)]">
              <Search className="h-3.5 w-3.5 text-[var(--manila-dark)]" />
              <span>Search reports</span>
            </label>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="wallet, blue bottle, keys…"
              className="mt-1 w-full border border-[var(--manila-dark)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] shadow-inner transition-colors focus:border-[var(--ink)] focus:bg-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted-ink)]">
              <Tag className="h-3.5 w-3.5 text-[var(--manila-dark)]" />
              <span>Category</span>
            </label>
            <select
              name="category"
              defaultValue={category}
              className="mt-1 w-full border border-[var(--manila-dark)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] shadow-inner transition-colors focus:border-[var(--ink)] focus:bg-white"
            >
              <option value="">All items</option>
              {LISTING_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {categoryLabel(item as ListingCategory)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted-ink)]">
              <MapPin className="h-3.5 w-3.5 text-[var(--found)]" />
              <span>Zone</span>
            </label>
            <select
              name="zone"
              defaultValue={zoneId}
              className="mt-1 w-full border border-[var(--manila-dark)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] shadow-inner transition-colors focus:border-[var(--ink)] focus:bg-white"
            >
              <option value="">All zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted-ink)]">
              <Calendar className="h-3.5 w-3.5 text-[var(--lost)]" />
              <span>From date</span>
            </label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="mt-1 w-full border border-[var(--manila-dark)] bg-[var(--paper)] px-2.5 py-2 text-sm text-[var(--ink)] shadow-inner transition-colors focus:border-[var(--ink)]"
            />
          </div>

          <div>
            <button
              className="flex w-full items-center justify-center gap-2 border border-[var(--ink)] bg-[var(--ink)] hover:bg-black px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              type="submit"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </form>

        {profile?.college_id && (
          <form className="outside-toggle mt-4 flex items-center justify-between pt-3 border-t border-dashed border-[var(--manila-dark)]/50 text-xs text-[var(--muted-ink)]" action={toggleOutsideAction}>
            <input type="hidden" name="enabled" value={profile.show_independent_posts ? "false" : "true"} />
            <span>Show posts from neighboring campus members</span>
            <button
              type="submit"
              className={`border px-3 py-1 font-mono text-[0.7rem] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                profile.show_independent_posts
                  ? "bg-[var(--found)] text-white border-[var(--found)] shadow-xs"
                  : "bg-[var(--paper)] text-[var(--ink)] border-[var(--manila-dark)]"
              }`}
              aria-pressed={profile.show_independent_posts}
            >
              {profile.show_independent_posts ? "Active · Turn Off" : "Off · Turn On"}
            </button>
          </form>
        )}
      </section>

      {/* Cards Cork Board */}
      {cards.length ? (
        <section className="cork-board grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label={`${kind} listings`}>
          {cards.map((card) => (
            <ListingCard key={card.id} listing={card} onQuickView={(item) => setQuickViewListing(item)} />
          ))}
        </section>
      ) : (
        <section className="empty-board border-2 border-dashed border-[var(--manila-dark)] bg-[var(--paper-bright)] p-12 text-center shadow-xs">
          <span className="note-pin mx-auto mb-4 block" />
          <p className="eyebrow text-xs uppercase font-mono text-[var(--lost)] tracking-widest font-bold">No reports pinned</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-[var(--ink)]">This side of the board is clear.</h2>
          <p className="mt-2 text-sm text-[var(--muted-ink)]">Try adjusting your search filters or be the first person to pin a report.</p>
        </section>
      )}

      {/* Quick View Modal */}
      <QuickViewModal listing={quickViewListing} onClose={() => setQuickViewListing(null)} />
    </div>
  );
}
