'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { SmoothScroll } from '@/components/SmoothScroll';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SmoothScroll>
          {children}
        </SmoothScroll>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
            duration: 4000,
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
