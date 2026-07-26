alter table public.campus_zones
  add column category text not null default 'place' check (char_length(btrim(category)) between 2 and 40),
  add column description text,
  add column is_active boolean not null default true;

create or replace function public.admin_create_campus_zone(p_name text, p_category text, p_description text, p_lat double precision, p_lng double precision)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare result_id uuid;
begin
  if not public.current_user_is_admin() then raise exception 'Admin access required'; end if;
  insert into public.campus_zones(name, category, description, centroid_lat, centroid_lng)
  values (btrim(p_name), coalesce(nullif(btrim(p_category), ''), 'place'), nullif(btrim(p_description), ''), p_lat, p_lng)
  returning id into result_id;
  return result_id;
end;
$$;

create or replace function public.admin_update_campus_zone(p_id uuid, p_name text, p_category text, p_description text, p_lat double precision, p_lng double precision, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then raise exception 'Admin access required'; end if;
  update public.campus_zones
  set name = btrim(p_name), category = coalesce(nullif(btrim(p_category), ''), 'place'), description = nullif(btrim(p_description), ''), centroid_lat = p_lat, centroid_lng = p_lng, is_active = p_active
  where id = p_id;
  if not found then raise exception 'Campus place not found'; end if;
end;
$$;

revoke execute on function public.admin_create_campus_zone(text,text,text,double precision,double precision), public.admin_update_campus_zone(uuid,text,text,text,double precision,double precision,boolean) from public, anon;
grant execute on function public.admin_create_campus_zone(text,text,text,double precision,double precision), public.admin_update_campus_zone(uuid,text,text,text,double precision,double precision,boolean) to authenticated;
