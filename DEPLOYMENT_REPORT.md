# Deployment Report

## Root cause
Render failed during `next build` because several App Router pages and GET route handlers executed Prisma queries while Next.js was attempting static prerender/static optimization. In Render's build environment, migrations had not yet been applied to the target database, so Prisma queries failed with `P2021` (missing tables such as `User`, `Profile`, `Fixture`, `Product`, `Prediction`, `SponsorCampaign`, and `AdSlot`).

## Files changed
- `src/app/page.tsx`
- `src/app/friends/page.tsx`
- `src/app/leaderboards/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/results/page.tsx`
- `src/app/shop/page.tsx`
- `src/app/admin/ads/page.tsx`
- `src/app/admin/campaigns/page.tsx`
- `src/app/admin/competitions/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/fixtures/page.tsx`
- `src/app/admin/products/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/api/public/fixtures/route.ts`
- `src/app/api/ad/click/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `DEPLOYMENT_REPORT.md`

## Why the fix works
For every DB-backed page and DB-backed GET route, I enforced runtime rendering by adding:

- `export const dynamic = 'force-dynamic'`
- `export const revalidate = 0`

This prevents static prerendering/caching behavior that can trigger database access during build time. The DB queries now run only at request time, after the service has started and `prisma migrate deploy` has been executed.

## Exact Render deploy flow
1. Render runs build command from `render.yaml`:
   - `npm install && npm run prisma:generate && npm run build`
2. Build now succeeds because DB-backed routes/pages are runtime dynamic and not statically prerendered.
3. Render starts web service with:
   - `npm run prisma:deploy && npm run start`
4. `prisma migrate deploy` applies migrations to create required tables before handling traffic.
5. Next.js app serves DB-backed pages and API routes at runtime.

## Post-deploy commands
- Required for first-time demo content only (optional but recommended):
  - `npm run prisma:seed`

No seed data is required for the app to build successfully.
