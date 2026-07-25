# Phase 6 — Mobile App

Standalone doc. No other phase doc required in context.

## Context recap

CampusFind's backend is Supabase (Postgres + Auth + Realtime + Storage, all
RLS-protected) and the web app is Next.js. By this phase the full backend and
business logic exist: email OTP auth, listings with images/zones/exact-pin
privacy rules, rule-based match suggestions, proof-question claim verification,
realtime chat/comments, two-party handover, moderation, and web push. This phase
adds an Expo (React Native) client that talks to the **same** Supabase project —
no new tables, no new RLS, no new server logic beyond what mobile-specific
features require (native push tokens, camera/maps access).

## Goal

A functional Expo app covering the same core user journey as the web app: login,
browse/search, post a listing, view matches, claim/verify, chat, confirm
handover — with native camera and maps instead of web upload/pin widgets, and
native push instead of web push.

## Setup

```
npx create-expo-app apps/mobile --template
cd apps/mobile
npx expo install @supabase/supabase-js react-native-url-polyfill
npx expo install expo-secure-store expo-image-picker expo-notifications expo-location
npx expo install react-native-maps
```

Supabase client (`lib/supabase.ts`) uses `expo-secure-store` as the auth storage
adapter instead of browser `localStorage`:
```ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export const supabase = createClient(url, anonKey, {
  auth: { storage: ExpoSecureStoreAdapter, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
```

Reuse the **same** matching/RLS/claim logic already living in Postgres — the
mobile app is a thin client, it must not duplicate business rules that the web
app's server actions currently own. Where the web app used a Next.js server
action to call a `security definer` RPC (proof questions, `start_conversation`,
handover confirmation), the mobile app calls the same Postgres RPC directly via
`supabase.rpc(...)`.

## Screens (mirrors web app IA)

1. **Auth**: email OTP entry → code verify (same `signInWithOtp`/`verifyOtp` calls).
2. **Feed**: Lost/Found tabs, pull-to-refresh, search bar + filter sheet.
3. **Listing detail**: image carousel, `react-native-maps` for approximate zone
   pin (exact pin only rendered if the current user is the poster/accepted
   claimant — same rule as web, enforced by the same `listings_public` view /
   RPC).
4. **Create/edit listing**: `expo-image-picker` for photos (camera or library),
   `expo-location` to prefill a "near me" zone suggestion, map picker for exact
   pin.
5. **Matches**: list bound to `match_suggestions`, dismiss action.
6. **Claim flow**: proof question form → answers submit via the same
   `security definer` RPC used on web.
7. **Inbox / chat**: Supabase Realtime subscription identical to web's, native
   list + composer.
8. **Handover confirm**: single button calling the same RPC/table insert as web.
9. **Notifications**: in-app list from the `notifications` table; native push via
   `expo-notifications` — device push token saved to a mobile-specific
   `device_push_tokens` table (new, mobile-only — see schema addendum) rather
   than reusing `push_subscriptions`, which is web-push (VAPID) specific.

## Schema addendum — `supabase/migrations/0006_mobile_push.sql`

```sql
create table device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  expo_push_token text not null unique,
  created_at timestamptz default now()
);

alter table device_push_tokens enable row level security;
create policy "manage own device token"
  on device_push_tokens for all using (user_id = auth.uid());
```
Server-side notification sender (already exists from Phase 5 for web push) gets
a second branch: for `user_id`s with rows in `device_push_tokens`, POST to Expo's
push API (`https://exp.host/--/api/v2/push/send`) instead of/in addition to
web-push.

## Tasks

1. Scaffold Expo app, wire Supabase client with SecureStore adapter.
2. Build navigation (bottom tabs: Feed, Matches, Inbox, Profile) using
   `expo-router` or React Navigation — pick one, don't mix.
3. Port each screen above, reusing query/RPC shapes 1:1 from the web app so
   backend logic never forks between platforms.
4. Implement native push registration + `device_push_tokens` upsert on login.
5. Camera/gallery upload → same `listing-images` Storage bucket, same path
   convention as web.
6. Build config: EAS build profiles for iOS/Android (`eas.json`), app icons,
   splash screen.

## Acceptance criteria

- [ ] Logging in on mobile and web with the same account shares session state
      correctly (each platform keeps its own token via its own storage adapter,
      but both hit the same `profiles` row).
- [ ] A listing created on mobile appears correctly on web and vice versa,
      including images and exact-pin privacy behavior.
- [ ] Realtime chat messages sent from web arrive on mobile within a couple of
      seconds without a manual refresh.
- [ ] A claim submitted on mobile is reviewable and accept/reject-able from the
      web admin/poster flow with no data shape mismatch.
- [ ] A test push notification (e.g. triggered by a new chat message) is
      received on a physical/simulated device via Expo push.
