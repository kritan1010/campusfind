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

- Phase 3: automatic match suggestions across mutual visibility boundaries,
  private finder proof questions, claimant answer submission, and finder
  accept/reject review. Acceptance changes a found listing to `claimed` and
  rejects other pending claims.

## In progress

- Phases 4 and 5 backend are live: comments, private conversations/messages,
  notifications, blocks, handover confirmations, reporting, moderation, college
  review helpers, and push-subscription persistence. The next UI pass should
  expand inbox/admin screens and connect a VAPID sender.

## Known risks and follow-ups

- Complete an end-to-end hosted-auth walkthrough with three real accounts before
  a public launch. The database visibility matrix is covered by pgTAP, but SMTP,
  browser permissions, and real Storage uploads depend on hosted configuration.
- Configure the production Supabase Auth Site URL/redirect allow-list and OTP
  email delivery before deploying.
- The private pin uses browser geolocation or manual coordinates; it intentionally
  avoids sending exact coordinates to a third-party map tile provider.
- Match suggestions are generated on listing creation. Editing a listing does
  not recompute existing suggestions; add a recompute workflow if listings become
  highly editable or the volume grows.
- Hosted Supabase Auth currently has Confirm email enabled, which sends a magic
  link instead of the product's six-digit OTP. Disable that setting in the Auth
  Email provider and use the six-digit OTP template before launch.
- The hosted Phase 1 schema existed before MCP migration history was inspected;
  Phase 2 is tracked remotely, while the local numbered migration remains the
  source of truth for clean environments.
