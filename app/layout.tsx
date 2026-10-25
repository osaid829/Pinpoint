import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pinpoint — Read the planet',
  description: 'A daily precision game for people who know the shape of the world.',
  applicationName: 'Pinpoint',
  openGraph: {
    title: 'Pinpoint — Read the planet',
    description: 'Drop a pin. Read the world. See how close you can get.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0d0d',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
