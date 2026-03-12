'use client';

import { useState } from 'react';

export function AdminDailyWindowSetting({ initialDays }: { initialDays: number }) {
  const [days, setDays] = useState(initialDays);
  const [saving, setSaving] = useState(false);

  const update = async (next: number) => {
    setDays(next);
    setSaving(true);
    const response = await fetch('/api/admin/settings/daily-window', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: next }),
    });

    if (!response.ok) {
      setDays(initialDays);
      setSaving(false);
      return;
    }

    setSaving(false);
  };

  return (
    <section className="rounded-2xl bg-white p-4">
      <h2 className="text-sm font-bold uppercase text-slate-600">Prono du jour</h2>
      <p className="mt-1 text-sm text-slate-600">Nombre de jours affichés (1 à 7)</p>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((value) => (
          <button
            key={value}
            className={`rounded-lg border px-2 py-2 text-sm font-bold ${days === value ? 'border-brand bg-brand text-black' : 'border-slate-300 text-slate-700'}`}
            onClick={() => update(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
      {saving && <p className="mt-2 text-xs text-slate-500">Mise à jour…</p>}
    </section>
  );
}
