import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'DevBlog — Modern Tech Blog',
    template: '%s | DevBlog',
  },
  description: 'A modern blog for developers. Explore articles about web development, AI, design, and tech.',
  keywords: ['blog', 'technology', 'web development', 'programming', 'AI', 'design'],
  authors: [{ name: 'DevBlog Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://devblog.example.com',
    title: 'DevBlog — Modern Tech Blog',
    description: 'A modern blog for developers',
    siteName: 'DevBlog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevBlog — Modern Tech Blog',
    description: 'A modern blog for developers',
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
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
