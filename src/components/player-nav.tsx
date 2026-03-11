import Link from 'next/link';

const links = [
  ['/', 'Home'],
  ['/predictions', 'Predictions'],
  ['/results', 'Results'],
  ['/leaderboards', 'Leaders'],
  ['/friends', 'Friends'],
  ['/shop', 'Shop'],
  ['/profile', 'Profile'],
];

export function PlayerNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white p-2">
      <ul className="mx-auto grid max-w-3xl grid-cols-7 gap-1 text-center text-xs">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="block rounded px-1 py-2 hover:bg-slate-100">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
