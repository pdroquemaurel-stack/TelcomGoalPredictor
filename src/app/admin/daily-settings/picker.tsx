'use client';

import { useState } from 'react';

export function DailySettingsPicker({ selectedDays }: { selectedDays: number }) {
  const [days, setDays] = useState(selectedDays);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const saveDays = async (nextDays: number) => {
    setDays(nextDays);
    setSaving(true);
    setMessage('');

    const response = await fetch('/api/admin/daily-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: nextDays }),
    });

    if (!response.ok) {
      setMessage('Échec de sauvegarde');
      setSaving(false);
      return;
    }

    setMessage('Paramètre enregistré');
    setSaving(false);
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">Jours affichés</p>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, index) => index + 1).map((value) => (
          <button
            key={value}
            className={`rounded-lg border px-2 py-2 text-sm font-black ${
              value === days ? 'border-brand bg-brand text-black' : 'border-slate-200 text-slate-700'
            }`}
            onClick={() => saveDays(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
      {(saving || message) && <p className="mt-2 text-xs text-slate-500">{saving ? 'Sauvegarde…' : message}</p>}
    </section>
  );
}
