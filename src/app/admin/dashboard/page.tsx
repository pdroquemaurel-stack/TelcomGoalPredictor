import Link from 'next/link';
import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Period = 'week' | 'month';

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage({ searchParams }: { searchParams?: { period?: string | string[] } }) {
  const selectedPeriod = (Array.isArray(searchParams?.period) ? searchParams?.period[0] : searchParams?.period) === 'month' ? 'month' : 'week';
  const period: Period = selectedPeriod;
  const days = period === 'month' ? 30 : 7;

  const end = startOfDayUtc(new Date());
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const [users, predictions, predictionsWithScores, unfinishedPredictions, loginActivities] = await Promise.all([
    prisma.user.count(),
    prisma.prediction.count(),
    prisma.prediction.findMany({
      where: { fixture: { homeScore: { not: null }, awayScore: { not: null } } },
      select: { homeScore: true, awayScore: true, fixture: { select: { homeScore: true, awayScore: true } } },
      take: 30000,
    }),
    prisma.prediction.count({ where: { fixture: { OR: [{ homeScore: null }, { awayScore: null }, { fixtureState: { in: [FixtureState.SCHEDULED, FixtureState.LIVE] } }] } } }),
    prisma.loginActivity.findMany({ where: { createdAt: { gte: start } }, select: { userId: true, createdAt: true } }),
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

  const activityMap = new Map<string, { logins: number; uniqueUsers: Set<string> }>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    const key = date.toISOString().slice(0, 10);
    activityMap.set(key, { logins: 0, uniqueUsers: new Set<string>() });
  }

  for (const row of loginActivities) {
    const key = startOfDayUtc(row.createdAt).toISOString().slice(0, 10);
    const bucket = activityMap.get(key);
    if (!bucket) continue;
    bucket.logins += 1;
    bucket.uniqueUsers.add(row.userId);
  }

  const activity = Array.from(activityMap.entries()).map(([key, value]) => ({
    date: key,
    label: formatDayLabel(new Date(`${key}T00:00:00.000Z`)),
    logins: value.logins,
    uniqueUsers: value.uniqueUsers.size,
  }));

  const maxMetric = Math.max(...activity.flatMap((d) => [d.logins, d.uniqueUsers]), 1);

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-slate-600">Pilotage admin : KPI pronostics + activité de connexion.</p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Total predictions</p><p className="mt-1 text-2xl font-bold">{predictions}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Exact predictions</p><p className="mt-1 text-2xl font-bold">{exactPredictions}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Correct outcome predictions</p><p className="mt-1 text-2xl font-bold">{correctOutcomePredictions}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Predictions on unfinished matches</p><p className="mt-1 text-2xl font-bold">{unfinishedPredictions}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Total users</p><p className="mt-1 text-2xl font-bold">{users}</p></div>
      </div>

      <section className="rounded-2xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Analytics connexions</h2>
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <Link className={`rounded px-3 py-1 ${period === 'week' ? 'bg-brand text-black' : 'text-slate-700'}`} href="/admin/dashboard?period=week">Semaine</Link>
            <Link className={`rounded px-3 py-1 ${period === 'month' ? 'bg-brand text-black' : 'text-slate-700'}`} href="/admin/dashboard?period=month">Mois</Link>
          </div>
        </div>

        <div className="space-y-2">
          {activity.map((item) => (
            <div key={item.date} className="rounded-xl border border-slate-100 p-2">
              <p className="text-xs font-semibold text-slate-600">{item.label}</p>
              <div className="mt-1 grid gap-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-24">Joueurs uniques</span>
                  <div className="h-2 flex-1 rounded bg-slate-200"><div className="h-2 rounded bg-emerald-500" style={{ width: `${(item.uniqueUsers / maxMetric) * 100}%` }} /></div>
                  <span className="w-6 text-right font-bold">{item.uniqueUsers}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-24">Connexions</span>
                  <div className="h-2 flex-1 rounded bg-slate-200"><div className="h-2 rounded bg-orange-500" style={{ width: `${(item.logins / maxMetric) * 100}%` }} /></div>
                  <span className="w-6 text-right font-bold">{item.logins}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
