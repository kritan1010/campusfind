# CampusFind — Abstract

## What it is

CampusFind is a lost-and-found platform for a campus community. Any user with an
OTP-verified email can post a lost or found item, get automatic match suggestions,
verify claims through private proof questions, coordinate a handover, and mark the
item returned — without ever exposing a phone number or email to a stranger.

It ships as a responsive **Next.js + Supabase** website first. A **React Native
(Expo) mobile app** reuses the same backend and business logic later.

## Problem

Campus lost-and-found today is a WhatsApp group, a noticeboard, or a security
office drawer. Nothing correlates a "lost blue backpack near Block C" post with a
"found blue backpack Block C" post, nothing verifies the claimant actually owns the
item before handing it over, and nobody's contact details are protected in the
process.

## Core mechanic

1. Post a **Lost** or **Found** listing — category, description, date, campus zone,
   optional map pin, photos.
2. Found-item posters privately attach **proof questions** only the true owner
   could answer (e.g. "what's the lock screen wallpaper?").
3. A rule-based **matching engine** scores open listings against each other using
   category, date proximity, zone/distance, colour, keywords, brand/model.
4. A claimant answers the proof questions; the finder **accepts or rejects**.
5. Both sides confirm a **two-party handover** and the listing closes as Returned.

## Community model

At signup, a user either picks their college (searched from an approved list,
or **requested** on the spot if it's not there yet — student request + admin
approval) or continues as an **independent** user with no college. This isn't
just a label — it drives what you see:

- Your own college's listings are always in your feed.
- Independents' listings are in a college student's feed **by default**
  (opt-out toggle).
- An independent only sees a college's listings if that college has opted into
  being **publicly discoverable**.
- Different colleges don't see each other's listings.

Match suggestions respect the same boundary — you're never matched to a
listing you wouldn't otherwise see in your feed.

## Trust & privacy model

- Auth is **passwordless email OTP** — confirms email ownership, not institutional
  identity. Registered-user community, not a verified-student-only walled garden.
- Emails and phone numbers are **never exposed**; all contact happens via in-app
  comments or private realtime chat.
- Exact map pins, proof answers, and messages are locked down with **Supabase Row
  Level Security**; only an approximate zone/pin is public.
- Poster-level moderation (block, report, close listing) backed by a small admin
  team with a moderation queue and audit log.

## Stack

| Layer | Choice |
|---|---|
| Web frontend | Next.js |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime, Storage, RLS) |
| Mobile (Phase 6) | Expo (React Native) |
| Notifications | In-app, email, web push → native push later |

## Delivery shape

Six phases, each a **self-contained, non-interdependent markdown doc** so they can
be handed to parallel AI coding agents without cross-phase context bleed:

1. Foundation (project, schema, OTP auth, zones, RLS)
2. Listings (CRUD, images, zones/pins, search & lifecycle)
3. Matching & claims (scoring engine, proof questions, accept/reject)
4. Communication (comments, realtime chat, block/report, notifications)
5. Returns & moderation (two-party handover, admin queue, web push)
6. Mobile app (Expo client on the same backend)

See `plan.md` for the phase-by-phase execution plan and `phase1.md`–`phase6.md`
for the precise, standalone build instructions for each phase.
