begin;

select plan(14);

select has_table('public', 'colleges', 'colleges table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'campus_zones', 'campus_zones table exists');

select is(
  (select relrowsecurity from pg_class where oid = 'public.colleges'::regclass),
  true,
  'colleges has RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'profiles has RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.campus_zones'::regclass),
  true,
  'campus_zones has RLS enabled'
);

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'colleges'),
  5,
  'colleges has explicit policies for each client operation'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'profiles'),
  4,
  'profiles has explicit policies for each client operation'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'campus_zones'),
  4,
  'campus zones has explicit policies for each client operation'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'UPDATE'),
  'authenticated users cannot update is_admin'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'),
  'authenticated users can update display_name subject to RLS'
);
select trigger_is(
  'auth',
  'users',
  'on_auth_user_created',
  'public',
  'handle_new_user',
  'new auth users trigger profile creation'
);
select is(
  (select count(*)::integer from public.campus_zones),
  12,
  'the campus zone seed inserts twelve zones'
);
select function_returns(
  'public',
  'handle_new_user',
  array[]::text[],
  'trigger',
  'profile creation function returns trigger'
);

select * from finish();
rollback;
