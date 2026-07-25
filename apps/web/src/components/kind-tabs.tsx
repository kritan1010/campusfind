"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function KindTabs({ activeKind }: { activeKind: "lost" | "found" }) {
  return (
    <div className="kind-tabs-wrapper my-6 flex justify-center">
      <div className="inline-flex border-2 border-[var(--manila-dark)] bg-[var(--paper-bright)] p-1 shadow-sm">
        <Link
          href="/listings?kind=lost"
          className={`relative flex items-center gap-2 border px-6 py-2 text-xs font-mono font-bold uppercase tracking-widest transition-all ${
            activeKind === "lost"
              ? "bg-[var(--lost)] text-white border-[var(--lost)] shadow-xs"
              : "bg-[var(--paper)] text-[var(--ink)] border-transparent hover:bg-[var(--manila)]/30"
          }`}
        >
          <AlertCircle className={`h-3.5 w-3.5 ${activeKind === "lost" ? "text-white" : "text-[var(--lost)]"}`} />
          <span>Lost Items</span>
        </Link>

        <Link
          href="/listings?kind=found"
          className={`relative flex items-center gap-2 border px-6 py-2 text-xs font-mono font-bold uppercase tracking-widest transition-all ${
            activeKind === "found"
              ? "bg-[var(--found)] text-white border-[var(--found)] shadow-xs"
              : "bg-[var(--paper)] text-[var(--ink)] border-transparent hover:bg-[var(--manila)]/30"
          }`}
        >
          <CheckCircle2 className={`h-3.5 w-3.5 ${activeKind === "found" ? "text-white" : "text-[var(--found)]"}`} />
          <span>Found Items</span>
        </Link>
      </div>
    </div>
  );
}
