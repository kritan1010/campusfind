"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, MapPin, Calendar, Tag } from "lucide-react";
import { categoryLabel } from "@/lib/listings/validation";
import type { ListingKind, ListingStatus } from "@/lib/supabase/database.types";

export type ListingCardData = {
  id: string;
  kind: ListingKind;
  status: ListingStatus;
  title: string;
  category: string;
  zoneName: string;
  eventDate: string;
  imageUrl?: string;
};

function relativeDate(date: string) {
  const days = Math.round((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000);
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(days, "day");
}

export function ListingCard({
  listing,
  onQuickView,
}: {
  listing: ListingCardData;
  onQuickView?: (listing: ListingCardData) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`listing-note ${listing.kind} group relative overflow-hidden border border-[var(--manila-dark)]/40 bg-[var(--paper-bright)] p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--manila-dark)]`}
    >
      <span className="note-pin" aria-hidden="true" />

      {/* Quick View trigger button */}
      {onQuickView && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickView(listing);
          }}
          className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center border border-[var(--manila-dark)] bg-[var(--paper-bright)] text-[var(--ink)] opacity-0 shadow-xs transition-all duration-200 group-hover:opacity-100 hover:bg-[var(--ink)] hover:text-white active:scale-90 cursor-pointer"
          title="Quick preview"
          aria-label={`Quick preview for ${listing.title}`}
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      )}

      <Link href={`/listings/${listing.id}`} aria-label={`View details for ${listing.title}`} className="block">
        <div className="listing-photo relative aspect-[4/3] w-full overflow-hidden border border-[var(--manila-dark)]/30 bg-[var(--paper)]">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt=""
              fill
              sizes="(max-width: 700px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-103"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-xs text-[var(--muted-ink)]">
              No photo
            </span>
          )}
        </div>

        <div className="listing-note-body mt-3">
          <div className="evidence-row flex items-center justify-between font-mono text-[0.68rem] uppercase font-bold tracking-wider">
            <span className={`kind-label border px-2 py-0.5 text-white ${listing.kind === "lost" ? "bg-[var(--lost)] border-[var(--lost)]" : "bg-[var(--found)] border-[var(--found)]"}`}>
              {listing.kind}
            </span>
            <span className="text-[var(--muted-ink)]">{listing.status.replaceAll("_", " ")}</span>
          </div>

          <h2 className="mt-2 line-clamp-1 font-serif text-lg font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--found)] transition-colors">
            {listing.title}
          </h2>

          <dl className="evidence-meta mt-3 space-y-1 text-xs text-[var(--muted-ink)] border-t border-dashed border-[var(--manila-dark)]/40 pt-2">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-[var(--manila-dark)] shrink-0" />
              <dt className="sr-only">Category</dt>
              <dd className="truncate font-medium">{categoryLabel(listing.category)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--found)] shrink-0" />
              <dt className="sr-only">Zone</dt>
              <dd className="truncate font-medium">{listing.zoneName}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[var(--lost)] shrink-0" />
              <dt className="sr-only">When</dt>
              <dd className="truncate font-mono text-[0.7rem]">{relativeDate(listing.eventDate)}</dd>
            </div>
          </dl>
        </div>
      </Link>
    </motion.article>
  );
}
