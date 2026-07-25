# Phase 4 — Communication

Standalone doc. No other phase doc required in context.

## Context recap

CampusFind is a Next.js + Supabase lost-and-found platform. `listings` exist and
are readable by any authenticated user, writable only by the poster. Emails and
phone numbers must never be exposed to other users. This phase adds public
listing comments, private realtime chat, blocking/reporting, and notifications.

## Goal

Users can ask public questions on a listing (comments), or open a private
realtime chat with the poster/claimant without ever seeing each other's contact
info. Users can block each other. Notification rows are created for the relevant
events so Phase 5's push layer has something to send.

## Schema — `supabase/migrations/0004_communication.sql`

```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete set null,  -- nullable: chat can outlive listing
  created_at timestamptz default now()
);

create table conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create type notification_kind as enum (
  'new_comment', 'new_message', 'match_suggested', 'claim_received',
  'claim_accepted', 'claim_rejected', 'handover_requested', 'listing_returned'
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind notification_kind not null,
  payload jsonb not null default '{}',   -- e.g. { listing_id, conversation_id }
  read_at timestamptz,
  created_at timestamptz default now()
);

create table user_blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

alter table comments enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table user_blocks enable row level security;

-- comments: public read (authenticated), author-only write
create policy "comments readable by authenticated users"
  on comments for select using (auth.role() = 'authenticated');
create policy "author can insert own comment"
  on comments for insert with check (author_id = auth.uid());
create policy "author can delete own comment"
  on comments for delete using (author_id = auth.uid());

-- conversations/messages: members only
create policy "members can view their conversation"
  on conversations for select using (
    exists (select 1 from conversation_members m where m.conversation_id = id and m.user_id = auth.uid())
  );
create policy "members can view membership rows"
  on conversation_members for select using (user_id = auth.uid());
create policy "members can view messages"
  on messages for select using (
    exists (select 1 from conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
  );
create policy "members can send messages"
  on messages for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
  );

-- notifications: strictly own rows
create policy "own notifications only"
  on notifications for select using (user_id = auth.uid());
create policy "own notifications updatable (mark read)"
  on notifications for update using (user_id = auth.uid());

-- user_blocks: manage your own block list
create policy "manage own blocks"
  on user_blocks for all using (blocker_id = auth.uid());
```

Conversation/message inserts should go through a `security definer` RPC
`start_conversation(listing_id, other_user_id)` that creates the conversation +
both `conversation_members` rows atomically (a plain client insert can't safely
create both membership rows under RLS in one round trip).

## Tasks

1. **Comments** on `/listings/[id]` — threaded flat list is fine (no nested
   replies needed for v1), realtime via Supabase Realtime channel scoped to
   `listing_id`.
2. **Start chat** button on a listing (visible to any user except the poster
   themself) → calls `start_conversation` RPC → routes to `/inbox/[conversationId]`.
3. **Inbox** (`/inbox`) — conversation list sorted by latest message; unread
   indicator driven by comparing `messages.created_at` against a per-user
   last-read marker (add `conversation_members.last_read_at timestamptz`, update
   on open).
4. **Chat view** — realtime message list + composer, Supabase Realtime
   `postgres_changes` subscription on `messages` filtered to the conversation.
5. **Block/report entry points**: block a user from their profile or a
   conversation — once blocked, blocker stops seeing new messages from that user
   (enforce in query, not RLS, since block is directional) and the blocked user's
   `start_conversation` calls against the blocker should fail (check inside the
   RPC).
6. **Notification triggers**: Postgres triggers (or Phase 3/4 server actions)
   insert a `notifications` row on: new comment on your listing, new message in
   your conversation, new match suggestion, claim received, claim
   accepted/rejected. Notification bell in the nav polls or subscribes via
   Realtime.

## Acceptance criteria

- [ ] Two test users can exchange realtime messages in a conversation and
      neither ever sees the other's email/phone anywhere in the payload or UI.
- [ ] A user cannot select rows from a `conversations`/`messages` they're not a
      member of, verified via Supabase SQL editor as that user.
- [ ] Blocking a user stops their messages from appearing in your inbox going
      forward (existing history can remain).
- [ ] Posting a comment on a listing creates a `notifications` row for the
      listing's poster (not for the commenter).
- [ ] `start_conversation` is idempotent — calling it twice for the same
      listing+pair returns/reuses the same conversation rather than duplicating.
