create type public.claim_status as enum ('pending', 'accepted', 'rejected');

create table public.match_suggestions (
  id uuid primary key default gen_random_uuid(),
  lost_listing_id uuid not null references public.listings(id) on delete cascade,
  found_listing_id uuid not null references public.listings(id) on delete cascade,
  score numeric(4,3) not null check (score between 0 and 1),
  dismissed_by_lost_poster boolean not null default false,
  dismissed_by_found_poster boolean not null default false,
  created_at timestamptz not null default now(),
  unique (lost_listing_id, found_listing_id),
  check (lost_listing_id <> found_listing_id)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  status public.claim_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (listing_id, claimant_id)
);

create table public.proof_questions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  question text not null check (char_length(btrim(question)) between 5 and 500),
  position smallint not null default 0 check (position between 0 and 4),
  unique (listing_id, position)
);

create table public.proof_answers (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  proof_question_id uuid not null references public.proof_questions(id) on delete cascade,
  answer text not null check (char_length(btrim(answer)) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique (claim_id, proof_question_id)
);

create index match_suggestions_lost_idx on public.match_suggestions (lost_listing_id, score desc);
create index match_suggestions_found_idx on public.match_suggestions (found_listing_id, score desc);
create index claims_listing_idx on public.claims (listing_id, status);
create index proof_questions_listing_idx on public.proof_questions (listing_id, position);
create index proof_answers_claim_idx on public.proof_answers (claim_id);

create or replace function public.listings_are_mutually_visible(p_first uuid, p_second uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles first_p
    join public.profiles second_p on second_p.id = p_second
    left join public.colleges first_college on first_college.id = first_p.college_id
    left join public.colleges second_college on second_college.id = second_p.college_id
    where first_p.id = p_first
      and (
        (first_p.college_id is not null and first_p.college_id = second_p.college_id)
        or (first_p.college_id is null and second_p.college_id is null)
        or (first_p.college_id is null and second_p.college_id is not null and second_p.show_independent_posts)
        or (first_p.college_id is not null and second_p.college_id is null and first_college.publicly_discoverable)
      )
      and (
        (second_p.college_id is not null and second_p.college_id = first_p.college_id)
        or (second_p.college_id is null and first_p.college_id is null)
        or (second_p.college_id is null and first_p.college_id is not null and first_p.show_independent_posts)
        or (second_p.college_id is not null and first_p.college_id is null and second_college.publicly_discoverable)
      )
  );
$$;

create or replace function public.refresh_matches_for_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare source_listing public.listings%rowtype; candidate public.listings%rowtype; score_value numeric;
begin
  select * into source_listing from public.listings where id = p_listing_id;
  if not found or source_listing.status <> 'open' then return; end if;
  for candidate in select * from public.listings where status = 'open' and kind <> source_listing.kind loop
    if not public.listings_are_mutually_visible(source_listing.poster_id, candidate.poster_id) then continue; end if;
    score_value :=
      (case when source_listing.category = candidate.category then 0.30 else 0 end) +
      (greatest(0::numeric, 1 - greatest(abs(source_listing.event_date - candidate.event_date) - 3, 0)::numeric / 18) * 0.20) +
      (case when source_listing.zone_id is not null and source_listing.zone_id = candidate.zone_id then 0.20 else 0 end) +
      (case when source_listing.colour is not null and lower(source_listing.colour) = lower(coalesce(candidate.colour, '')) then 0.10 else 0 end) +
      (case when source_listing.brand is not null and source_listing.model is not null and lower(source_listing.brand) = lower(coalesce(candidate.brand, '')) and lower(source_listing.model) = lower(coalesce(candidate.model, '')) then 0.10 else 0 end) +
      (case when exists (select 1 from public.item_attributes a join public.item_attributes b on lower(a.value) = lower(b.value) where a.listing_id = source_listing.id and b.listing_id = candidate.id and a.key = 'keyword' and b.key = 'keyword') then 0.10 else 0 end);
    if score_value >= 0.40 then
      insert into public.match_suggestions (lost_listing_id, found_listing_id, score)
      values (
        case when source_listing.kind = 'lost' then source_listing.id else candidate.id end,
        case when source_listing.kind = 'found' then source_listing.id else candidate.id end,
        score_value
      ) on conflict (lost_listing_id, found_listing_id) do update set score = excluded.score;
    end if;
  end loop;
end;
$$;

create or replace function public.trigger_refresh_matches()
returns trigger language plpgsql security definer set search_path = '' as $$
begin perform public.refresh_matches_for_listing(new.id); return new; end;
$$;
create trigger listings_generate_match_suggestions
  after insert on public.listings for each row execute function public.trigger_refresh_matches();

create or replace function public.get_proof_questions_for_claim(p_listing_id uuid)
returns table (question_id uuid, question text, sort_position smallint)
language sql stable security definer set search_path = '' as $$
  select q.id, q.question, q.position
  from public.proof_questions q join public.listings l on l.id = q.listing_id
  where q.listing_id = p_listing_id and l.kind = 'found' and l.status = 'open'
    and l.poster_id <> auth.uid() and public.can_view_listing(l.poster_id, auth.uid())
  order by q.position;
$$;

create or replace function public.create_claim_with_answers(p_listing_id uuid, p_answers jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_claim_id uuid; expected_count integer; provided_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.listings l where l.id = p_listing_id and l.kind = 'found' and l.status = 'open' and l.poster_id <> auth.uid() and public.can_view_listing(l.poster_id, auth.uid())) then raise exception 'This listing cannot be claimed'; end if;
  select count(*) into expected_count from public.proof_questions where listing_id = p_listing_id;
  if expected_count not between 1 and 5 then raise exception 'The finder has not configured proof questions'; end if;
  select count(*) into provided_count from jsonb_array_elements(p_answers);
  if provided_count <> expected_count then raise exception 'Answer every proof question'; end if;
  insert into public.claims (listing_id, claimant_id) values (p_listing_id, auth.uid()) returning id into new_claim_id;
  insert into public.proof_answers (claim_id, proof_question_id, answer)
  select new_claim_id, (answer->>'question_id')::uuid, btrim(answer->>'answer') from jsonb_array_elements(p_answers) answer
  join public.proof_questions q on q.id = (answer->>'question_id')::uuid and q.listing_id = p_listing_id;
  if (select count(*) from public.proof_answers where claim_id = new_claim_id) <> expected_count then raise exception 'Invalid proof answers'; end if;
  return new_claim_id;
end;
$$;

create or replace function public.decide_claim(p_claim_id uuid, p_accept boolean)
returns public.claim_status language plpgsql security definer set search_path = '' as $$
declare target_listing uuid; next_status public.claim_status;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select c.listing_id into target_listing from public.claims c join public.listings l on l.id = c.listing_id where c.id = p_claim_id and c.status = 'pending' and l.poster_id = auth.uid() and l.status = 'open';
  if target_listing is null then raise exception 'Only the finder can decide a pending claim'; end if;
  update public.claims set status = case when p_accept then 'accepted' else 'rejected' end, decided_at = now() where id = p_claim_id returning status into next_status;
  if p_accept then
    update public.claims set status = 'rejected', decided_at = now() where listing_id = target_listing and id <> p_claim_id and status = 'pending';
    update public.listings set status = 'claimed' where id = target_listing;
  end if;
  return next_status;
end;
$$;

create or replace function public.dismiss_match(p_match_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.match_suggestions m set
    dismissed_by_lost_poster = case when lost.poster_id = auth.uid() then true else m.dismissed_by_lost_poster end,
    dismissed_by_found_poster = case when found.poster_id = auth.uid() then true else m.dismissed_by_found_poster end
  from public.listings lost, public.listings found
  where m.id = p_match_id and lost.id = m.lost_listing_id and found.id = m.found_listing_id
    and (lost.poster_id = auth.uid() or found.poster_id = auth.uid());
  if not found then raise exception 'Only an involved poster can dismiss this match'; end if;
end;
$$;

alter table public.match_suggestions enable row level security;
alter table public.claims enable row level security;
alter table public.proof_questions enable row level security;
alter table public.proof_answers enable row level security;
create policy "matches visible to involved posters" on public.match_suggestions for select to authenticated using (
  exists (select 1 from public.listings l where l.id = lost_listing_id and l.poster_id = (select auth.uid()))
  or exists (select 1 from public.listings l where l.id = found_listing_id and l.poster_id = (select auth.uid()))
);
create policy "claims visible to claimant or finder" on public.claims for select to authenticated using (
  claimant_id = (select auth.uid()) or exists (select 1 from public.listings l where l.id = listing_id and l.poster_id = (select auth.uid()))
);
create policy "questions visible only to finder" on public.proof_questions for select to authenticated using (
  exists (select 1 from public.listings l where l.id = listing_id and l.poster_id = (select auth.uid()))
);
create policy "finder manages proof questions" on public.proof_questions for all to authenticated using (
  exists (select 1 from public.listings l where l.id = listing_id and l.poster_id = (select auth.uid()))
) with check (exists (select 1 from public.listings l where l.id = listing_id and l.poster_id = (select auth.uid()) and l.kind = 'found'));
create policy "answers visible to claimant or finder" on public.proof_answers for select to authenticated using (
  exists (select 1 from public.claims c where c.id = claim_id and c.claimant_id = (select auth.uid()))
  or exists (select 1 from public.claims c join public.listings l on l.id = c.listing_id where c.id = claim_id and l.poster_id = (select auth.uid()))
);

revoke all on public.match_suggestions, public.claims, public.proof_questions, public.proof_answers from anon, authenticated;
grant select on public.match_suggestions to authenticated;
grant select on public.claims to authenticated;
grant select, insert, update, delete on public.proof_questions to authenticated;
grant select on public.proof_answers to authenticated;
revoke execute on function public.listings_are_mutually_visible(uuid, uuid), public.refresh_matches_for_listing(uuid), public.trigger_refresh_matches(), public.get_proof_questions_for_claim(uuid), public.create_claim_with_answers(uuid, jsonb), public.decide_claim(uuid, boolean), public.dismiss_match(uuid) from public, anon;
grant execute on function public.get_proof_questions_for_claim(uuid), public.create_claim_with_answers(uuid, jsonb), public.decide_claim(uuid, boolean), public.dismiss_match(uuid) to authenticated;
