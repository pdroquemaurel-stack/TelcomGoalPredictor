import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createBadgeInputSchema, normalizeBadgeSlug } from '@/lib/badges';
import { resolveBadgeImagePath } from '@/lib/badge-image';
import { AdminBadgeForm } from '@/components/admin-badge-form';

export const dynamic = 'force-dynamic';

async function createBadge(formData: FormData) {
  'use server';

  const parsed = createBadgeInputSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    slug: normalizeBadgeSlug(String(formData.get('slug') ?? '')),
    criterionType: String(formData.get('criterionType') ?? ''),
    threshold: formData.get('threshold'),
    description: String(formData.get('description') ?? ''),
    isActive: 'true',
    displayOrder: '0',
  });

  if (!parsed.success) return;

  const existing = await prisma.badge.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (existing) return;

  await prisma.badge.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      criterionType: parsed.data.criterionType,
      threshold: parsed.data.threshold,
      description: parsed.data.description || '',
      isActive: parsed.data.isActive,
      displayOrder: parsed.data.displayOrder,
    },
  });

  revalidatePath('/admin/badges');
  revalidatePath('/profile');
}

async function updateBadge(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const parsed = createBadgeInputSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    slug: normalizeBadgeSlug(String(formData.get('slug') ?? '')),
    criterionType: String(formData.get('criterionType') ?? ''),
    threshold: formData.get('threshold'),
    description: String(formData.get('description') ?? ''),
    isActive: 'true',
    displayOrder: '0',
  });

  if (!parsed.success) return;

  const slugOwner = await prisma.badge.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (slugOwner && slugOwner.id !== id) return;

  await prisma.badge.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      criterionType: parsed.data.criterionType,
      threshold: parsed.data.threshold,
      description: parsed.data.description || '',
    },
  });

  revalidatePath('/admin/badges');
  revalidatePath('/profile');
}

export default async function AdminBadgesPage() {
  const badges = await prisma.badge.findMany({
    orderBy: [{ displayOrder: 'asc' }, { threshold: 'asc' }, { name: 'asc' }],
  });

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Badge</p>
        <h1 className="text-2xl font-black">Gestion des badges</h1>
      </header>

      <AdminBadgeForm action={createBadge} />

      <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-bold">Convention image</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Déposer l&apos;image en <code>public/badges/&lt;slug&gt;.webp</code>.</li>
          <li>Si l&apos;image est absente, le fallback <code>/badges/badge.webp</code> est utilisé automatiquement.</li>
        </ol>
      </article>

      <div className="space-y-3">
        {badges.map((badge) => (
          <article className="rounded-xl border border-slate-200 p-3" key={badge.id}>
            <div className="mb-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={badge.name} className="h-14 w-14 rounded-lg object-cover" src={resolveBadgeImagePath(badge.slug)} />
              <div>
                <p className="font-bold">{badge.name}</p>
                <p className="text-xs text-slate-500">Image: /badges/{badge.slug}.webp</p>
              </div>
            </div>
            <AdminBadgeForm
              action={updateBadge}
              initialValues={{
                id: badge.id,
                name: badge.name,
                slug: badge.slug,
                criterionType: badge.criterionType,
                threshold: badge.threshold,
                description: badge.description,
              }}
              submitLabel="Modifier le badge"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
