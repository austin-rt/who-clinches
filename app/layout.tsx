import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import StoreProvider from './components/StoreProvider';
import ThemeInitializer from './components/ThemeInitializer';
import ThemeSync from './components/ThemeSync';
import Header from './components/Header';
import Navigation from './components/Navigation';
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
  title: 'SEC Tiebreaker',
  description: 'SEC Football Tiebreaker Simulator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="sec" data-mode="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <StoreProvider>
          <ThemeInitializer />
          <ThemeSync />
          <Header />
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
