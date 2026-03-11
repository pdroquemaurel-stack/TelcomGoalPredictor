import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdSlotView } from '@/components/ad-slot';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  if (process.env.NEXT_PUBLIC_SKIP_HOME !== 'false') {
    redirect('/predictions');
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-8 pt-6">
      <section className="rounded-3xl bg-brand p-5 text-black">
        <h1 className="text-3xl font-black">Prono Arena</h1>
        <p className="mt-2 text-sm font-semibold">Le jeu de pronostics foot mobile-first.</p>
        <Link href="/predictions" className="mt-4 inline-block rounded-2xl bg-black px-4 py-3 text-sm font-black text-white">Entrer dans le jeu</Link>
      </section>
      <AdSlotView code="HOME_TOP_BANNER" />
    </main>
  );
}
