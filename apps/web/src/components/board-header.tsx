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
    <header className="topbar board-topbar sticky top-4 z-40 px-2 sm:px-4 mb-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-[var(--line)] bg-[var(--paper-bright)]/85 px-4 py-2.5 shadow-lg backdrop-blur-md transition-all duration-300">
        <Link href="/" className="wordmark flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--ink)] transition-transform hover:scale-[1.02] active:scale-95" aria-label="CampusFind home">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--manila)]/30 text-[var(--found)] shadow-inner">
            <MapPin className="h-4 w-4 stroke-[2.5]" />
          </div>
          <span>Campus<span className="text-[var(--found)]">Find</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="board-nav hidden items-center gap-1.5 md:flex" aria-label="Primary navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href) && link.href !== "/listings/new");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  link.highlight
                    ? "bg-[var(--found)] text-[var(--paper-bright)] shadow-md hover:bg-[#23533d] hover:shadow-lg active:scale-95"
                    : isActive
                    ? "bg-[var(--manila)]/40 text-[var(--ink)] font-bold shadow-sm"
                    : "text-[var(--muted-ink)] hover:bg-[var(--manila)]/20 hover:text-[var(--ink)] active:scale-95"
                }`}
              >
                <Icon className={`h-4 w-4 ${link.highlight ? "text-[var(--paper-bright)]" : "text-current"}`} />
                <span>{link.label}</span>
                {isActive && !link.highlight && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-full border border-[var(--manila-dark)]/40 bg-[var(--manila)]/30 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          <form action={signOut} className="ml-2">
            <button
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--lost)] transition-all duration-200 hover:bg-[var(--lost)]/10 hover:text-[#842a23] active:scale-95 cursor-pointer"
              type="submit"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </form>
        </nav>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] transition-transform md:hidden hover:bg-[var(--manila)]/30 active:scale-95"
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
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="absolute left-4 right-4 top-18 z-50 rounded-2xl border border-[var(--manila-dark)]/40 bg-[var(--paper-bright)] p-4 shadow-2xl md:hidden"
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
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all ${
                        link.highlight
                          ? "bg-[var(--found)] text-[var(--paper-bright)] shadow-md"
                          : isActive
                          ? "bg-[var(--manila)]/40 text-[var(--ink)] font-bold"
                          : "text-[var(--ink)] hover:bg-[var(--manila)]/20"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <form action={signOut} className="mt-2 pt-2 border-t border-[var(--line)]">
                  <button
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-[var(--lost)] hover:bg-[var(--lost)]/10"
                    type="submit"
                  >
                    <LogOut className="h-5 w-5" />
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
