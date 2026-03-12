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

## Team logos (player match cards)

- Store logo files in: `public/teams/`
- Recommended naming convention:
  - lowercase
  - kebab-case
  - stable names
  - examples: `france.png`, `morocco.png`, `ivory-coast.png`, `manchester-city.png`
- Assign logos to teams using `Team.logoUrl` (example: `/teams/morocco.png`).
- If `logoUrl` is empty, the app automatically tries `/teams/<normalized-team-name>.png`.
- If the file does not exist, the UI falls back to a circular initials badge.

## Daily predictions & challenges (POC)

### Daily flow (Aujourd’hui / Demain)
- Only fixtures from competitions with `Competition.isDailyEnabled = true` are included.
- Daily feed uses a short window: today + tomorrow.
- Only open/predictable fixtures are shown (`SCHEDULED`, `predictionEnabled`, `visible`).
- Player entry points:
  - Home (`/`) section “Matchs du jour & demain”
  - Dedicated page: `/daily`

### Challenges flow
- Admin creates a `Challenge` linked to one competition with a period (`startDate` → `endDate`).
- Matching fixtures are linked into `ChallengeFixture` (unique by `challengeId + fixtureId`).
- Player entry points:
  - Challenges list: `/challenges`
  - Challenge detail: `/challenges/[slug]`
- Challenge leaderboard is computed dynamically from predictions on challenge fixtures.

### Admin configuration
- Daily feed toggle per competition: Admin > Competitions (`isDailyEnabled`).
- Challenge management: Admin > Challenges (create/list/delete in MVP).
- Manual sync: Admin > Operations > “Actualiser les matchs depuis l’API”.
- Purge (POC only): Admin > Operations > Danger Zone.
  - Requires admin role and `DELETE` confirmation.
  - Removes dependent rows first, then fixtures/competitions/teams.
- If you previously imported generic team names (e.g. `Team 516`), run:
  1. Admin > Operations > Purge (confirm `DELETE`)
  2. Admin > Operations > Manual sync
  This recreates teams with real `name`, `shortName`, and `crestUrl` from football-data.

### API surface added
- Player:
  - `GET /api/public/daily`
  - `GET /api/public/challenges`
  - `GET /api/public/challenges/[slug]`
  - `GET /api/public/challenges/[slug]/leaderboard`
- Admin:
  - `GET/POST /api/admin/challenges`
  - `PATCH/DELETE /api/admin/challenges/[id]`
  - `PATCH /api/admin/competitions/[id]/daily`
  - `POST /api/admin/sync` (now returns sync summary)
  - `POST /api/admin/purge`
