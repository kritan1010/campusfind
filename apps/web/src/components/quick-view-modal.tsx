"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MapPin, Tag, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { categoryLabel } from "@/lib/listings/validation";
import type { ListingCardData } from "@/components/listing-card";

export function QuickViewModal({
  listing,
  onClose,
}: {
  listing: ListingCardData | null;
  onClose: () => void;
}) {
  if (!listing) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40"
        />

        {/* Modal Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg overflow-hidden border-2 border-[var(--manila-dark)] bg-[var(--paper-bright)] p-6 shadow-2xl"
        >
          {/* Top pin */}
          <span className="note-pin absolute left-1/2 top-3 -translate-x-1/2 z-20" aria-hidden="true" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center border border-[var(--manila-dark)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--manila)]/40 active:scale-90 cursor-pointer"
            aria-label="Close detail preview"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mt-4 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[var(--muted-ink)]">
            <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 text-xs text-white ${listing.kind === "lost" ? "bg-[var(--lost)] border-[var(--lost)]" : "bg-[var(--found)] border-[var(--found)]"}`}>
              {listing.kind === "lost" ? <AlertCircle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
              {listing.kind}
            </span>
            <span>·</span>
            <span>{listing.status.replaceAll("_", " ")}</span>
          </div>

          <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[var(--ink)]">
            {listing.title}
          </h2>

          <div className="relative mt-4 aspect-video w-full overflow-hidden border border-[var(--manila-dark)]/40 bg-[var(--paper)]">
            {listing.imageUrl ? (
              <Image src={listing.imageUrl} alt={listing.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--muted-ink)]">
                No photo provided
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 border border-[var(--manila-dark)]/40 bg-[var(--paper)] p-2.5">
              <Tag className="h-4 w-4 text-[var(--manila-dark)]" />
              <div>
                <div className="text-[0.68rem] uppercase font-mono font-bold text-[var(--muted-ink)]">Category</div>
                <div className="font-semibold text-[var(--ink)]">{categoryLabel(listing.category)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 border border-[var(--manila-dark)]/40 bg-[var(--paper)] p-2.5">
              <MapPin className="h-4 w-4 text-[var(--found)]" />
              <div>
                <div className="text-[0.68rem] uppercase font-mono font-bold text-[var(--muted-ink)]">Zone</div>
                <div className="font-semibold text-[var(--ink)]">{listing.zoneName}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2.5 border border-[var(--manila-dark)]/40 bg-[var(--paper)] p-2.5 text-sm">
            <Calendar className="h-4 w-4 text-[var(--lost)]" />
            <div>
              <div className="text-[0.68rem] uppercase font-mono font-bold text-[var(--muted-ink)]">Event Date</div>
              <div className="font-semibold text-[var(--ink)]">{listing.eventDate}</div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-dashed border-[var(--manila-dark)]">
            <button
              onClick={onClose}
              className="border border-[var(--manila-dark)] bg-[var(--paper)] px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted-ink)] hover:bg-[var(--manila)]/30 active:scale-95 cursor-pointer"
            >
              Close
            </button>
            <Link
              href={`/listings/${listing.id}`}
              className="inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs hover:bg-black active:scale-95 transition-transform"
            >
              <span>View full details</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
