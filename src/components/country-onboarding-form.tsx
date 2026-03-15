'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Country = {
  id: string;
  name: string;
  code: string;
};

export function CountryOnboardingForm({ countries }: { countries: Country[] }) {
  const router = useRouter();
  const [countryId, setCountryId] = useState(countries[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!countryId) {
      setError('Choisissez un pays pour continuer.');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await fetch('/api/onboarding/country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryId }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body?.error?.message ?? 'Impossible de sauvegarder le pays.');
      setSubmitting(false);
      return;
    }

    router.replace('/');
    router.refresh();
  };

  return (
    <form className="card space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-orange-300" htmlFor="countryId">
          Ton pays
        </label>
        <select
          id="countryId"
          value={countryId}
          onChange={(event) => setCountryId(event.target.value)}
          className="w-full rounded-2xl border border-white/20 bg-black px-3 py-3 text-sm font-bold"
        >
          {countries.map((country) => (
            <option key={country.id} value={country.id}>{country.name} ({country.code})</option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-xl border border-rose-400/40 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-100">{error}</p>}

      <button className="cta-primary w-full disabled:opacity-70" disabled={submitting} type="submit">
        {submitting ? 'Enregistrement…' : 'Continuer'}
      </button>
    </form>
  );
}
