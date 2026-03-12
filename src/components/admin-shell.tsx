import Link from 'next/link';
import { ReactNode } from 'react';

const links = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/competitions', 'Competitions'],
  ['/admin/challenges', 'Challenges'],
  ['/admin/fixtures', 'Matches'],
  ['/admin/operations', 'Operations'],
  ['/admin/users', 'Users'],
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-[220px_1fr] gap-4 p-4">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
          <h2 className="mb-3 font-bold text-slate-900">Admin POC</h2>
          <nav className="space-y-1 text-sm">
            {links.map(([href, label]) => (
              <Link
                className="block rounded-lg px-3 py-2 text-slate-800 hover:bg-slate-100 hover:text-slate-900"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
