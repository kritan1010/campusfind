# Workflow

## Investigate

1. Read this folder, then the relevant standalone phase document under `docs/`.
2. Read `apps/web/AGENTS.md` before changing the Next.js app and consult the
   matching local Next.js documentation under `apps/web/node_modules/next/dist/docs`.
3. Inspect `git status` first. Preserve user changes and never touch
   `apps/web/.env.local` or print its values.
4. Treat Postgres RLS, explicit grants, and guarded functions as the security
   boundary; UI hiding is not authorization.

## Change

1. Add a failing focused test for behavior that can be tested in isolation.
2. Create schema changes with `supabase migration new <name>`, keep the numbered
   phase convention, and never edit a migration already shipped to production.
3. Apply and test locally before touching the hosted project.
4. Keep exact locations and other sensitive fields out of general-purpose views
   and response shapes.
5. Update this context folder whenever architecture, working state, commands, or
   important risks change.
6. For hosted auth changes, use the Supabase dashboard. Code cannot override the
   provider's email template, SMTP sender, Site URL, or redirect allow-list.

## Verify

From the repository root:

```bash
supabase db reset
supabase test db
```

From `apps/web`:

```bash
npm test
npm run lint
npm run build
```

For the mobile app, copy `apps/mobile/.env.example` to an untracked `.env`, set
the hosted project URL plus publishable key, then run `npm run start` from
`apps/mobile`.

For UI changes, run the dev server and walk through desktop and mobile layouts,
auth redirects, create/upload, browse/search/filter, owner actions, and a
non-owner view. After a remote migration, inspect remote tables/migrations and
run Supabase security/performance advisors.

## Document and hand off

- `CURRENT_STATE.md` says what works, what is next, and concrete risks.
- `ARCHITECTURE.md` maps code and data ownership.
- `WORKFLOW.md` contains repeatable working rules and checks.
- `CHANGELOG.md` records concise context-relevant changes, newest first.
- Commit implementation, tests, migration, and handoff updates together when
  they describe one coherent phase. Do not commit secrets.
