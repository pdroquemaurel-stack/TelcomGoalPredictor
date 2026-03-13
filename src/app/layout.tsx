import './globals.css';
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { CountryRequiredOverlay } from '@/components/country-required-overlay';
import { authOptions } from '@/lib/auth';
import { AFRICAN_COUNTRIES } from '@/lib/countries';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Pan-African Football Predictor MVP',
  description: 'White-label football prediction platform MVP',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const profile = userId ? await prisma.profile.findUnique({ where: { userId }, select: { countryId: true } }) : null;

  return (
    <html lang="en">
      <body>
        {children}
        {userId && !profile?.countryId ? <CountryRequiredOverlay countries={AFRICAN_COUNTRIES} /> : null}
      </body>
    </html>
  );
}
