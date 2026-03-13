'use client';

import { useMemo, useState } from 'react';
import type { CountryOption } from '@/lib/countries';

type Props = {
  countries: CountryOption[];
  currentCountryCode?: string;
  currentCountryName?: string;
};

export function ProfileCountryEditor({ countries, currentCountryCode, currentCountryName }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState(currentCountryName ?? '');
  const [selectedCode, setSelectedCode] = useState(currentCountryCode ?? '');

  const filteredCountries = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return countries.slice(0, 12);
    return countries.filter((country) => country.name.toLowerCase().includes(value)).slice(0, 12);
  }, [countries, search]);

  const selectedCountry = countries.find((country) => country.code === selectedCode);

  const saveCountry = async () => {
    if (!selectedCode) return;
    setPending(true);

    const response = await fetch('/api/profile/country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: selectedCode }),
    });

    if (response.ok) {
      window.location.reload();
      return;
    }

    setPending(false);
  };

  return (
    <>
      <button
        className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-4 py-3 text-left text-sm font-bold"
        onClick={() => setOpen(true)}
        type="button"
      >
        Pays: {currentCountryName ?? 'Non renseigné'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 md:items-center md:justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl md:max-w-md">
            <h2 className="text-xl font-black">Modifier mon pays</h2>
            <input
              className="mt-3 w-full rounded-2xl border border-white/15 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-brand"
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
            </div>

            <p className="mt-2 text-xs text-zinc-300">Sélection: {selectedCountry?.name ?? 'Aucun pays sélectionné'}</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-xl border border-white/20 px-3 py-2 text-sm font-bold" onClick={() => setOpen(false)} type="button">Annuler</button>
              <button className="cta-primary" disabled={!selectedCode || pending} onClick={saveCountry} type="button">
                {pending ? 'Enregistrement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
