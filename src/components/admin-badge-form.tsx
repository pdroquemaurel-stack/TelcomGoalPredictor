'use client';

import { useState } from 'react';
import { BadgeCriterionType } from '@prisma/client';
import { normalizeBadgeSlug } from '@/lib/badges';

export function AdminBadgeForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <form action={action} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <input
        className="rounded border p-2"
        name="name"
        onChange={(event) => {
          const nextName = event.target.value;
          setName(nextName);
          if (!slugEdited) setSlug(normalizeBadgeSlug(nextName));
        }}
        placeholder="Nom affiché"
        required
        value={name}
      />
      <input
        className="rounded border p-2"
        name="slug"
        onChange={(event) => {
          setSlug(normalizeBadgeSlug(event.target.value));
          setSlugEdited(true);
        }}
        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        placeholder="slug-technique"
        required
        value={slug}
      />
      <select className="rounded border p-2" defaultValue={BadgeCriterionType.PREDICTION_COUNT} name="criterionType" required>
        <option value={BadgeCriterionType.PREDICTION_COUNT}>PREDICTION_COUNT</option>
        <option value={BadgeCriterionType.CORRECT_PREDICTION_COUNT}>CORRECT_PREDICTION_COUNT</option>
        <option value={BadgeCriterionType.EXACT_PREDICTION_COUNT}>EXACT_PREDICTION_COUNT</option>
      </select>
      <input className="rounded border p-2" min={1} name="threshold" placeholder="Seuil" required type="number" />
      <input className="rounded border p-2 md:col-span-2" name="description" placeholder="Description (optionnelle)" />
      <button className="rounded bg-brand px-3 py-2 font-bold text-black md:col-span-2" type="submit">Créer le badge</button>
    </form>
  );
}
