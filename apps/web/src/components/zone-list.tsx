"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

type Zone = { id: string; name: string };

export function ZoneList({ zones }: { zones: Zone[] }) {
  if (!zones.length) return <p className="text-sm italic text-[var(--muted-ink)]">No campus locations have been added yet.</p>;

  return (
    <ul className="zone-grid grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 list-none p-0 my-4">
      {zones.map((zone, index) => (
        <motion.li
          key={zone.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href={`/listings?zone=${zone.id}`}
            className="flex items-center gap-2 rounded-xl border border-[var(--manila-dark)]/30 bg-[var(--paper-bright)] px-3.5 py-2.5 text-xs font-semibold text-[var(--ink)] shadow-xs transition-all hover:bg-[var(--manila)]/30 hover:border-[var(--found)] hover:shadow-md"
          >
            <MapPin className="h-3.5 w-3.5 text-[var(--found)] shrink-0" />
            <span className="truncate">{zone.name}</span>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
