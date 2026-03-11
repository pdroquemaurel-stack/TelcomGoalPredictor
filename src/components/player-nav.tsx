import Link from 'next/link';

const links = [
  ['/', 'Home'],
  ['/predictions', 'Predict'],
  ['/results', 'Results'],
  ['/leaderboards', 'Leaders'],
  ['/friends', 'Leagues'],
  ['/shop', 'Challenges'],
  ['/profile', 'Profile'],
];

export function PlayerNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-2 backdrop-blur">
      <ul className="mx-auto grid max-w-4xl grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-600">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="block rounded-lg px-1 py-2 hover:bg-slate-100 hover:text-slate-900">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
