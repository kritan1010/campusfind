create type public.listing_visibility as enum ('campus_only', 'public');

alter table public.listings
  add column visibility public.listing_visibility not null default 'campus_only';

create index listings_visibility_idx
  on public.listings (visibility, kind, status, created_at desc);

create or replace function public.can_view_listing(p_poster_id uuid, p_viewer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_viewer_id = auth.uid() and (
    exists (
      select 1 from public.listings l
      where l.poster_id = p_poster_id
        and l.visibility = 'public'
    )
    or p_poster_id = p_viewer_id
    or exists (
      select 1
      from public.profiles poster
      join public.profiles viewer on viewer.id = p_viewer_id
      left join public.colleges poster_college on poster_college.id = poster.college_id
      where poster.id = p_poster_id
        and (
          (poster.college_id is not null and poster.college_id = viewer.college_id)
          or (poster.college_id is null and viewer.college_id is null)
          or (poster.college_id is null and viewer.college_id is not null and viewer.show_independent_posts)
          or (poster.college_id is not null and viewer.college_id is null and poster_college.publicly_discoverable)
        )
    )
  );
$$;

drop view if exists public.listings_public;
create view public.listings_public
with (security_invoker = true)
as
select
  id, poster_id, kind, status, title, description, category, colour, brand, model,
  event_date, zone_id, visibility, search_document, created_at, updated_at
from public.listings;

revoke all on table public.listings_public from anon, authenticated;
grant select on public.listings_public to authenticated;
grant update (visibility) on public.listings to authenticated;

create or replace function public.get_shared_listing_preview(p_listing_id uuid)
returns table (
  id uuid,
  kind public.listing_kind,
  status public.listing_status,
  title text,
  category text,
  event_date date,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.kind, l.status, l.title, l.category, l.event_date, l.created_at
  from public.listings l
  where l.id = p_listing_id;
$$;

revoke execute on function public.get_shared_listing_preview(uuid) from public, authenticated;
grant execute on function public.get_shared_listing_preview(uuid) to anon, authenticated;
