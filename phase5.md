# Phase 5 — Returns & Moderation

Standalone doc. No other phase doc required in context.

## Context recap

CampusFind is a Next.js + Supabase lost-and-found platform. By this phase a
listing can reach `status = 'claimed'` (Phase 3) and users can chat/comment
(Phase 4). `profiles.is_admin` and the `colleges` table (with `status`
pending/approved/rejected) were already created in Phase 1. This phase adds the
two-party handover confirmation that closes the loop, plus admin moderation
tooling — **including the college-approval queue** — and web push.

## Goal

Once a claim is accepted, both the finder and claimant independently confirm the
physical handover happened; the listing then becomes `returned`. A small admin
team can review reports and take moderation action. Users can opt into web push
notifications.

## Schema — `supabase/migrations/0005_returns_moderation.sql`

```sql
create table handover_confirmations (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  confirmed_by uuid not null references profiles(id) on delete cascade,
  confirmed_at timestamptz default now(),
  unique (claim_id, confirmed_by)
);

create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  reason text not null,
  details text,
  status report_status not null default 'open',
  created_at timestamptz default now()
);

create table moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete set null,
  admin_id uuid not null references profiles(id),
  action text not null,          -- 'warn','suspend_user','remove_listing','dismiss'
  target_user_id uuid references profiles(id),
  target_listing_id uuid references listings(id),
  notes text,
  created_at timestamptz default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table handover_confirmations enable row level security;
alter table reports enable row level security;
alter table moderation_actions enable row level security;
alter table push_subscriptions enable row level security;

create policy "confirm own handover"
  on handover_confirmations for insert with check (confirmed_by = auth.uid());
create policy "view handover if party to the claim"
  on handover_confirmations for select using (
    exists (
      select 1 from claims c join listings l on l.id = c.listing_id
      where c.id = claim_id and (c.claimant_id = auth.uid() or l.poster_id = auth.uid())
    )
  );

create policy "user creates own report"
  on reports for insert with check (reporter_id = auth.uid());
create policy "reporter or admin can view report"
  on reports for select using (
    reporter_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );
create policy "admin can update report"
  on reports for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "admin only on moderation_actions"
  on moderation_actions for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "manage own push subscription"
  on push_subscriptions for all using (user_id = auth.uid());
```

## Tasks

1. **Handover confirmation UI**: on a `claimed` listing, both the finder and the
   accepted claimant see a "Confirm handover" button. Insert into
   `handover_confirmations`. A Postgres trigger/RPC checks: once both party rows
   exist for the claim, flip `listings.status` to `returned` (transition through
   `return_pending` when only one side has confirmed — set that on the first
   confirmation).
2. **Admin dashboard** (`/admin`, gated by `profiles.is_admin`) — reports queue
   (open → reviewing → resolved/dismissed), per-report detail showing the
   reported listing/user and reporter's reason, action buttons that insert a
   `moderation_actions` row and apply the effect (e.g. `remove_listing` sets
   `listings.status = 'closed'`, `suspend_user` — simplest v1 implementation is
   revoking the user's Supabase session + a `profiles.suspended boolean` flag
   checked at login).
3. **College requests queue** (`/admin/colleges`) — list of `colleges` where
   `status = 'pending'`, each showing the requester's profile and how many
   other users already share that `college_id` (a rough duplicate/demand
   signal). Actions: **Approve** (`status = 'approved'`, sets
   `reviewed_by`/`reviewed_at`) makes it appear in the Phase 1 onboarding
   picker for new signups; **Reject** (`status = 'rejected'`) leaves existing
   members attached (they keep using the platform, the college just never
   becomes publicly listed or discoverable). A separate toggle on each
   **approved** college flips `publicly_discoverable` — this is the switch that
   lets independent users see that college's posts, and stays admin-only in
   this version since there's no college-level moderator role yet.
4. **Report entry point** on listings/profiles/conversations — reason select +
   free-text details → `reports` insert.
5. **Web push**: VAPID keypair generated once, service worker
   (`public/sw.js`) subscribes via `PushManager`, subscription saved to
   `push_subscriptions`. Server-side sender (Next.js API route or edge function)
   triggered from the same events that create `notifications` rows in Phase 4 —
   fan out to `push_subscriptions` for that `user_id` using `web-push` npm
   package.

## Acceptance criteria

- [ ] Both parties confirming a handover moves the listing to `returned`; only
      one party confirming leaves it at `return_pending`.
- [ ] A non-admin hitting `/admin` or calling an admin RPC/policy-protected
      write is rejected.
- [ ] Filing a report creates a row visible to the reporter and to admins, not
      to the reported user.
- [ ] Approving a pending college makes it appear in the Phase 1 onboarding
      picker for a brand-new signup; rejecting it does not, but existing
      members keep working normally.
- [ ] Flipping `publicly_discoverable` on for an approved college makes that
      college's listings appear in an independent test user's feed on next
      load; flipping it off hides them again.
- [ ] An admin resolving a report with `remove_listing` sets that listing's
      status to `closed` and the poster can no longer edit it.
- [ ] Subscribing to push and triggering a `new_message` notification results in
      an actual browser push notification in a manual test.
