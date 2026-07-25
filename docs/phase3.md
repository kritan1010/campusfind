# Phase 3 — Matching & Claims

Standalone doc. No other phase doc required in context.

## Context recap

CampusFind is a Next.js + Supabase lost-and-found platform. By this phase,
`listings` (kind: lost/found, status enum, category/colour/brand/model/event_date/
zone_id/exact_lat/exact_lng), `listing_images`, and `item_attributes` exist and
are RLS-protected, readable by any authenticated user, writable only by the
poster. This phase adds automatic match suggestions and the claim/proof-question
verification flow.

## Goal

Open listings get scored against opposite-kind listings automatically. A
found-item poster attaches private proof questions. A claimant answers them; the
finder accepts or rejects; on accept the listing status becomes `claimed`.

## Schema — `supabase/migrations/0003_matching_claims.sql`

```sql
create table match_suggestions (
  id uuid primary key default gen_random_uuid(),
  lost_listing_id uuid not null references listings(id) on delete cascade,
  found_listing_id uuid not null references listings(id) on delete cascade,
  score numeric not null,             -- 0..1, see scoring breakdown below
  dismissed_by_lost_poster boolean default false,
  dismissed_by_found_poster boolean default false,
  created_at timestamptz default now(),
  unique (lost_listing_id, found_listing_id)
);

create type claim_status as enum ('pending', 'accepted', 'rejected');

create table claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,  -- the found listing being claimed
  claimant_id uuid not null references profiles(id) on delete cascade,
  status claim_status not null default 'pending',
  created_at timestamptz default now(),
  decided_at timestamptz
);

create table proof_questions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  question text not null,
  position smallint not null default 0
);

create table proof_answers (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  proof_question_id uuid not null references proof_questions(id) on delete cascade,
  answer text not null,
  created_at timestamptz default now(),
  unique (claim_id, proof_question_id)
);

alter table match_suggestions enable row level security;
alter table claims enable row level security;
alter table proof_questions enable row level security;
alter table proof_answers enable row level security;

-- match_suggestions: visible only to the two posters involved
create policy "match visible to involved posters"
  on match_suggestions for select using (
    exists (select 1 from listings l where l.id = lost_listing_id and l.poster_id = auth.uid())
    or exists (select 1 from listings l where l.id = found_listing_id and l.poster_id = auth.uid())
  );

-- proof_questions: NEVER readable by anyone except the found-listing poster.
-- Claimants answer blind by question text served through a server action, not
-- direct table select — see Tasks section.
create policy "proof questions visible only to poster"
  on proof_questions for select using (
    exists (select 1 from listings l where l.id = listing_id and l.poster_id = auth.uid())
  );
create policy "poster manages own proof questions"
  on proof_questions for all using (
    exists (select 1 from listings l where l.id = listing_id and l.poster_id = auth.uid())
  );

-- claims: visible to the claimant and the found-listing's poster only
create policy "claim visible to claimant or poster"
  on claims for select using (
    claimant_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.poster_id = auth.uid())
  );
create policy "user can create own claim"
  on claims for insert with check (claimant_id = auth.uid());
create policy "poster can update claim status"
  on claims for update using (
    exists (select 1 from listings l where l.id = listing_id and l.poster_id = auth.uid())
  );

-- proof_answers: visible to the claimant who wrote them and the poster judging them
create policy "answers visible to claimant or judging poster"
  on proof_answers for select using (
    exists (select 1 from claims c where c.id = claim_id and c.claimant_id = auth.uid())
    or exists (
      select 1 from claims c join listings l on l.id = c.listing_id
      where c.id = claim_id and l.poster_id = auth.uid()
    )
  );
create policy "claimant inserts own answers"
  on proof_answers for insert with check (
    exists (select 1 from claims c where c.id = claim_id and c.claimant_id = auth.uid())
  );
```

## Scoring engine (server-side, not client)

**Community boundary first, score second.** Before scoring, filter candidate
listings to only those visible to *both* posters under Phase 1/2's
`public.can_view_listing(poster_id, viewer_id)` rule (same college, or
independent-with-independent, or independent-with-opted-in-college, etc.) — if
a college student wouldn't see an independent's post in their feed, they
shouldn't get matched to it either. Concretely: only generate a
`match_suggestions` row for `(lost, found)` pairs where
`can_view_listing(found.poster_id, lost.poster_id) and can_view_listing(lost.poster_id, found.poster_id)`
both hold (visibility can be asymmetric — e.g. independent-to-opted-in-college
vs. college-to-independent — so check both directions).

Run as a Postgres function or a Next.js server action/cron triggered on new
listing insert (`open` listings of the opposite kind, same-ish category):

| Signal | Weight |
|---|---|
| Category exact match | 0.30 |
| Date proximity (≤3 days = full, decays to 0 at 21 days) | 0.20 |
| Zone match / distance (same zone = full, decays with distance) | 0.20 |
| Colour match | 0.10 |
| Brand+model match | 0.10 |
| Keyword overlap (`item_attributes`, Jaccard similarity) | 0.10 |

Insert a `match_suggestions` row when total score ≥ 0.4; surface top matches
sorted by score in the UI. Recompute on new listing creation only (no need for a
live recompute loop in this phase).

## Tasks

1. **Matching job**: on found/lost listing creation, score against all open
   listings of the opposite kind **that pass the mutual-visibility check
   above**, upsert `match_suggestions` above threshold.
2. **Suggested matches UI** (`/listings/[id]/matches`) — shown only to the
   listing's own poster, ranked by score, each with a dismiss action
   (`dismissed_by_*_poster`).
3. **Proof questions editor** — found-item poster attaches 1–5 questions when
   creating/editing a Found listing. Never rendered to anyone but the poster.
4. **Claim flow**: claimant clicks "This is mine" on a Found listing → server
   action fetches proof question *texts* (not full row, just `id`+`question`) for
   that listing regardless of RLS-select restriction (use a `security definer`
   function `get_proof_questions_for_claim(listing_id)` that returns only
   `id, question, position` — this is the one deliberate exception to "poster
   only" read, scoped narrowly) → claimant submits answers → `claims` +
   `proof_answers` rows created.
5. **Review claim UI** — found-item poster sees pending claims with answers
   side-by-side against their own private questions, accepts or rejects via
   server action. On accept: `claims.status = 'accepted'`,
   `listings.status = 'claimed'`, all other pending claims on that listing →
   auto-rejected. On reject: `claims.status = 'rejected'`, listing stays `open`.

## Acceptance criteria

- [ ] Creating a Lost listing generates at least one `match_suggestions` row
      against a similar existing Found listing (test with matching category+zone).
- [ ] A Lost listing from a College A student does **not** generate a match
      suggestion against a similar Found listing from a College B student, or
      from an independent user whose posts that student has opted out of
      seeing (`show_independent_posts = false`).
- [ ] A claimant can retrieve proof question text without being able to
      `select *` the `proof_questions` table directly (verify via Supabase SQL
      editor as the claimant's role — direct select should return 0 rows).
- [ ] Submitting proof answers creates a `claims` row with `status = 'pending'`.
- [ ] Poster accepting a claim flips `listings.status` to `claimed` and
      auto-rejects any other pending claims on the same listing.
- [ ] Poster rejecting a claim leaves the listing `open` and the claim
      `rejected`.
