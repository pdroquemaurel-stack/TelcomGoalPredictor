'use client';

import { useMemo, useState } from 'react';
import type { CountryOption } from '@/lib/countries';

type Props = {
  countries: CountryOption[];
  defaultCountryCode?: string;
  displayName: string;
};

export function OnboardingModal({ countries, defaultCountryCode, displayName }: Props) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState(defaultCountryCode ?? '');
  const [pending, setPending] = useState(false);

  const filteredCountries = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return countries.slice(0, 12);
    return countries.filter((country) => country.name.toLowerCase().includes(value)).slice(0, 12);
  }, [countries, search]);

  const selectedCountry = countries.find((country) => country.code === selectedCode);

  const handleFinish = async () => {
    if (!selectedCode) return;
    setPending(true);

    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: selectedCode }),
    });

    if (response.ok) {
      setOpen(false);
      window.location.reload();
      return;
    }

    setPending(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 md:items-center md:justify-center">
      <div className="w-full rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl md:max-w-md">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Bienvenue</p>
        <h2 className="mt-1 text-2xl font-black">Salut {displayName} 👋</h2>
        <p className="mt-2 text-sm text-zinc-200">Prédisez les matchs, gagnez des points et montez dans le leaderboard.</p>

        <div className="mt-4">
          <label className="text-xs font-black uppercase tracking-[0.12em] text-zinc-300" htmlFor="country-search">
            Choisissez votre pays
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-white/15 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-brand"
            id="country-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un pays..."
            value={search}
          />

          <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-2">
            {filteredCountries.map((country) => (
              <button
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${selectedCode === country.code ? 'bg-brand text-black' : 'bg-zinc-800 text-white'}`}
                key={country.code}
                onClick={() => {
                  setSelectedCode(country.code);
                  setSearch(country.name);
                }}
                type="button"
              >
                {country.name}
              </button>
            ))}
            {!filteredCountries.length && <p className="px-2 py-3 text-xs text-zinc-400">Aucun pays trouvé.</p>}
          </div>

          <p className="mt-2 text-xs text-zinc-400">Sélection: {selectedCountry?.name ?? 'Aucun pays sélectionné'}</p>
        </div>

        <button className="cta-primary mt-4 w-full disabled:opacity-50" disabled={!selectedCode || pending} onClick={handleFinish} type="button">
          {pending ? 'Enregistrement...' : 'Terminer'}
        </button>
      </div>
    </div>
  );
}
