# Current state

Last updated: 2026-07-25

## Working

- Phase 1: Next.js scaffold, six-digit email OTP, protected routes, profile and
  college onboarding, independent membership, campus zones, and RLS.
- Phase 2: Lost/Found listing create and edit flows, 1–6 image uploads, category
  and keyword attributes, campus zone plus optional private geolocation pin,
  paginated feed, kind/category/zone/date filters, prefix full-text search,
  detail gallery, owner edit/delete/close controls, and the independent-posts
  preference.
- Postgres is the authorization boundary. The hosted Supabase project has the
  Phase 2 migration and twelve campus zones. Exact coordinates are omitted from
  `listings_public` and only returned to the poster through a guarded function.
- The web app reads both supported publishable-key environment variable names;
  `apps/web/.env.local` is intentionally untracked and must not be removed.

## In progress

- No product phase is actively in progress. Phase 3 (matching and claims) is the
  next planned phase in `docs/phase3.md`.

## Known risks and follow-ups

- Complete an end-to-end hosted-auth walkthrough with three real accounts before
  a public launch. The database visibility matrix is covered by pgTAP, but SMTP,
  browser permissions, and real Storage uploads depend on hosted configuration.
- Configure the production Supabase Auth Site URL/redirect allow-list and OTP
  email delivery before deploying.
- The private pin uses browser geolocation or manual coordinates; it intentionally
  avoids sending exact coordinates to a third-party map tile provider.
- The hosted Phase 1 schema existed before MCP migration history was inspected;
  Phase 2 is tracked remotely, while the local numbered migration remains the
  source of truth for clean environments.
