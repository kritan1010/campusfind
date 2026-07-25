# CampusFind

CampusFind is a privacy-first lost-and-found platform for campus communities.
Users authenticate with a six-digit email OTP, join an approved or newly
requested college (or continue independently), and keep contact details private
through the full return workflow.

## Repository

- `apps/web` — Next.js App Router web application
- `supabase` — migrations, seed data, local auth configuration, and pgTAP tests
- `docs/plan.md` and `docs/phase1.md`–`docs/phase6.md` — implementation plan and acceptance criteria
- `docs/abstract.md` and `docs/campusfind-brief.html` — product and visual direction
- `context` — concise, current handoff material for developers and LLMs

Phases 1 and 2 provide OTP authentication, profiles and college onboarding,
campus zones, and the privacy-scoped Lost/Found listing board with image upload,
search, filtering, and lifecycle controls. See
[`apps/web/README.md`](../apps/web/README.md) for setup and deployment.
