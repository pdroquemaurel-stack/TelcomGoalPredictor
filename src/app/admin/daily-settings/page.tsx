import { getDailyDisplayDays } from '@/lib/services/daily-service';
import { DailySettingsPicker } from './picker';

export const dynamic = 'force-dynamic';

export default async function AdminDailySettingsPage() {
  const selectedDays = await getDailyDisplayDays();

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Prono du jour</h1>
      <p className="text-sm text-slate-600">Choisissez le nombre de jours à afficher côté joueur (1 à 7).</p>
      <DailySettingsPicker selectedDays={selectedDays} />
    </div>
  );
}
