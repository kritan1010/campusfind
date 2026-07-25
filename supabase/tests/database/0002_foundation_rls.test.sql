begin;

select plan(10);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'first.student@example.edu'),
  ('10000000-0000-0000-0000-000000000002', 'second.student@example.edu'),
  ('10000000-0000-0000-0000-000000000003', 'admin@example.edu');

select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'first.student',
  'auth signup trigger creates a profile from the email local part'
);

update public.profiles
set is_admin = true
where id = '10000000-0000-0000-0000-000000000003';

insert into public.colleges (
  id,
  name,
  status,
  requested_by,
  reviewed_by,
  reviewed_at
)
values (
  '20000000-0000-0000-0000-000000000001',
  'Approved Test College',
  'approved',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  now()
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

insert into public.colleges (id, name, requested_by)
values (
  '20000000-0000-0000-0000-000000000002',
  'Pending Test College',
  auth.uid()
);

select is(
  (select count(*)::integer from public.colleges),
  2,
  'a requester sees approved colleges and their own pending college'
);

update public.profiles
set college_id = '20000000-0000-0000-0000-000000000002'
where id = auth.uid();

select is(
  (select college_id from public.profiles where id = auth.uid()),
  '20000000-0000-0000-0000-000000000002'::uuid,
  'a requester can immediately attach their pending college'
);

update public.colleges
set status = 'rejected'
where id = '20000000-0000-0000-0000-000000000002';

select is(
  (select status::text from public.colleges where id = '20000000-0000-0000-0000-000000000002'),
  'pending',
  'a non-admin cannot change a college review status'
);

select throws_ok(
  $$ update public.profiles set is_admin = true where id = auth.uid() $$,
  '42501',
  null,
  'a user cannot promote their own profile to admin'
);

set local role postgres;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*)::integer from public.colleges),
  1,
  'an unrelated user sees the approved college but not another user pending request'
);

update public.profiles
set display_name = 'Hacked'
where id = '10000000-0000-0000-0000-000000000001';

select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'first.student',
  'a user cannot update another profile'
);

update public.profiles
set display_name = 'Independent User', college_id = null
where id = auth.uid();

select is(
  (select college_id from public.profiles where id = auth.uid()),
  null::uuid,
  'an independent user can complete onboarding with a null college'
);

select is(
  (select count(*)::integer from public.campus_zones),
  12,
  'authenticated clients can fetch all seeded campus zones'
);

select is(
  (select count(*)::integer from public.profiles),
  3,
  'authenticated clients can view other public profiles'
);

select * from finish();
rollback;
