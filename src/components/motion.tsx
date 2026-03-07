'use client';

import { ReactNode } from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';

// ─── Reusable Animation Variants ──────────────────────────

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

// ─── Scroll-triggered Wrapper ─────────────────────────────

interface ScrollRevealProps {
  children: ReactNode;
  variant?: Variants;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  variant = fadeInUp,
  className = '',
  delay = 0,
  duration = 0.6,
  once = true,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.15 }}
      variants={variant}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger Container ────────────────────────────────────

interface StaggerWrapperProps {
  children: ReactNode;
  className?: string;
  fast?: boolean;
}

export function StaggerWrapper({
  children,
  className = '',
  fast = false,
}: StaggerWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={fast ? staggerContainerFast : staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger Item ─────────────────────────────────────────

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  variant?: Variants;
}

export function StaggerItem({
  children,
  className = '',
  variant = fadeInUp,
}: StaggerItemProps) {
  return (
    <motion.div
      variants={variant}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Parallax wrapper ─────────────────────────────────────

interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.5, className = '' }: ParallaxProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ y: 0 }}
      whileInView={{ y: -30 * speed }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Magnetic Hover Effect ────────────────────────────────

interface MagneticHoverProps {
  children: ReactNode;
  className?: string;
}

export function MagneticHover({ children, className = '' }: MagneticHoverProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Text Reveal Animation ────────────────────────────────

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TextReveal({ text, className = '', delay = 0 }: TextRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(' ');

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.04,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// ─── Counter Animation ────────────────────────────────────

interface CountUpProps {
  end: number | string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function CountUp({ end, suffix = '', className = '', duration = 2 }: CountUpProps) {
  const numericEnd = typeof end === 'string' ? parseFloat(end.replace(/[^0-9.]/g, '')) : end;

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {isNaN(numericEnd) ? end : numericEnd.toLocaleString()}
        {suffix}
      </motion.span>
    </motion.span>
  );
}
