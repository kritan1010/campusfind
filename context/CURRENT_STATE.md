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

- Phases 4 and 5 database foundations are live: comments, private
  conversations/messages, notifications, blocks, handover confirmations,
  reporting, moderation, college review helpers, and push-subscription storage.
- Phase 6 ships an Expo mobile client in `apps/mobile` with secure session
  persistence, OTP/password sign-in, a server-backed listing feed, and profile
  sign-out. It needs a separate Expo build/release before it is user-facing.
- `/admin` is a real server-authorized web route. The account
  `kritansingh1010@gmail.com` is an admin in the hosted database. It can add or
  approve Loyola Academy and review pending college requests.
- The web dashboard now fetches campus zones server-side with the profile,
  removing its former client-side post-hydration fetch. App Router route loading
  feedback is in `apps/web/src/app/loading.tsx`.

## In progress

- A full inbox, message composer, moderation/report queues, and robust admin
  controls still need production UI. `startConversation` currently redirects to
  `/inbox/[id]`, which has not been implemented.
- The evidence-board visual treatment is intentional but needs a wider product
  design pass if it does not fit the desired CampusFind direction.

## Known risks and follow-ups

- Complete an end-to-end hosted-auth walkthrough with three real accounts before
  a public launch. The database visibility matrix is covered by pgTAP, but SMTP,
  browser permissions, and real Storage uploads depend on hosted configuration.
- Hosted Supabase Auth must retain Site URL
  `https://campus-find-main.vercel.app` and the `/login/verify` redirect URL.
  The Magic Link template must use `{{ .Token }}` to match the OTP screen.
- Default Supabase email delivery is capped. Configure Resend custom SMTP for
  any multi-user demo; Resend's test sender can only be used for the owner email.
- The private pin uses browser geolocation or manual coordinates; it intentionally
  avoids sending exact coordinates to a third-party map tile provider.
- Match suggestions are generated on listing creation. Editing a listing does
  not recompute existing suggestions; add a recompute workflow if listings become
  highly editable or the volume grows.
- Demo/admin creation needs a service-role key and the one-time
  `scripts/create-demo-users.mjs` command. Never put that key in Vercel or Expo
  public variables.
