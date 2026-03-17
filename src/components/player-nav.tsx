'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/', 'Accueil'],
  ['/predictions', 'Pronos'],
  ['/results', 'Résultats'],
  ['/leaderboards', 'Classement'],
  ['/profile', 'Profil'],
] as const;

export function PlayerNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/15 bg-black/95 p-3 backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5 gap-2">
        {links.map(([href, label]) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                className={`block rounded-2xl px-2 py-3 text-center text-xs font-black transition ${active ? 'bg-brand text-black shadow-lg shadow-orange-500/40' : 'border border-white/10 bg-zinc-900 text-white'}`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
