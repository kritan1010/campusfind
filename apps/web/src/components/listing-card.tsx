import Image from "next/image";
import Link from "next/link";
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

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <article className={`listing-note ${listing.kind}`}>
      <span className="note-pin" aria-hidden="true" />
      <Link href={`/listings/${listing.id}`} aria-label={`View ${listing.title}`}>
        <div className="listing-photo">
          {listing.imageUrl ? <Image src={listing.imageUrl} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" /> : <span>No photo</span>}
        </div>
        <div className="listing-note-body">
          <div className="evidence-row"><span className={`kind-label ${listing.kind}`}>{listing.kind}</span><span>{listing.status.replaceAll("_", " ")}</span></div>
          <h2>{listing.title}</h2>
          <dl className="evidence-meta">
            <div><dt>Item</dt><dd>{categoryLabel(listing.category)}</dd></div>
            <div><dt>Zone</dt><dd>{listing.zoneName}</dd></div>
            <div><dt>When</dt><dd>{relativeDate(listing.eventDate)}</dd></div>
          </dl>
        </div>
      </Link>
    </article>
  );
}
