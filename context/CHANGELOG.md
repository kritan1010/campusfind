# Context changelog

## 2026-07-25 — Final handoff: mobile, auth, and admin

- Added the Expo mobile app, secure Supabase session adapter, mobile auth/feed,
  and hosted `device_push_tokens` schema.
- Added Magic Link callback handling and optional password sign-in for provisioned
  demo/admin users. Documented production OTP, SMTP, Vercel, and demo setup.
- Added a server-rendered zone list, route loading state, and protected `/admin`
  college-management UI. Promoted `kritansingh1010@gmail.com` to hosted admin.

## 2026-07-25 — Phases 4 and 5 foundations

- Added secure comments, member conversations/messages, notification triggers,
  blocks, and guarded conversation startup.
- Added handover confirmation, reporting, moderation/college review helpers,
  suspension state, and persisted web-push subscriptions.

## 2026-07-25 — Phase 3 matching and claims

- Added automatic, mutually visible Lost/Found match suggestions and match dismissal.
- Added private proof questions, claimant answer flow, and finder accept/reject review.
- Added guarded Postgres functions so proof answers and claim decisions cannot be
  forged through raw client-table writes.

## 2026-07-25 — Phase 2 listings

- Added the listing schema, safe view, full-text index, image bucket, explicit
  grants/RLS, community visibility function, private-coordinate RPC, and guarded
  close transition.
- Added listing create/edit/feed/search/filter/detail/delete/close flows and the
  outside-college preference control in the evidence-board visual system.
- Added validation tests and a three-community database authorization matrix.
- Applied Phase 2 and campus-zone seed data to the connected hosted Supabase
  project.
- Moved planning/product references under `docs/` and added this handoff folder.

## 2026-07-24 — Phase 1 foundation

- Added OTP auth, profiles, college onboarding, campus zones, protected routes,
  typed Supabase clients, foundation RLS/grants, seed data, and tests.
