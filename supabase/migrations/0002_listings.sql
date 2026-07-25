create type public.listing_kind as enum ('lost', 'found');
create type public.listing_status as enum (
  'open',
  'possible_match',
  'claimed',
  'return_pending',
  'returned',
  'closed'
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles(id) on delete cascade,
  kind public.listing_kind not null,
  status public.listing_status not null default 'open',
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null check (char_length(btrim(description)) between 10 and 4000),
  category text not null check (
    category in ('electronics', 'bag', 'id_card', 'clothing', 'keys', 'book', 'bottle', 'other')
  ),
  colour text check (colour is null or char_length(btrim(colour)) between 1 and 60),
  brand text check (brand is null or char_length(btrim(brand)) between 1 and 80),
  model text check (model is null or char_length(btrim(model)) between 1 and 80),
  event_date date not null check (event_date <= current_date),
  zone_id uuid references public.campus_zones(id) on delete set null,
  exact_lat double precision check (exact_lat between -90 and 90),
  exact_lng double precision check (exact_lng between -180 and 180),
  search_document tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_coordinates_are_paired check (
    (exact_lat is null and exact_lng is null)
    or (exact_lat is not null and exact_lng is not null)
  )
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique check (storage_path <> ''),
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);

create table public.item_attributes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  key text not null check (char_length(btrim(key)) between 1 and 40),
  value text not null check (char_length(btrim(value)) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (listing_id, key, value)
);

create index listings_browse_idx on public.listings (kind, status, category, created_at desc);
create index listings_zone_idx on public.listings (zone_id);
create index listings_search_idx on public.listings using gin (search_document);
create index listing_images_listing_idx on public.listing_images (listing_id);
create index item_attributes_listing_idx on public.item_attributes (listing_id);

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create or replace function public.can_view_listing(p_poster_id uuid, p_viewer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_viewer_id = auth.uid() and (
    p_poster_id = p_viewer_id
    or exists (
      select 1
      from public.profiles poster
      join public.profiles viewer on viewer.id = p_viewer_id
      left join public.colleges poster_college on poster_college.id = poster.college_id
      where poster.id = p_poster_id
        and (
          (poster.college_id is not null and poster.college_id = viewer.college_id)
          or (poster.college_id is null and viewer.college_id is null)
          or (
            poster.college_id is null
            and viewer.college_id is not null
            and viewer.show_independent_posts
          )
          or (
            poster.college_id is not null
            and viewer.college_id is null
            and poster_college.publicly_discoverable
          )
        )
    )
  );
$$;

create or replace function public.get_listing_exact_location(p_listing_id uuid)
returns table (exact_lat double precision, exact_lng double precision)
language sql
stable
security definer
set search_path = ''
as $$
  select listing.exact_lat, listing.exact_lng
  from public.listings listing
  where listing.id = p_listing_id
    and listing.poster_id = auth.uid();
$$;

create or replace function public.close_listing(p_listing_id uuid)
returns public.listing_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_status public.listing_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.listings
  set status = 'closed'
  where id = p_listing_id
    and poster_id = auth.uid()
    and status = 'open'
  returning status into next_status;

  if next_status is null then
    raise exception 'Only the poster can close an open listing';
  end if;

  return next_status;
end;
$$;

alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.item_attributes enable row level security;

create policy "listings readable per community visibility rule"
  on public.listings for select to authenticated
  using (public.can_view_listing(poster_id, auth.uid()));

create policy "poster can insert own open listing"
  on public.listings for insert to authenticated
  with check (poster_id = auth.uid() and status = 'open');

create policy "poster can update own listing"
  on public.listings for update to authenticated
  using (poster_id = auth.uid())
  with check (poster_id = auth.uid());

create policy "poster can delete own listing"
  on public.listings for delete to authenticated
  using (poster_id = auth.uid());

create policy "images visible with their listing"
  on public.listing_images for select to authenticated
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id
        and public.can_view_listing(listing.poster_id, auth.uid())
    )
  );

create policy "poster can insert listing images"
  on public.listing_images for insert to authenticated
  with check (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = auth.uid()
    )
  );

create policy "poster can update listing images"
  on public.listing_images for update to authenticated
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = auth.uid()
    )
  );

create policy "poster can delete listing images"
  on public.listing_images for delete to authenticated
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = auth.uid()
    )
  );

create policy "attributes visible with their listing"
  on public.item_attributes for select to authenticated
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id
        and public.can_view_listing(listing.poster_id, auth.uid())
    )
  );

create policy "poster can insert item attributes"
  on public.item_attributes for insert to authenticated
  with check (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = auth.uid()
    )
  );

create policy "poster can update item attributes"
  on public.item_attributes for update to authenticated
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = auth.uid()
    )
  );

create policy "poster can delete item attributes"
  on public.item_attributes for delete to authenticated
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = auth.uid()
    )
  );

-- The view deliberately omits exact_lat/exact_lng, so those field names never
-- appear in browse or non-owner detail responses. security_invoker preserves RLS.
create view public.listings_public
with (security_invoker = true)
as
select
  id,
  poster_id,
  kind,
  status,
  title,
  description,
  category,
  colour,
  brand,
  model,
  event_date,
  zone_id,
  search_document,
  created_at,
  updated_at
from public.listings;

revoke all on table public.listings from anon, authenticated;
revoke all on table public.listing_images from anon, authenticated;
revoke all on table public.item_attributes from anon, authenticated;
revoke all on table public.listings_public from anon, authenticated;

grant select (
  id, poster_id, kind, status, title, description, category, colour, brand,
  model, event_date, zone_id, search_document, created_at, updated_at
) on table public.listings to authenticated;
grant insert on table public.listings to authenticated;
grant update (
  kind, title, description, category, colour, brand, model, event_date,
  zone_id, exact_lat, exact_lng
) on table public.listings to authenticated;
grant delete on table public.listings to authenticated;
grant select, insert, update, delete on table public.listing_images to authenticated;
grant select, insert, update, delete on table public.item_attributes to authenticated;
grant select on table public.listings_public to authenticated;

revoke execute on function public.can_view_listing(uuid, uuid) from public, anon;
revoke execute on function public.get_listing_exact_location(uuid) from public, anon;
revoke execute on function public.close_listing(uuid) from public, anon;
grant execute on function public.can_view_listing(uuid, uuid) to authenticated;
grant execute on function public.get_listing_exact_location(uuid) to authenticated;
grant execute on function public.close_listing(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "authenticated users upload images for their listing"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings listing
      where listing.id::text = (storage.foldername(name))[1]
        and listing.poster_id = auth.uid()
    )
  );

create policy "posters update their listing image objects"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings listing
      where listing.id::text = (storage.foldername(name))[1]
        and listing.poster_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings listing
      where listing.id::text = (storage.foldername(name))[1]
        and listing.poster_id = auth.uid()
    )
  );

create policy "posters delete their listing image objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings listing
      where listing.id::text = (storage.foldername(name))[1]
        and listing.poster_id = auth.uid()
    )
  );
