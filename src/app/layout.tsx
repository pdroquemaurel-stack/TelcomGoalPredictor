import './globals.css';
import { CSSProperties, ReactNode } from 'react';
import { getAppConfig } from '@/lib/app-config';
import { buildThemeVariables } from '@/lib/admin-config-helpers';

export const metadata = {
  title: 'Pan-African Football Predictor MVP',
  description: 'White-label football prediction platform MVP',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const config = await getAppConfig();

  const themeVariables = buildThemeVariables(config);

  return (
    <html lang="en">
      <body style={themeVariables as CSSProperties}>
        {children}
      </body>
    </html>
  );
}
