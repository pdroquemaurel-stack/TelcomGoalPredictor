'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { CountryOption } from '@/lib/countries';

type Props = {
  countries: CountryOption[];
};

export function CountryRequiredOverlay({ countries }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [pending, setPending] = useState(false);

  const hidden = pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/admin');

  const filteredCountries = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return countries.slice(0, 12);
    return countries.filter((country) => country.name.toLowerCase().includes(value)).slice(0, 12);
  }, [countries, search]);

  const onSubmit = async () => {
    if (!selectedCode) return;
    setPending(true);

    const res = await fetch('/api/profile/country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: selectedCode }),
    });

    if (res.ok) {
      router.refresh();
      return;
    }

    setPending(false);
  };

  if (hidden) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-black/70 p-3 md:items-center md:justify-center">
      <div className="w-full rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl md:max-w-md">
        <h2 className="text-2xl font-black">Choisissez votre pays</h2>
        <p className="mt-2 text-sm text-zinc-200">Pour continuer, sélectionnez votre pays.</p>

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

        <button className="cta-primary mt-4 w-full disabled:opacity-50" disabled={!selectedCode || pending} onClick={onSubmit} type="button">
          {pending ? 'Enregistrement...' : 'Commencer à parier'}
        </button>
      </div>
    </div>
  );
}
