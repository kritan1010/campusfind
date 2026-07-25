# CampusFind web

The Phase 1 Next.js application for CampusFind: passwordless email OTP,
Supabase-backed profiles, college affiliation onboarding, protected routes, and
the seeded campus-zone directory.

## Local setup

1. Copy `.env.example` to `.env.local` and add the Supabase URL and publishable
   key. Existing projects that still expose an anon key are supported too.
2. From the repository root, start Supabase with `supabase start` and apply the
   fresh schema with `supabase db reset`.
3. From `apps/web`, install dependencies with `npm install` and start the app
   with `npm run dev`.
4. Local OTP emails appear in Mailpit at `http://127.0.0.1:54324`.

## Checks

```bash
npm test
npm run lint
npm run build
```

Database contracts and two-user RLS behavior are covered from the repository
root with:

```bash
supabase test db
```

The Supabase project must use the included OTP template (or another template
containing `{{ .Token }}`) for the six-digit verification screen.
