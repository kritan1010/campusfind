insert into public.campus_zones (name, centroid_lat, centroid_lng)
values
  ('Academic Block A', null, null),
  ('Academic Block B', null, null),
  ('Academic Block C', null, null),
  ('Main Library', null, null),
  ('Central Canteen', null, null),
  ('Sports Complex', null, null),
  ('Boys Hostel A', null, null),
  ('Boys Hostel B', null, null),
  ('Girls Hostel A', null, null),
  ('Administration Block', null, null),
  ('Auditorium', null, null),
  ('Main Gate', null, null)
on conflict (name) do update
set
  centroid_lat = excluded.centroid_lat,
  centroid_lng = excluded.centroid_lng;
