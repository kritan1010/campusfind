# CampusFind

CampusFind is a privacy-first lost-and-found platform for campus communities.
Users authenticate with a six-digit email OTP, join an approved or newly
requested college (or continue independently), and keep contact details private
through the full return workflow.

## Repository

- `apps/web` — Next.js App Router web application
- `supabase` — migrations, seed data, local auth configuration, and pgTAP tests
- `plan.md` and `phase1.md`–`phase6.md` — implementation plan and acceptance criteria
- `abstract.md` and `campusfind-brief.html` — product and visual direction

Phase 1 provides the web scaffold, OTP authentication, profiles, college
onboarding, campus zones, and default-deny Row Level Security. See
[`apps/web/README.md`](apps/web/README.md) for local setup and verification.
