'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CountryOption } from '@/lib/countries';

type Props = {
  countries: CountryOption[];
  currentCountryCode?: string | null;
  currentCountryName?: string | null;
};

export function ProfileCountryEditor({ countries, currentCountryCode, currentCountryName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState(currentCountryCode ?? '');
  const [pending, setPending] = useState(false);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return countries.slice(0, 12);
    return countries.filter((country) => country.name.toLowerCase().includes(value)).slice(0, 12);
  }, [countries, search]);

  const save = async () => {
    if (!selectedCode) return;
    setPending(true);
    const res = await fetch('/api/profile/country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: selectedCode }),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
      return;
    }

    setPending(false);
  };

  return (
    <>
      <button className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-4 py-3 text-left text-sm font-bold" onClick={() => setOpen(true)} type="button">
        Pays: {currentCountryName ?? 'Non défini'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 md:items-center md:justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-zinc-950 p-5 md:max-w-md">
            <h3 className="text-lg font-black">Modifier votre pays</h3>
            <input
              className="mt-3 w-full rounded-2xl border border-white/15 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-brand"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un pays..."
              value={search}
            />
            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-2">
              {filtered.map((country) => (
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
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="rounded-2xl border border-white/20 px-3 py-2 font-bold" onClick={() => setOpen(false)} type="button">Annuler</button>
              <button className="cta-primary" disabled={!selectedCode || pending} onClick={save} type="button">
                {pending ? '...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
