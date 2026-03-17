'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const links = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/competitions', 'Compétitions'],
  ['/admin/fixtures', 'Matchs'],
  ['/admin/users', 'Utilisateurs'],
  ['/admin/operations', 'Sync & opérations'],
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid max-w-7xl gap-4 p-4 md:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
          <h2 className="mb-1 font-bold text-slate-900">Admin MVP</h2>
          <p className="mb-3 text-xs text-slate-500">Parcours principal: dashboard, compétitions, matchs, utilisateurs et sync.</p>
          <nav className="space-y-1 text-sm">
            {links.map(([href, label]) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  className={`block rounded-lg px-3 py-2 transition ${active ? 'bg-brand/20 font-bold text-slate-900' : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900'}`}
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
