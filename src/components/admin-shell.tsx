import Link from 'next/link';
import { ReactNode } from 'react';

const links = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/fixtures', 'Fixtures'],
  ['/admin/competitions', 'Competitions'],
  ['/admin/leaderboards', 'Leaderboards'],
  ['/admin/ads', 'Ad Slots'],
  ['/admin/campaigns', 'Campaigns'],
  ['/admin/products', 'Products'],
  ['/admin/users', 'Users'],
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-[220px_1fr] gap-4 p-4">
        <aside className="card h-fit">
          <h2 className="mb-3 font-bold">Admin</h2>
          <nav className="space-y-1 text-sm">
            {links.map(([href, label]) => <Link className="block rounded p-2 hover:bg-slate-100" href={href} key={href}>{label}</Link>)}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
