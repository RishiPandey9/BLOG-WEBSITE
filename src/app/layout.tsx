import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',       // WCAG / CLS: prevents invisible text during font load
  preload: true,
  variable: '--font-inter',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://devblog.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'DevBlog — Modern Tech Blog',
    template: '%s | DevBlog',
  },
  description: 'A modern blog for developers. Explore articles about web development, AI, design, and tech.',
  keywords: ['blog', 'technology', 'web development', 'programming', 'AI', 'design'],
  authors: [{ name: 'Rishi Pandey' }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    title: 'DevBlog — Modern Tech Blog',
    description: 'A modern blog for developers. Explore articles about web development, AI, design, and tech.',
    siteName: 'DevBlog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevBlog — Modern Tech Blog',
    description: 'A modern blog for developers. Explore articles about web development, AI, design, and tech.',
    creator: '@devblog',
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-white dark:bg-gray-950 antialiased`}>
        <Providers>
          {/* Skip-to-content — WCAG 2.4.1 / AAA 2.4.7 */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:text-sm focus:font-semibold focus:rounded-lg focus:ring-2 focus:ring-white focus:outline-none"
          >
            Skip to main content
          </a>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
