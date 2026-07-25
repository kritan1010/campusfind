create type public.college_status as enum ('pending', 'approved', 'rejected');

create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  status public.college_status not null default 'pending',
  publicly_discoverable boolean not null default false,
  requested_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index colleges_name_unique_ci
  on public.colleges (lower(btrim(name)));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  avatar_url text,
  college_id uuid references public.colleges(id) on delete set null,
  show_independent_posts boolean not null default true,
  is_admin boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.colleges
  add constraint colleges_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles(id) on delete set null;

alter table public.colleges
  add constraint colleges_review_consistency
  check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or
    (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
  );

create table public.campus_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 2 and 120),
  centroid_lat double precision check (centroid_lat between -90 and 90),
  centroid_lng double precision check (centroid_lng between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campus_zone_coordinates_are_paired check (
    (centroid_lat is null and centroid_lng is null)
    or (centroid_lat is not null and centroid_lng is not null)
  )
);

comment on column public.profiles.college_id is
  'Null for independent users; otherwise the user belongs to this college community.';
comment on column public.colleges.publicly_discoverable is
  'Allows independent users to discover this college community once Phase 2 listings exist.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger colleges_set_updated_at
  before update on public.colleges
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger campus_zones_set_updated_at
  before update on public.campus_zones
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'CampusFind member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Security-definer helpers keep policy checks from recursively invoking RLS.
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.can_join_college(target_college_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_college_id is null or exists (
    select 1
    from public.colleges c
    where c.id = target_college_id
      and (
        c.status = 'approved'
        or c.requested_by = auth.uid()
        or public.current_user_is_admin()
      )
  );
$$;

create or replace function public.request_college(requested_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  clean_name text := btrim(requested_name);
  new_college_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if char_length(clean_name) not between 2 and 120 then
    raise exception 'College name must contain between 2 and 120 characters';
  end if;

  insert into public.colleges (name, requested_by)
  values (clean_name, auth.uid())
  returning id into new_college_id;

  update public.profiles
  set college_id = new_college_id
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  return new_college_id;
end;
$$;

alter table public.colleges enable row level security;
alter table public.profiles enable row level security;
alter table public.campus_zones enable row level security;

create policy "approved colleges visible to authenticated users"
  on public.colleges for select to authenticated
  using (status = 'approved');

create policy "requesters and admins can view unapproved colleges"
  on public.colleges for select to authenticated
  using (requested_by = auth.uid() or public.current_user_is_admin());

create policy "authenticated users can request colleges"
  on public.colleges for insert to authenticated
  with check (
    requested_by = auth.uid()
    and status = 'pending'
    and publicly_discoverable = false
    and reviewed_by is null
    and reviewed_at is null
  );

create policy "admins can review colleges"
  on public.colleges for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "client college deletion is disabled"
  on public.colleges for delete to authenticated
  using (false);

create policy "profiles are visible to authenticated users"
  on public.profiles for select to authenticated
  using (true);

create policy "users can insert their own non-admin profile"
  on public.profiles for insert to authenticated
  with check (
    auth.uid() = id
    and is_admin = false
    and public.can_join_college(college_id)
  );

create policy "users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and public.can_join_college(college_id));

create policy "client profile deletion is disabled"
  on public.profiles for delete to authenticated
  using (false);

create policy "campus zones are visible to authenticated users"
  on public.campus_zones for select to authenticated
  using (true);

create policy "client campus zone creation is disabled"
  on public.campus_zones for insert to authenticated
  with check (false);

create policy "client campus zone updates are disabled"
  on public.campus_zones for update to authenticated
  using (false)
  with check (false);

create policy "client campus zone deletion is disabled"
  on public.campus_zones for delete to authenticated
  using (false);

-- Supabase's current default does not expose new tables automatically.
revoke all on table public.colleges from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.campus_zones from anon, authenticated;

grant select, insert, update on table public.colleges to authenticated;
grant select, insert on table public.profiles to authenticated;
grant update (
  display_name,
  avatar_url,
  college_id,
  show_independent_posts,
  onboarding_completed_at
)
  on table public.profiles to authenticated;
grant select on table public.campus_zones to authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.current_user_is_admin() from public, anon;
revoke execute on function public.can_join_college(uuid) from public, anon;
revoke execute on function public.request_college(text) from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.can_join_college(uuid) to authenticated;
grant execute on function public.request_college(text) to authenticated;
