import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ensureAppConfig } from '@/lib/app-config';

export const dynamic = 'force-dynamic';

function toBoolean(value: FormDataEntryValue | null) {
  return value === 'on' || value === 'true';
}

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

async function saveSettings(formData: FormData) {
  'use server';

  const config = await ensureAppConfig();
  const dailyFutureDays = Math.min(7, Math.max(1, Number(formData.get('dailyFutureDays') ?? 2)));
  const dailyPastDays = Math.min(7, Math.max(0, Number(formData.get('dailyPastDays') ?? 2)));
  const maxDailyFixtures = Math.min(300, Math.max(10, Number(formData.get('maxDailyFixtures') ?? 200)));

  const colors = {
    primaryColor: String(formData.get('primaryColor') ?? '#ff7900'),
    secondaryColor: String(formData.get('secondaryColor') ?? '#000000'),
    ctaColor: String(formData.get('ctaColor') ?? '#ff7900'),
    backgroundColor: String(formData.get('backgroundColor') ?? '#000000'),
    cardColor: String(formData.get('cardColor') ?? '#09090b'),
    textColor: String(formData.get('textColor') ?? '#ffffff'),
  };

  const hasInvalidColor = Object.values(colors).some((value) => !HEX_COLOR_REGEX.test(value));
  if (hasInvalidColor) return;

  await prisma.appConfig.update({
    where: { id: config.id },
    data: {
      appName: String(formData.get('appName') ?? 'Telcom Goal Predictor').trim(),
      appTagline: String(formData.get('appTagline') ?? '').trim(),
      welcomeMessage: String(formData.get('welcomeMessage') ?? '').trim(),
      homeBannerMessage: String(formData.get('homeBannerMessage') ?? '').trim(),
      featuredCompetitionId: String(formData.get('featuredCompetitionId') ?? '') || null,
      showChallengesBlock: toBoolean(formData.get('showChallengesBlock')),
      showLeaderboardBlock: toBoolean(formData.get('showLeaderboardBlock')),
      showShopBlock: toBoolean(formData.get('showShopBlock')),
      dailyFutureDays,
      dailyPastDays,
      includeLiveFixturesInDaily: toBoolean(formData.get('includeLiveFixturesInDaily')),
      maxDailyFixtures,
      logoUrl: String(formData.get('logoUrl') ?? '').trim() || null,
      ...colors,
    },
  });

  revalidatePath('/');
  revalidatePath('/predictions');
  revalidatePath('/admin/settings');
}

export default async function AdminSettingsPage() {
  const [config, competitions] = await Promise.all([
    ensureAppConfig(),
    prisma.competition.findMany({ orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] }),
  ]);

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Paramètres globaux</h1>
      <form action={saveSettings} className="space-y-4 rounded-2xl bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold">Nom app<input name="appName" className="mt-1 w-full rounded border p-2" defaultValue={config.appName} /></label>
          <label className="text-sm font-semibold">Tagline<input name="appTagline" className="mt-1 w-full rounded border p-2" defaultValue={config.appTagline} /></label>
          <label className="text-sm font-semibold md:col-span-2">Message accueil<input name="welcomeMessage" className="mt-1 w-full rounded border p-2" defaultValue={config.welcomeMessage} /></label>
          <label className="text-sm font-semibold md:col-span-2">Bannière home<input name="homeBannerMessage" className="mt-1 w-full rounded border p-2" defaultValue={config.homeBannerMessage} /></label>
          <label className="text-sm font-semibold">Compétition mise en avant (feed home/daily)
            <select name="featuredCompetitionId" className="mt-1 w-full rounded border p-2" defaultValue={config.featuredCompetitionId ?? ''}>
              <option value="">Aucune</option>
              {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Logo URL (branding, en réserve)<input name="logoUrl" className="mt-1 w-full rounded border p-2" defaultValue={config.logoUrl ?? ''} /><span className="mt-1 block text-xs font-normal text-slate-500">Stocké pour le branding opérateur. Non affiché dans les écrans joueurs actuels.</span></label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm font-semibold">Future days (fenêtre /predictions)<input type="number" min={1} max={7} name="dailyFutureDays" className="mt-1 w-full rounded border p-2" defaultValue={config.dailyFutureDays} /></label>
          <label className="text-sm font-semibold">Past days<input type="number" min={0} max={7} name="dailyPastDays" className="mt-1 w-full rounded border p-2" defaultValue={config.dailyPastDays} /></label>
          <label className="text-sm font-semibold">Max fixtures<input type="number" min={10} max={300} name="maxDailyFixtures" className="mt-1 w-full rounded border p-2" defaultValue={config.maxDailyFixtures} /></label>
        </div>

        <div className="grid gap-2 text-sm md:grid-cols-2">
          <label><input type="checkbox" name="includeLiveFixturesInDaily" defaultChecked={config.includeLiveFixturesInDaily} /> Inclure les matchs live dans le daily feed</label>
          <label><input type="checkbox" name="showChallengesBlock" defaultChecked={config.showChallengesBlock} /> Afficher bloc challenges</label>
          <label><input type="checkbox" name="showLeaderboardBlock" defaultChecked={config.showLeaderboardBlock} /> Afficher bloc leaderboard</label>
          <label><input type="checkbox" name="showShopBlock" defaultChecked={config.showShopBlock} /> Afficher bloc shop</label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['primaryColor', 'Couleur principale'],
            ['secondaryColor', 'Couleur secondaire'],
            ['ctaColor', 'Couleur CTA'],
            ['backgroundColor', 'Fond principal'],
            ['cardColor', 'Fond cartes'],
            ['textColor', 'Texte'],
          ].map(([name, label]) => (
            <label className="text-sm font-semibold" key={name}>{label}
              <input type="color" name={name} className="mt-1 h-10 w-full rounded border p-1" defaultValue={(config as any)[name]} />
            </label>
          ))}
        </div>

        <button type="submit" className="rounded bg-brand px-4 py-2 font-bold text-black">Sauvegarder les paramètres</button>
      </form>
    </div>
  );
}
