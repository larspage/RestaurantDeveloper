# MAILBOX — RestaurantDeveloper

## Open Threads

- **Kitchen Display System** — Restaurant staff need an interface to view/manage incoming orders. This is Phase 2 of Order Management (3/9 tasks done, 6 remaining).
- **Production Deployment** — CI/CD pipeline, Docker config, DigitalOcean deployment all at 0%. Need to set up before launch.
- **Production Security** — Hardcoded Supabase credentials in `backend/db/supabase.js` must be replaced with environment variables before production deployment. (Deferred - OK for dev mode)

## Context

- **Platform**: B2B SaaS for restaurant owners (website creation, menu management, online ordering)
- **Stack**: Next.js, Node.js/Express, MongoDB, Supabase, MinIO/S3, TypeScript, Tailwind
- **Ports**: Backend 3550, Frontend 3000, Customer Website Template 3551
- **Test Status**: 52/52 passing

## Recent Decisions

- Order Management Dashboard prioritized over deployment
- Customer Website Template ready for deployment (Phase 1 complete)

## Last Sync

- 2026-04-08T20:45:00Z
