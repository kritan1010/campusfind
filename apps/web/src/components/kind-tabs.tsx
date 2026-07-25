"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function KindTabs({ activeKind }: { activeKind: "lost" | "found" }) {
  return (
    <div className="kind-tabs-wrapper my-6 flex justify-center">
      <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--paper-bright)] p-1.5 shadow-md">
        <Link
          href="/listings?kind=lost"
          className={`relative flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold tracking-wide transition-colors ${
            activeKind === "lost" ? "text-[var(--paper-bright)]" : "text-[var(--muted-ink)] hover:text-[var(--ink)]"
          }`}
        >
          <AlertCircle className={`h-4 w-4 relative z-10 ${activeKind === "lost" ? "text-white" : "text-[var(--lost)]"}`} />
          <span className="relative z-10 uppercase tracking-widest font-mono text-xs">Lost Items</span>
          {activeKind === "lost" && (
            <motion.div
              layoutId="kindTabPill"
              className="absolute inset-0 rounded-full bg-[var(--lost)] shadow-md"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
        </Link>

        <Link
          href="/listings?kind=found"
          className={`relative flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold tracking-wide transition-colors ${
            activeKind === "found" ? "text-[var(--paper-bright)]" : "text-[var(--muted-ink)] hover:text-[var(--ink)]"
          }`}
        >
          <CheckCircle2 className={`h-4 w-4 relative z-10 ${activeKind === "found" ? "text-white" : "text-[var(--found)]"}`} />
          <span className="relative z-10 uppercase tracking-widest font-mono text-xs">Found Items</span>
          {activeKind === "found" && (
            <motion.div
              layoutId="kindTabPill"
              className="absolute inset-0 rounded-full bg-[var(--found)] shadow-md"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
        </Link>
      </div>
    </div>
  );
}
