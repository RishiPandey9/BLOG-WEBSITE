'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // bfcache fix: pause Lenis on pagehide so browser can cache the page
    const handlePageHide = () => lenis.destroy();
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pagehide', handlePageHide);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
