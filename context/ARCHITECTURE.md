# Architecture

## Frontend

- `apps/web/src/app` — Next.js App Router pages and server actions.
- `apps/web/src/app/listings` — feed, new/edit/detail routes, preference toggle,
  and close/delete server actions.
- `apps/web/src/components` — auth/onboarding components plus the evidence-board
  header, listing form, and listing cards.
- `apps/web/src/lib/listings` — listing constants, validation, keyword cleanup,
  and prefix-search query shaping.
- `apps/web/src/lib/supabase` — lazy browser/server clients, environment parsing,
  session proxy integration, and generated-equivalent database types.

## API and authorization

The application uses Supabase's Data API through `@supabase/ssr`; there is no
separate custom API server. Browser mutations use the signed-in session and are
constrained by grants plus Row Level Security. Sensitive lifecycle operations use
Next.js server actions which re-authenticate, then call ownership-checked Postgres
functions. The session-refresh boundary is `apps/web/src/proxy.ts`.

## Database and Storage

- `supabase/migrations/0001_foundation.sql` — colleges, profiles, campus zones,
  onboarding helpers, triggers, grants, and policies.
- `supabase/migrations/0002_listings.sql` — listing enums/tables, generated
  `tsvector`, indexes, community visibility helper, safe public view, owner-only
  exact-location RPC, close transition, RLS/grants, and Storage bucket policies.
- `supabase/seed.sql` — twelve campus zones.
- `supabase/tests/database` — schema, grants, RLS, visibility, privacy, lifecycle,
  and cascade contracts.
- `listing-images` — public-read image bucket. Writes are limited to
  `{listing_id}/...` folders whose listing belongs to the current user.

## Solver and matching

No matching solver is implemented yet. Phase 3 will add `match_suggestions`,
claims, proof questions/answers, and its scorer. It must reuse
`public.can_view_listing`; suggestions must never cross a visibility boundary.
