begin;

select plan(16);

insert into auth.users (id, email)
values
  ('11000000-0000-0000-0000-000000000001', 'college.a@example.edu'),
  ('11000000-0000-0000-0000-000000000002', 'college.b@example.edu'),
  ('11000000-0000-0000-0000-000000000003', 'independent@example.edu'),
  ('11000000-0000-0000-0000-000000000004', 'reviewer@example.edu');

update public.profiles set is_admin = true where id = '11000000-0000-0000-0000-000000000004';

insert into public.colleges (id, name, status, requested_by, reviewed_by, reviewed_at)
values
  ('21000000-0000-0000-0000-000000000001', 'College A', 'approved', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', now()),
  ('21000000-0000-0000-0000-000000000002', 'College B', 'approved', '11000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000004', now());

update public.profiles set college_id = '21000000-0000-0000-0000-000000000001' where id = '11000000-0000-0000-0000-000000000001';
update public.profiles set college_id = '21000000-0000-0000-0000-000000000002' where id = '11000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.listings (id, poster_id, kind, title, description, category, event_date, zone_id, exact_lat, exact_lng)
values ('31000000-0000-0000-0000-000000000001', auth.uid(), 'lost', 'College A calculator', 'Lost beside the library printers.', 'electronics', current_date, (select id from public.campus_zones limit 1), 12.9716, 77.5946);

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
insert into public.listings (id, poster_id, kind, title, description, category, event_date)
values ('31000000-0000-0000-0000-000000000002', auth.uid(), 'found', 'College B identity card', 'Found outside the administration block.', 'id_card', current_date);

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
insert into public.listings (id, poster_id, kind, title, description, category, event_date)
values ('31000000-0000-0000-0000-000000000003', auth.uid(), 'lost', 'Independent blue bottle', 'Left near the main gate yesterday.', 'bottle', current_date);

select is((select count(*)::integer from public.listings_public), 1, 'independent users initially see only independent listings');

set local role postgres;
update public.colleges set publicly_discoverable = true where id = '21000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select is((select count(*)::integer from public.listings_public), 2, 'independent users see listings from discoverable colleges');

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select count(*)::integer from public.listings_public), 2, 'college A sees its own and independent listings but not college B');
update public.profiles set show_independent_posts = false where id = auth.uid();
select is((select count(*)::integer from public.listings_public), 1, 'college viewer opt-out hides independent listings');

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*)::integer from public.listings_public), 2, 'college B sees its own and independent listings but not college A');
select throws_ok(
  $$ select public.close_listing('31000000-0000-0000-0000-000000000001') $$,
  'P0001',
  'Only the poster can close an open listing',
  'a non-poster cannot close another listing'
);
select throws_ok(
  $$ update public.listings set status = 'returned' where id = '31000000-0000-0000-0000-000000000002' $$,
  '42501', null,
  'authenticated clients cannot arbitrarily update lifecycle status'
);
select throws_ok(
  $$ select exact_lat from public.listings where id = '31000000-0000-0000-0000-000000000002' $$,
  '42501', null,
  'exact coordinates cannot be selected directly by authenticated clients'
);
select hasnt_column('public', 'listings_public', 'exact_lat', 'public view omits exact latitude entirely');
select hasnt_column('public', 'listings_public', 'exact_lng', 'public view omits exact longitude entirely');

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(public.close_listing('31000000-0000-0000-0000-000000000001')::text, 'closed', 'poster can close an open listing');
select is((select status::text from public.listings_public where id = '31000000-0000-0000-0000-000000000001'), 'closed', 'closed state is persisted');
select results_eq(
  $$ select exact_lat, exact_lng from public.get_listing_exact_location('31000000-0000-0000-0000-000000000001') $$,
  $$ values (12.9716::double precision, 77.5946::double precision) $$,
  'poster can retrieve their private exact pin through the guarded function'
);

insert into public.listing_images (id, listing_id, storage_path) values ('41000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001/photo.jpg');
insert into public.item_attributes (id, listing_id, key, value) values ('51000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'keyword', 'casio');
delete from public.listings where id = '31000000-0000-0000-0000-000000000001';
set local role postgres;
select is((select count(*)::integer from public.listing_images where id = '41000000-0000-0000-0000-000000000001'), 0, 'deleting a listing cascades to image rows');
select is((select count(*)::integer from public.item_attributes where id = '51000000-0000-0000-0000-000000000001'), 0, 'deleting a listing cascades to attribute rows');
select is((select count(*)::integer from storage.buckets where id = 'listing-images'), 1, 'listing image bucket exists');

select * from finish();
rollback;
