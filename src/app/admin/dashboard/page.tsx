import Link from 'next/link';
import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AdminAnalyticsChart } from '@/components/admin-analytics-chart';

type Period = 'week' | 'month';

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage({ searchParams }: { searchParams?: { period?: string | string[]; country?: string | string[] } }) {
  const selectedPeriod = (Array.isArray(searchParams?.period) ? searchParams?.period[0] : searchParams?.period) === 'month' ? 'month' : 'week';
  const period: Period = selectedPeriod;
  const days = period === 'month' ? 30 : 7;
  const selectedCountry = (Array.isArray(searchParams?.country) ? searchParams?.country[0] : searchParams?.country) ?? 'ALL';

  const end = startOfDayUtc(new Date());
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const whereCountry = selectedCountry === 'ALL'
    ? {}
    : { user: { profile: { country: { code: selectedCountry } } } };

  const [users, predictions, predictionsWithScores, unfinishedPredictions, loginActivities, predictionCreations, apiRequests, countries] = await Promise.all([
    prisma.user.count(),
    prisma.prediction.count(),
    prisma.prediction.findMany({
      where: { fixture: { homeScore: { not: null }, awayScore: { not: null } } },
      select: { homeScore: true, awayScore: true, fixture: { select: { homeScore: true, awayScore: true } } },
      take: 30000,
    }),
    prisma.prediction.count({ where: { fixture: { OR: [{ homeScore: null }, { awayScore: null }, { fixtureState: { in: [FixtureState.SCHEDULED, FixtureState.LIVE] } }] } } }),
    prisma.loginActivity.findMany({ where: { createdAt: { gte: start }, ...whereCountry }, select: { userId: true, createdAt: true } }),
    prisma.prediction.findMany({ where: { createdAt: { gte: start }, ...whereCountry }, select: { userId: true, createdAt: true } }),
    prisma.auditLog.findMany({ where: { action: 'API_REQUEST', createdAt: { gte: start }, ...(selectedCountry === 'ALL' ? {} : { metadata: { path: ['countryCode'], equals: selectedCountry } }) }, select: { createdAt: true } }),
    prisma.country.findMany({ orderBy: { name: 'asc' } }),
  ]);

  let exactPredictions = 0;
  let correctOutcomePredictions = 0;

  for (const row of predictionsWithScores) {
    const finalHome = row.fixture.homeScore;
    const finalAway = row.fixture.awayScore;
    if (finalHome === null || finalAway === null) continue;

    const exact = row.homeScore === finalHome && row.awayScore === finalAway;
    const predictedDiff = row.homeScore - row.awayScore;
    const finalDiff = finalHome - finalAway;
    const correctOutcome = (predictedDiff === 0 && finalDiff === 0) || (predictedDiff > 0 && finalDiff > 0) || (predictedDiff < 0 && finalDiff < 0);

    if (exact) exactPredictions += 1;
    if (correctOutcome) correctOutcomePredictions += 1;
  }

  const activityMap = new Map<string, { logins: number; uniqueUsers: Set<string>; newPredictions: number; apiRequests: number }>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    const key = date.toISOString().slice(0, 10);
    activityMap.set(key, { logins: 0, uniqueUsers: new Set<string>(), newPredictions: 0, apiRequests: 0 });
  }

  for (const row of loginActivities) {
    const key = startOfDayUtc(row.createdAt).toISOString().slice(0, 10);
    const bucket = activityMap.get(key);
    if (!bucket) continue;
    bucket.logins += 1;
    bucket.uniqueUsers.add(row.userId);
  }

  for (const row of predictionCreations) {
    const key = startOfDayUtc(row.createdAt).toISOString().slice(0, 10);
    const bucket = activityMap.get(key);
    if (!bucket) continue;
    bucket.newPredictions += 1;
  }

  for (const row of apiRequests) {
    const key = startOfDayUtc(row.createdAt).toISOString().slice(0, 10);
    const bucket = activityMap.get(key);
    if (!bucket) continue;
    bucket.apiRequests += 1;
  }

  const activity = Array.from(activityMap.entries()).map(([key, value]) => ({
    date: key,
    label: formatDayLabel(new Date(`${key}T00:00:00.000Z`)),
    logins: value.logins,
    uniqueUsers: value.uniqueUsers.size,
    newPredictions: value.newPredictions,
    apiRequests: value.apiRequests,
  }));

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-slate-600">Pilotage admin : KPI pronostics + activité joueur/API.</p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Total predictions</p><p className="mt-1 text-2xl font-bold">{predictions}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Exact predictions</p><p className="mt-1 text-2xl font-bold">{exactPredictions}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Correct outcome predictions</p><p className="mt-1 text-2xl font-bold">{correctOutcomePredictions}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Predictions on unfinished matches</p><p className="mt-1 text-2xl font-bold">{unfinishedPredictions}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Total users</p><p className="mt-1 text-2xl font-bold">{users}</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 text-sm">
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <Link className={`rounded px-3 py-1 ${period === 'week' ? 'bg-brand text-black' : 'text-slate-700'}`} href={`/admin/dashboard?${new URLSearchParams({ period: 'week', country: selectedCountry }).toString()}`}>Semaine</Link>
          <Link className={`rounded px-3 py-1 ${period === 'month' ? 'bg-brand text-black' : 'text-slate-700'}`} href={`/admin/dashboard?${new URLSearchParams({ period: 'month', country: selectedCountry }).toString()}`}>Mois</Link>
        </div>

        <span className="ml-1 text-xs font-semibold uppercase text-slate-600">Pays</span>
        <div className="flex flex-wrap gap-1">
          <Link href={`/admin/dashboard?${new URLSearchParams({ period, country: 'ALL' }).toString()}`} className={`rounded-full border px-2 py-1 text-xs ${selectedCountry === 'ALL' ? 'border-slate-900 text-slate-900' : 'border-slate-300 text-slate-500'}`}>Tous</Link>
          {countries.map((country) => (
            <Link
              key={country.code}
              href={`/admin/dashboard?${new URLSearchParams({ period, country: country.code }).toString()}`}
              className={`rounded-full border px-2 py-1 text-xs ${selectedCountry === country.code ? 'border-slate-900 text-slate-900' : 'border-slate-300 text-slate-500'}`}
            >
              {country.name}
            </Link>
          ))}
        </div>
      </div>

      <AdminAnalyticsChart activity={activity} />
    </div>
  );
}
