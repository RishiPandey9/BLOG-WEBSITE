'use client';

import { ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

// ─── Parallax Hero Image wrapper ──────────────────────────

export function ParallaxHero({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <motion.div ref={ref} style={{ y, opacity }} className="relative h-[50vh] md:h-[60vh] overflow-hidden">
      {children}
    </motion.div>
  );
}

// ─── Fade-in section wrapper ──────────────────────────────

export function FadeInSection({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated Action Bar ──────────────────────────────────

export function AnimatedActionBar({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated Tags with stagger ───────────────────────────

export function AnimatedTags({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
      }}
      className="flex flex-wrap gap-2 mt-10 mb-10"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedTag({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
      }}
      whileHover={{ scale: 1.1, y: -2 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// ─── Author card slide-in ─────────────────────────────────

export function AnimatedAuthorCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
