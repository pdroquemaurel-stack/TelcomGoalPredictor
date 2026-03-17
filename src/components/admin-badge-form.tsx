'use client';

import { useState } from 'react';
import { BadgeCriterionType } from '@prisma/client';
import { normalizeBadgeSlug } from '@/lib/badges';

type BadgeFormValues = {
  id?: string;
  name?: string;
  slug?: string;
  threshold?: number;
  description?: string;
  criterionType?: BadgeCriterionType;
};

export function AdminBadgeForm({ action, initialValues, submitLabel = 'Créer le badge' }: { action: (formData: FormData) => void | Promise<void>; initialValues?: BadgeFormValues; submitLabel?: string }) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [slug, setSlug] = useState(initialValues?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(Boolean(initialValues?.slug));

  return (
    <form action={action} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}
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
      <select className="rounded border p-2" defaultValue={initialValues?.criterionType ?? BadgeCriterionType.PREDICTION_COUNT} name="criterionType" required>
        <option value={BadgeCriterionType.PREDICTION_COUNT}>PREDICTION_COUNT</option>
        <option value={BadgeCriterionType.CORRECT_PREDICTION_COUNT}>CORRECT_PREDICTION_COUNT</option>
        <option value={BadgeCriterionType.EXACT_PREDICTION_COUNT}>EXACT_PREDICTION_COUNT</option>
      </select>
      <input className="rounded border p-2" defaultValue={initialValues?.threshold} min={1} name="threshold" placeholder="Seuil" required type="number" />
      <input className="rounded border p-2 md:col-span-2" defaultValue={initialValues?.description ?? ''} name="description" placeholder="Description (optionnelle)" />
      <button className="rounded bg-brand px-3 py-2 font-bold text-black md:col-span-2" type="submit">{submitLabel}</button>
    </form>
  );
}
