"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, PlusCircle, User, LogOut, Menu, X, ShieldCheck, MapPin } from "lucide-react";
import { signOut } from "@/app/actions";

export function BoardHeader({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/listings", label: "Browse board", icon: Compass },
    { href: "/listings/new", label: "Post an item", icon: PlusCircle, highlight: true },
    { href: "/onboarding", label: "Profile", icon: User },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <header className="topbar board-topbar sticky top-0 z-40 mb-8 pt-2">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-b-2 border-[var(--manila-dark)] bg-[var(--paper-bright)] px-5 py-3 shadow-md">
        <Link href="/" className="wordmark flex items-center gap-2.5 text-xl font-bold tracking-tight text-[var(--ink)] transition-transform hover:scale-[1.01] active:scale-95" aria-label="CampusFind home">
          <div className="flex h-7 w-7 items-center justify-center bg-[var(--manila)] text-[var(--found)] border border-[var(--manila-dark)]">
            <MapPin className="h-4 w-4 stroke-[2.5]" />
          </div>
          <span className="font-serif text-2xl">Campus<span className="text-[var(--found)] font-serif">Find</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="board-nav hidden items-center gap-2 md:flex" aria-label="Primary navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href) && link.href !== "/listings/new");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 border px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  link.highlight
                    ? "bg-[var(--found)] text-white border-[var(--found)] shadow-xs hover:bg-[#23533d] active:scale-95"
                    : isActive
                    ? "bg-[var(--manila)] text-[var(--ink)] border-[var(--manila-dark)] shadow-inner"
                    : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--manila)]/30 active:scale-95"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <form action={signOut} className="ml-2">
            <button
              className="flex items-center gap-1.5 border border-[var(--lost)]/40 bg-[var(--paper)] px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--lost)] transition-all hover:bg-[var(--lost)] hover:text-white active:scale-95 cursor-pointer"
              type="submit"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </form>
        </nav>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center border border-[var(--manila-dark)] bg-[var(--paper)] text-[var(--ink)] transition-transform md:hidden hover:bg-[var(--manila)]/30 active:scale-95"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-4 right-4 top-16 z-50 border-2 border-[var(--manila-dark)] bg-[var(--paper-bright)] p-4 shadow-xl md:hidden"
            >
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 border px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                        link.highlight
                          ? "bg-[var(--found)] text-white border-[var(--found)]"
                          : isActive
                          ? "bg-[var(--manila)] text-[var(--ink)] border-[var(--manila-dark)]"
                          : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--manila)]/20"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <form action={signOut} className="mt-2 pt-2 border-t border-[var(--line)]">
                  <button
                    className="flex w-full items-center gap-3 border border-[var(--lost)] bg-[var(--paper)] px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--lost)] hover:bg-[var(--lost)] hover:text-white"
                    type="submit"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </form>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
