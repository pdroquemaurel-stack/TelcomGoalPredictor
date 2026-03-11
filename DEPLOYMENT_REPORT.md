# DEPLOYMENT_REPORT

## What was broken
- Render install/build could fail due to `@types/bcryptjs` package fetch/type issues.
- Prisma-backed App Router pages could be statically prerendered during build, causing table-not-found errors when DB was not migrated yet.
- `.env.example` was invalid (contained only a shell command instead of env keys).
- Render commands were not in the safest deploy order for migrations/start separation.
- Seed script could create duplicate campaign/theme records across repeated runs.

## What was changed
- Removed `@types/bcryptjs` dev dependency and added local type declarations for `bcryptjs`.
- Added `export const dynamic = 'force-dynamic'` to all Prisma-backed server pages/layouts and relevant API routes.
- Updated `render.yaml` to:
  - build: `npm install && npm run prisma:generate && npm run build`
  - pre-deploy: `npm run prisma:deploy`
  - start: `npm run start`
- Replaced `.env.example` with real env variable template.
- Made seed safer/idempotent by avoiding duplicate sponsor campaign/theme creation.
- Updated README with exact beginner-friendly Render flow and post-deploy commands.

## Commands now passing
- `npm install`
- `npm run prisma:generate`
- `npm run build`

## Exact Render settings
- Deploy method: Blueprint (`render.yaml`)
- Web service:
  - Build Command: `npm install && npm run prisma:generate && npm run build`
  - Pre-Deploy Command: `npm run prisma:deploy`
  - Start Command: `npm run start`
- Environment variables:
  - `DATABASE_URL` (from Render PostgreSQL)
  - `NEXTAUTH_URL` (manual: your Render URL)
  - `NEXTAUTH_SECRET` (generated)
  - `FOOTBALL_DATA_API_KEY` (optional, manual)

## Exact post-deploy commands to run
Run in Render Shell (web service):
```bash
npm run prisma:seed
```

Optional (after setting `FOOTBALL_DATA_API_KEY`):
- Trigger fixture sync from `/admin/fixtures` in UI.

## Remaining risks / limitations
- Build still shows a non-blocking ESLint warning for `<img>` on `/friends` (does not fail build).
- If `NEXTAUTH_URL` is not set to the exact deployed URL, login callbacks may fail.
- External fixture sync depends on third-party API availability/key limits.
