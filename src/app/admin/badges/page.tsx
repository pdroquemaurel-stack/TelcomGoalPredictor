import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminBadgesPage() {
  const badges = await prisma.badge.findMany({ orderBy: { name: 'asc' } });

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Badge</p>
        <h1 className="text-2xl font-black">Gestion des badges</h1>
      </header>

      <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-bold">Process d&apos;ajout (MVP)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Ajouter l&apos;image .webp dans <code>public/badges/</code> avec le nom <code>&lt;code-badge&gt;.webp</code>.</li>
          <li>Créer le badge en base (code, name, description).</li>
          <li>Configurer la règle dans <code>src/lib/badge-rules.ts</code>.</li>
          <li>Lancer le recalcul d&apos;attribution via script/admin job.</li>
        </ol>
      </article>

      <div className="grid gap-2 md:grid-cols-2">
        {badges.map((badge) => (
          <article className="rounded-xl border border-slate-200 p-3" key={badge.id}>
            <p className="font-bold">{badge.name}</p>
            <p className="text-xs text-slate-500">code: {badge.code}</p>
            <p className="mt-1 text-sm text-slate-700">{badge.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
