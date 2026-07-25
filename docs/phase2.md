# Phase 2 — Listings

Standalone doc. No other phase doc required in context.

## Context recap

CampusFind is a Next.js + Supabase lost-and-found platform. Phase 1 shipped
`profiles` (FK'd to `auth.users`, with `college_id` nullable and
`show_independent_posts boolean default true`), `colleges` (`status`
pending/approved/rejected, `publicly_discoverable boolean`), and `campus_zones`
— all RLS-enabled — plus email-OTP auth and college selection at onboarding.
This phase adds the actual Lost/Found listing objects: creation, images,
structured attributes, search, and the lifecycle state machine — **and is where
the community-visibility rule actually gets enforced**, since that rule lives on
the `listings` table.

### Visibility rule this phase must implement

A listing posted by user P is visible to viewer V if any of:
1. V and P belong to the same non-null college, OR
2. P is independent (`college_id is null`) and V is independent, OR
3. P is independent and V is college-affiliated and `V.show_independent_posts = true`, OR
4. P is college-affiliated and V is independent and `P`'s college has
   `publicly_discoverable = true`.

Cross-college (P and V affiliated with two *different* colleges) is **not**
visible in this version. A user always sees their own listings regardless of
the above (poster visibility is separate from browse visibility).

## Goal

Users can create a Lost or Found listing with photos, zone, optional exact pin,
and structured attributes; browse/search/filter listings; and a listing moves
through its lifecycle states.

## Schema — `supabase/migrations/0002_listings.sql`

```sql
create type listing_kind as enum ('lost', 'found');
create type listing_status as enum ('open', 'possible_match', 'claimed', 'return_pending', 'returned', 'closed');

create table listings (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references profiles(id) on delete cascade,
  kind listing_kind not null,
  status listing_status not null default 'open',
  title text not null,
  description text not null,
  category text not null,              -- 'electronics','bag','id_card','clothing','keys','other', etc.
  colour text,
  brand text,
  model text,
  event_date date not null,             -- date lost/found
  zone_id uuid references campus_zones(id),
  exact_lat double precision,           -- nullable, restricted visibility (see RLS)
  exact_lng double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0
);

-- normalized keyword/attribute table for matching in Phase 3
create table item_attributes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  key text not null,      -- 'keyword','serial_partial','distinguishing_mark', etc.
  value text not null
);

create index on listings (kind, status, category);
create index on listings (zone_id);
create index on item_attributes (listing_id);

alter table listings enable row level security;
alter table listing_images enable row level security;
alter table item_attributes enable row level security;

-- Helper function encoding the visibility rule from above. security definer +
-- stable so Postgres can use it efficiently inside an RLS policy without
-- re-triggering RLS on profiles/colleges for every row check.
create or replace function public.can_view_listing(p_poster_id uuid, p_viewer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_poster_id = p_viewer_id  -- always see your own
    or exists (
      select 1
      from profiles poster
      join profiles viewer on viewer.id = p_viewer_id
      left join colleges pc on pc.id = poster.college_id
      where poster.id = p_poster_id
        and (
          -- 1. same college
          (poster.college_id is not null and poster.college_id = viewer.college_id)
          -- 2. both independent
          or (poster.college_id is null and viewer.college_id is null)
          -- 3. independent poster, college viewer who hasn't opted out
          or (poster.college_id is null and viewer.college_id is not null and viewer.show_independent_posts)
          -- 4. college poster, independent viewer, college is publicly discoverable
          or (poster.college_id is not null and viewer.college_id is null and pc.publicly_discoverable)
        )
    );
$$;

-- listings: visibility rule above; only poster can write
create policy "listings readable per community visibility rule"
  on listings for select using (
    auth.role() = 'authenticated'
    and public.can_view_listing(poster_id, auth.uid())
  );
create policy "poster can insert own listing"
  on listings for insert with check (auth.uid() = poster_id);
create policy "poster can update own listing"
  on listings for update using (auth.uid() = poster_id);
create policy "poster can delete own listing"
  on listings for delete using (auth.uid() = poster_id);

-- images/attributes inherit the same visibility rule via the parent listing
create policy "images visible if parent listing is visible"
  on listing_images for select using (
    exists (
      select 1 from listings l
      where l.id = listing_id and public.can_view_listing(l.poster_id, auth.uid())
    )
  );
create policy "poster manages own listing images"
  on listing_images for all using (
    exists (select 1 from listings l where l.id = listing_id and l.poster_id = auth.uid())
  );
create policy "attributes visible if parent listing is visible"
  on item_attributes for select using (
    exists (
      select 1 from listings l
      where l.id = listing_id and public.can_view_listing(l.poster_id, auth.uid())
    )
  );
create policy "poster manages own listing attributes"
  on item_attributes for all using (
    exists (select 1 from listings l where l.id = listing_id and l.poster_id = auth.uid())
  );

create trigger listings_set_updated_at
  before update on listings
  for each row execute function moddatetime(updated_at); -- requires moddatetime extension
```

Note on `exact_lat`/`exact_lng`: stored on the row but the **public API/UI must
never render it** except to the poster and (post-claim) the accepted claimant —
that's an application-layer rule enforced in the select query/response shaping,
not RLS, since RLS can't easily do column-level hiding. Enforce it in a Postgres
`view` (`listings_public`) that nulls those two columns, and have the web app
query the view for browse/search and the base table only for the poster's own
listings. Views inherit the base table's RLS by default, so `listings_public`
automatically respects `can_view_listing` too — no separate visibility logic
needed in the view.

## Storage

Supabase Storage bucket `listing-images`, public read, insert restricted to
authenticated users, path convention `listing-images/{listing_id}/{uuid}.jpg`.

## Tasks

1. **Create/edit listing form** (`/listings/new`, `/listings/[id]/edit`) — kind
   toggle (Lost/Found), category select, description, colour/brand/model,
   event date picker, zone select, optional map pin (only shown/stored, never
   publicly rendered raw — see above), multi-image upload to Storage +
   `listing_images` rows, freeform keyword tags → `item_attributes` rows.
2. **Browse/feed** (`/listings`) — tabs for Lost/Found, infinite scroll or
   pagination, card shows title, category, approximate zone, thumbnail,
   relative date. RLS already restricts the result set per the visibility rule,
   so the feed query itself needs no manual filtering — just query
   `listings_public` as the signed-in user. For a college-affiliated user, add
   a small "show posts from people outside your college" toggle in feed
   settings that writes straight to `profiles.show_independent_posts`
   (server action, simple update).
3. **Search & filters** — category, zone, date range, kind; full-text search on
   `title`/`description` via Postgres `tsvector` generated column + GIN index.
4. **Listing detail** (`/listings/[id]`) — full description, image gallery,
   approximate zone (exact pin only if `auth.uid()` is the poster).
5. **Lifecycle transitions** exposed as explicit server actions, not raw table
   updates from the client: `closeListing(id)` (poster only, `open → closed`).
   Other transitions (`possible_match`, `claimed`, etc.) are driven by Phase 3/5
   logic — this phase only needs to guarantee `open` and `closed` work and that
   `status` can't be set arbitrarily by the client (wrap writes in a Postgres
   function or Next.js server action using the service role, not a raw client
   `.update()`).

## Acceptance criteria

- [ ] A signed-in user can create a listing with at least one image and it
      appears in `/listings` within the correct Lost/Found tab.
- [ ] `exact_lat`/`exact_lng` never appears in the JSON payload for any user who
      isn't the poster (check the network tab, not just the UI).
- [ ] Search returns relevant results for a partial title/description match.
- [ ] Filtering by zone + category narrows results correctly.
- [ ] A poster can close their own listing; a non-poster gets a permission error
      attempting the same server action.
- [ ] Deleting a listing cascades to its images and attributes (and ideally also
      removes the Storage objects — acceptable to defer object cleanup to a
      scheduled job if not done inline).
- [ ] **Community visibility**, tested with three accounts (College A student,
      College B student, independent):
  - [ ] College A student never sees College B's listings, and vice versa.
  - [ ] College A student sees independents' listings by default; toggling
        `show_independent_posts` off makes them disappear from their feed on
        next load.
  - [ ] Independent user sees other independents' listings always.
  - [ ] Independent user sees College A's listings only once
        `colleges.publicly_discoverable` is set true for College A (verify
        both states).
  - [ ] Every user can always see and manage their **own** listings regardless
        of the above.
