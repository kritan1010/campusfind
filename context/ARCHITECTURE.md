# Architecture

## Frontend

- `apps/web/src/app` — Next.js App Router pages and server actions.
- `apps/web/src/app/listings` — feed, new/edit/detail routes, match leads,
  private claim flow, finder review, preference toggle, and lifecycle actions.
- `apps/web/src/components` — auth/onboarding components plus the evidence-board
  header, listing form, and listing cards.
- `apps/web/src/app/admin` — server-authorized college approval and Loyola
  Academy setup; it must not be treated as the only authorization layer.
- `apps/mobile` — Expo v57 thin client; uses SecureStore and the same Supabase
  project through `EXPO_PUBLIC_SUPABASE_URL` and publishable key.
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
- `supabase/migrations/0005_communication.sql` and
  `0006_returns_moderation.sql` — conversations, notifications, handovers,
  reports, moderation actions, blocks, and college-review functions.
- `supabase/migrations/0007_mobile_push.sql` — user-owned Expo device tokens.
- `supabase/tests/database` — schema, grants, RLS, visibility, privacy, lifecycle,
  and cascade contracts.
- `listing-images` — public-read image bucket. Writes are limited to
  `{listing_id}/...` folders whose listing belongs to the current user.

## Solver and matching

`supabase/migrations/0004_phase_3_matching_claims.sql` adds the matching and
claim tables. A listing-insert trigger scores opposite-kind open listings only
when both posters can see each other. The score combines category, date, zone,
colour, brand/model, and keyword overlap. Found-item claims flow through guarded
functions: narrow question read, atomic claim/answer creation, and finder-only
accept/reject decisions.
