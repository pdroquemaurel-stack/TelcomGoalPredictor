import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Pan-African Football Predictor MVP',
  description: 'White-label football prediction platform MVP',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
