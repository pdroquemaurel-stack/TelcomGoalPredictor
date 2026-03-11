# Pan-African Football Predictor MVP

A mobile-first football prediction platform that telecom operators can brand and deploy quickly.

## 1) What this project is
This app has 2 sides:
- **Player app (mobile-first):** users view matches, submit score predictions, see results, leaderboard, friends, profile QR, and a bonus shop.
- **Admin app (desktop-first):** admins sync fixtures from football API, monitor usage, manage competitions, campaigns, ad slots, products, and users.

It is built to be public on the web and deployable to Render.

---

## 2) What you need before starting
1. **GitHub account** (to store your project code)
2. **Render account** (to host website + PostgreSQL)
3. **football-data.org API key** (to import real matches)

### What these mean (simple)
- **GitHub** = your code storage online.
- **Render** = where your app runs on the internet.
- **API key** = secret key so your app can ask football-data.org for fixture data.

---

## 3) Local installation (step-by-step)

### Step A — Download code
```bash
git clone <YOUR_REPO_URL>
cd TelcomGoalPredictor
```
This copies code from GitHub to your computer.

### Step B — Install packages
```bash
npm install
```
This installs all required libraries.

### Step C — Create environment variables file
```bash
cp .env.example .env
```
Then edit `.env` and fill values.

### Step D — Configure database URL
Use PostgreSQL URL in `.env`:
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public
```

### Step E — Generate Prisma client
```bash
npm run prisma:generate
```
This prepares database access code.

### Step F — Run migrations
```bash
npm run prisma:migrate -- --name init
```
This creates database tables.

### Step G — Seed demo data
```bash
npm run prisma:seed
```
This inserts demo users, fixtures, campaigns, products, and theme.

### Step H — Start app
```bash
npm run dev
```
Open: `http://localhost:3000`

### Step I — Log in
- Admin: `admin@demo.com` / `Admin123!`
- Player: `player@demo.com` / `Player123!`

---

## 4) Render deployment (step-by-step)

### Step 1 — Push code to GitHub
Commit and push this repository.

### Step 2 — Open Render dashboard
- Click **New** → **Blueprint**
- Connect your GitHub repository
- Render will detect `render.yaml`

### Step 3 — Create database automatically
`render.yaml` creates PostgreSQL service named `pan-african-football-db`.

### Step 4 — Set environment variables in Render
In web service settings, confirm:
- `DATABASE_URL` (auto from DB)
- `NEXTAUTH_URL` (your Render public URL)
- `NEXTAUTH_SECRET` (generated or manual)
- `FOOTBALL_DATA_API_KEY` (paste your key)

### Step 5 — Deploy
Render will run:
- build command: install + prisma generate + next build
- start command: prisma migrate deploy + next start

### Step 6 — Seed database on Render (first time)
In Render shell:
```bash
npm run prisma:seed
```

### Step 7 — Open public URL
Visit the URL shown by Render and test login.

---

## 5) Admin first login guide
1. Login with admin account.
2. Open `/admin/dashboard`.
3. Go to **Fixtures** page and click **Sync fixtures from API**.
4. Go to **Ad Inventory** to verify sponsor campaign is linked to slots.
5. Go to player side `/predictions` and submit a prediction.
6. Check `/results` and `/leaderboards`.

---

## 6) Common errors and fixes

### Error: Database connection failed
- Check `DATABASE_URL`
- Confirm PostgreSQL is running
- Confirm IP/network access

### Error: Missing env variable
- Ensure `.env` exists
- Ensure `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `FOOTBALL_DATA_API_KEY` are filled

### Error: Prisma migration issue
- Run `npm run prisma:generate`
- Then rerun migration command
- If local dev DB is broken, recreate DB and run migration again

### Error: football API key issue
- Check `FOOTBALL_DATA_API_KEY`
- Ensure your key is active on football-data.org

### Error: Render build failed
- Check logs for missing env vars
- Ensure Node version is compatible
- Confirm `DATABASE_URL` points to Render DB

---

## 7) Project structure explained simply
- `src/app` → pages and API routes (player + admin)
- `src/lib` → business logic (auth, prisma, sync, scoring, leaderboard)
- `src/components` → reusable UI blocks
- `prisma/schema.prisma` → database models
- `prisma/seed.ts` → demo data
- `render.yaml` → Render deployment blueprint

---

## 8) White-label settings
White-label base config is in `ThemeConfig` table.
You can change:
- operator name
- logo URL
- primary / secondary colors
- home hero text

To customize quickly, update seed values in `prisma/seed.ts` or edit DB rows in admin tooling.

---

## 9) Change football provider later
Provider abstraction is in:
- `src/lib/football/types.ts` (required methods)
- `src/lib/football/football-data-provider.ts` (current implementation)
- `src/lib/football/index.ts` (provider selection)

To swap provider:
1. Create new class implementing `FootballProvider`
2. Return it in `footballProvider()`
3. Keep sync service unchanged

---

## 10) Demo credentials
- **Admin:** `admin@demo.com` / `Admin123!`
- **Player:** `player@demo.com` / `Player123!`

---

## 11) Next improvements
- Real payment integration (for premium mechanics)
- Push/SMS notifications
- Camera-based QR scanner
- Private leagues and league invites
- Advanced analytics dashboard
- Moderation tools
- Full localization (multi-language copy)

---

## 12) UX improvements in this version

- Redesigned homepage with a stronger hero, product-grade CTAs, upcoming match cards, sponsor challenge integration, leaderboard preview, league preview, and progression teaser.
- Reworked predictions into a card-based mobile flow with clear fixture context, open/saved/locked states, quick-pick scores, and stronger success/error/empty/loading feedback.
- Improved prediction persistence visibility: saved scores are now shown immediately after save and remain visible after page reload.
- Upgraded leaderboard presentation with rank emphasis, highlighted top player card, and clearer points/streak trend cues.
- Enhanced league/friends and challenge center pages to feel more competitive and sponsor-driven while keeping the current MVP architecture.
- Cleaned admin dashboard visual hierarchy with clearer operational stat cards.

---

## Useful commands summary
```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:deploy
npm run prisma:seed
npm run sync:fixtures
```
