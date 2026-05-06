import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import StoreProvider from './components/StoreProvider';
import ThemeSync from './components/ThemeSync';
import AnalyticsInit from './components/AnalyticsInit';
import Header from './components/Header';
import Footer from './components/Footer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Who Clinches',
  description:
    'Simulate game outcomes to see who clinches playoff spots and conference championships',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const env = (process.env.VERCEL_ENV ?? 'local') as 'local' | 'preview' | 'production';

  return (
    <html lang="en" data-theme="sec" data-mode="light" data-env={env} className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex h-full min-h-screen flex-col antialiased`}
      >
        <StoreProvider>
          <AnalyticsInit />
          <ThemeSync />
          <Header env={env} />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
