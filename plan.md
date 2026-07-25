# CampusFind — Master Plan

This is the index. Each phase has its own standalone doc (`phase1.md`–`phase6.md`)
written to be handed to a separate AI coding agent with **no dependency on the
other phase docs being in context** — each restates the schema slice, conventions,
and acceptance criteria it needs. Use this file for the big picture and for
things that are genuinely global (repo layout, naming, RLS conventions, env vars).

## Stack lock-in

- **Web**: Next.js (App Router), TypeScript, Tailwind
- **Backend**: Supabase — Postgres, Auth (email OTP), Realtime, Storage, RLS
- **Mobile**: Expo (React Native), Phase 6 only
- **Notifications**: in-app table + email (Supabase/Resend) + Web Push (VAPID) → native push in Phase 6

## Repo layout convention

```
campusfind/
  apps/
    web/            # Next.js app
    mobile/         # Expo app (Phase 6)
  supabase/
    migrations/      # numbered SQL migrations
    seed.sql
  docs/
    abstract.md
    plan.md
    phase1.md ... phase6.md
```

## Global conventions (every phase must follow these)

- **Migrations**: one numbered SQL file per phase minimum, e.g.
  `0001_foundation.sql`, `0002_listings.sql`. Never edit a shipped migration —
  append a new one.
- **RLS is on for every table, no exceptions.** Default-deny, then add explicit
  policies. If a phase adds a table without an RLS policy, that phase is not done.
- **IDs**: `uuid default gen_random_uuid()` everywhere, FK to `profiles.id` for
  the user reference (which itself FKs `auth.users.id`).
- **Timestamps**: `created_at timestamptz default now()` on every table;
  `updated_at` + trigger where rows are mutable.
- **Naming**: snake_case in SQL, camelCase in TS, kebab-case for routes.
- **Secrets**: `.env.local` for web, `supabase/.env` for local Supabase CLI — never
  commit either. Only `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public.

## Full data model (reference — see individual phase docs for which tables they own)

`colleges`, `profiles`, `campus_zones`, `listings`, `listing_images`,
`item_attributes`, `match_suggestions`, `comments`, `conversations`,
`conversation_members`, `messages`, `claims`, `proof_questions`,
`proof_answers`, `handover_confirmations`, `notifications`,
`push_subscriptions`, `reports`, `user_blocks`, `moderation_actions`.

## Community model (reference)

Every user is either **college-affiliated** (`profiles.college_id` set) or
**independent** (`college_id` null). Colleges are added via self-serve request
+ admin approval (`colleges.status`). Listing visibility is governed by
`public.can_view_listing(poster_id, viewer_id)`, introduced in Phase 2:

- Same college → always visible.
- Independent ↔ independent → always visible.
- Independent poster → college viewer: visible unless the viewer set
  `show_independent_posts = false`.
- College poster → independent viewer: visible only if that college has
  `publicly_discoverable = true`.
- Different colleges → never visible (not in scope for this version).

This same function gates both the `listings` feed (Phase 2) and match
suggestion generation (Phase 3) — a user is never matched to a listing they
wouldn't otherwise be able to see.

## Listing lifecycle (reference)

```
Open -> PossibleMatch -> Claimed -> ReturnPending -> Returned
Claimed -> Open        (claim rejected)
Open -> Closed          (poster closes)
```

## Phase index

| Phase | Doc | Owns tables | Depends on (runtime, not doc) |
|---|---|---|---|
| 1 — Foundation | `phase1.md` | `colleges`, `profiles`, `campus_zones` | — |
| 2 — Listings | `phase2.md` | `listings`, `listing_images`, `item_attributes` | Phase 1 schema live |
| 3 — Matching & Claims | `phase3.md` | `match_suggestions`, `claims`, `proof_questions`, `proof_answers` | Phase 2 schema live |
| 4 — Communication | `phase4.md` | `comments`, `conversations`, `conversation_members`, `messages`, `notifications`, `user_blocks` | Phase 2 schema live |
| 5 — Returns & Moderation | `phase5.md` | `handover_confirmations`, `reports`, `moderation_actions`, `push_subscriptions` | Phase 3 + 4 schema live |
| 6 — Mobile | `phase6.md` | none (consumes existing backend) | Phases 1–5 backend complete |

"Depends on" is a **runtime/schema** dependency, not a doc-reading dependency — an
agent building Phase 3 needs the Phase 2 tables to exist in the DB, but does not
need to read `phase2.md`; the slice it needs is repeated in `phase3.md`.

## Definition of done, per phase

A phase is done when:
1. Its migration file applies cleanly to a fresh DB with all prior phase migrations.
2. Every new table has RLS policies covering select/insert/update/delete for the
   correct roles.
3. Its listed screens/routes are implemented and manually walk-throughable.
4. Its acceptance criteria checklist (in the phase doc) is fully checked.

## Suggested build order

Sequential for a solo build: 1 → 2 → 3 → 4 → 5 → 6.
For parallel agents: Phase 1 solo first (blocking), then 2 can start; once 2's
migration is merged, 3 and 4 can run in parallel; 5 waits on both 3 and 4; 6 waits
on 5.
