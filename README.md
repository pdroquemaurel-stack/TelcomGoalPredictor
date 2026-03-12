# TelcomGoalPredictor MVP

A mobile-first football prediction app for a pan-African audience, focused on a reliable core game loop.

## MVP Scope

### Player
- Homepage
- Predictions
- Results
- Leaderboard
- Profile

### Admin
- Dashboard
- Competitions
- Fixtures
- Users
- Sync fixtures

Temporarily disabled in MVP mode: friends, bonus shop, QR/friend features, ad/campaign/product tooling.

## Core Game Rules

- One prediction per user per fixture (`@@unique([userId, fixtureId])`).
- Prediction allowed only before kickoff and only when fixture state is `SCHEDULED`.
- Scoring rules (single source of truth in `src/lib/scoring.ts`):
  - Exact score = 3 points
  - Correct outcome = 1 point
  - Wrong outcome = 0 points
- Fixture lifecycle:
  - `SCHEDULED` → `LIVE` → `FINISHED` → `SETTLED`

## Installation

```bash
git clone <YOUR_REPO_URL>
cd TelcomGoalPredictor
npm install
cp .env.example .env
```

Fill `.env` values.

## Database setup

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

## Run locally

```bash
npm run dev
```

App: http://localhost:3000

Demo credentials:
- Admin: `admin@demo.com` / `Admin123!`
- Player: `player@demo.com` / `Player123!`

## Settlement & Leaderboard workflow

Settlement is idempotent and re-runnable via `settleFinishedFixtures`:
1. Detect finished fixtures (`homeScore`/`awayScore` + status check).
2. Compute and persist `prediction.pointsAwarded`.
3. Mark fixtures as `SETTLED` and lock predictions.
4. Rebuild impacted user profile totals from predictions.
5. Rebuild all-time leaderboard snapshot.

Triggered after admin sync in `POST /api/admin/sync`.

## Render deployment

This repo includes `render.yaml`.

1. Create Render Blueprint from this repository.
2. Ensure env vars are set:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `FOOTBALL_DATA_API_KEY`
3. Deploy.
4. Run seed once in Render shell:
   ```bash
   npm run prisma:seed
   ```

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate -- --name <migration_name>
npm run prisma:deploy
npm run prisma:seed
npm run sync:fixtures
```
