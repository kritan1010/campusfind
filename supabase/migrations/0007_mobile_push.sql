create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index device_push_tokens_user_id_idx on public.device_push_tokens(user_id);
alter table public.device_push_tokens enable row level security;
create policy "users manage their device tokens" on public.device_push_tokens for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.device_push_tokens from anon, authenticated;
grant select, insert, update, delete on public.device_push_tokens to authenticated;
