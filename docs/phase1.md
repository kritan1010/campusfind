# Phase 1 — Foundation

Standalone doc. No other phase doc required in context.

## Context recap

CampusFind is a Next.js + Supabase lost-and-found platform. Auth is passwordless
email OTP — any OTP-verified email is eligible, no institutional verification.
This phase lays the schema, auth, and project skeleton everything else builds on.

## Goal

Working Next.js app with Supabase email-OTP login, a `profiles` table synced to
`auth.users`, a `colleges` table with self-serve request + admin approval, a
`campus_zones` table, and RLS wired correctly from day one.

## Community model (read this before writing schema)

CampusFind users fall into two kinds, decided at signup:

- **College-affiliated**: picks an approved college from a search list, or — if
  their college isn't listed — types its name to **request** it. The request
  creates the college in `pending` status immediately and the user is attached
  to it right away (their own community works immediately; approval only
  controls whether that college shows up in the picker for *future* signups and
  whether independents can discover it — see below).
- **Independent** ("regular person"): no college, `college_id` is null.

Visibility rule, enforced later in Phase 2's `listings` RLS, defined here since
it depends on this table:

- A college-affiliated viewer sees listings from their **own college always**,
  plus **independents' listings unless they've opted out**
  (`profiles.show_independent_posts`, default `true`).
- An independent viewer sees other **independents' listings always**, plus a
  college's listings **only if that college is `publicly_discoverable`**.
- Cross-college visibility (College A seeing College B) is **closed** in this
  version — not asked for, easy to open later by relaxing the RLS clause in
  Phase 2.

## Tasks

### 1. Project scaffold
```
npx create-next-app@latest apps/web --typescript --tailwind --app
cd apps/web && npm install @supabase/supabase-js @supabase/ssr
```
Set up `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts`
(server client using `@supabase/ssr`'s cookie helpers) — do not use the deprecated
auth-helpers package.

### 2. Supabase project + local CLI
```
supabase init
supabase link --project-ref <ref>
```
`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Migration `supabase/migrations/0001_foundation.sql`
```sql
create type college_status as enum ('pending', 'approved', 'rejected');

create table colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status college_status not null default 'pending',
  publicly_discoverable boolean not null default false,  -- can independents see this college's posts?
  requested_by uuid references auth.users(id),
  reviewed_by uuid,                -- FK to profiles added after profiles exists, see below
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  college_id uuid references colleges(id),          -- null = independent user
  show_independent_posts boolean not null default true,  -- only meaningful if college_id is set
  is_admin boolean not null default false,           -- small fixed platform team, promoted manually via SQL
  created_at timestamptz default now()
);

alter table colleges add constraint colleges_reviewed_by_fkey
  foreign key (reviewed_by) references profiles(id);

create table campus_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,       -- e.g. "Block C", "Main Library"
  centroid_lat double precision,
  centroid_lng double precision,
  created_at timestamptz default now()
);

alter table colleges enable row level security;
alter table profiles enable row level security;
alter table campus_zones enable row level security;

-- colleges: approved ones are public; pending/rejected only visible to their
-- requester and admins (stops the picker filling up with junk/duplicate requests)
create policy "approved colleges visible to all authenticated"
  on colleges for select using (
    status = 'approved' and auth.role() = 'authenticated'
  );
create policy "requester or admin can see pending/rejected college"
  on colleges for select using (
    requested_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );
create policy "any authenticated user can request a college"
  on colleges for insert with check (
    auth.role() = 'authenticated' and requested_by = auth.uid() and status = 'pending'
  );
create policy "admin can review a college"
  on colleges for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- profiles: a user can read any profile's public fields, but only edit their own
create policy "profiles are viewable by anyone authenticated"
  on profiles for select using (auth.role() = 'authenticated');
create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- campus_zones: read-only to all authenticated users, no client writes
create policy "zones are viewable by anyone authenticated"
  on campus_zones for select using (auth.role() = 'authenticated');
```

Note: a user can freely set their own `college_id` to any college they can
*see* (approved, or their own pending request) via the normal profile update
policy — that's intentional, joining a college doesn't need admin gatekeeping,
only *listing a brand-new college for others to find* does.

### 4. Auto-create profile on signup
Trigger on `auth.users` insert that inserts a stub `profiles` row
(`display_name` defaulted from email local-part), so the app never has to
handle a "no profile yet" race:
```sql
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 5. Email OTP auth flow (Next.js)
- `/login` — email input → `supabase.auth.signInWithOtp({ email })`
- `/login/verify` — 6-digit code input → `supabase.auth.verifyOtp({ email, token, type: 'email' })`
- Middleware (`middleware.ts`) refreshing the session cookie on every request via
  `@supabase/ssr`, redirecting unauthenticated users away from any route except
  `/login*`.
- `/onboarding` — set display name + avatar, **and college affiliation**:
  - Typeahead search over `colleges where status = 'approved'`.
  - "Can't find your college?" link → text input → inserts a `colleges` row
    (`status: 'pending'`, `requested_by: auth.uid()`), then sets
    `profiles.college_id` to it immediately.
  - "Continue without a college" → leaves `college_id` null, independent user.
  - A profile with a `college_id` pointing at a still-`pending` college works
    normally within its own community the whole time — pending only gates the
    *public picker* and *independent discoverability*, not the student's own
    access.

### 6. Seed campus zones
`supabase/seed.sql` with 8–15 zones typical of a campus (blocks, library, canteen,
sports complex, hostel blocks, main gate) — placeholder lat/lng is fine, real
coordinates get added manually later.

## Acceptance criteria

- [ ] `supabase db reset` applies `0001_foundation.sql` + seed cleanly.
- [ ] Signing up with a new email sends a 6-digit OTP and logging in creates a
      `profiles` row automatically.
- [ ] A signed-out user hitting any route other than `/login*` is redirected to
      `/login`.
- [ ] A signed-in user can view any profile's `display_name`/`avatar_url` but
      cannot update anyone else's row (verify via Supabase SQL editor with a
      second test user).
- [ ] `campus_zones` list is fetchable client-side and populated with seed data.
- [ ] Requesting a new college creates a `pending` row and immediately attaches
      it to the requester's `college_id`.
- [ ] A second, unrelated user **cannot** see that pending college in a plain
      `select * from colleges` (verify via SQL editor as that user — only
      `approved` rows and their own requested rows should return).
- [ ] "Continue without a college" leaves `profiles.college_id` null and the
      onboarding flow completes normally.
- [ ] A non-admin user attempting to `update` a college's `status` is rejected.
