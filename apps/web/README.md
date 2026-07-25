# CampusFind web

The CampusFind Next.js application: passwordless email OTP, college onboarding,
and a privacy-scoped Lost/Found board with images, structured attributes,
search, filters, private exact pins, and guarded listing lifecycle actions.

## Local setup

1. Copy `.env.example` to `.env.local` and add the Supabase URL and publishable
   key. Existing projects that still expose an anon key are supported too.
2. From the repository root, start Supabase with `supabase start` and apply the
   schema and seed with `supabase db reset`.
3. From `apps/web`, install dependencies with `npm install` and start the app
   with `npm run dev`.
4. Local OTP emails appear in Mailpit at `http://127.0.0.1:54324`.

## Checks

```bash
npm test
npm run lint
npm run build
```

Database contracts and multi-community RLS behavior are covered from the repository
root with:

```bash
supabase test db
```

The Supabase project must use the included OTP template (or another template
containing `{{ .Token }}`) for the six-digit verification screen.

## Vercel

Import the GitHub repository into Vercel and set **Root Directory** to
`apps/web`. Leave **Framework Preset** as `Next.js` (Vercel should detect it),
use Node.js 22, and add these environment variables to Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred), or the compatible
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Database migrations are deployed separately from the web build. Apply them to
the intended Supabase project first. In Supabase Auth URL Configuration, set the
production Vercel URL as the Site URL and add the production and preview callback
domains to the allowed redirect URLs.
