'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Users, BookOpen } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { StaggerWrapper, StaggerItem, scaleUp } from './motion';

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Parallax transforms
  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const orbY3 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  return (
    <section ref={containerRef} className="relative overflow-hidden pt-24 md:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-[80vh] md:min-h-[90vh] flex items-center">
      {/* Parallax Background Orbs - Responsive sizes */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />
      <motion.div
        style={{ y: orbY1 }}
        className="absolute top-12 md:top-20 left-4 md:left-10 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-sky-400/10 rounded-full blur-3xl"
      />
      <motion.div
        style={{ y: orbY2 }}
        className="absolute bottom-12 md:bottom-20 right-4 md:right-10 w-40 h-40 sm:w-56 sm:h-56 md:w-96 md:h-96 bg-indigo-500/10 rounded-full blur-3xl"
      />
      <motion.div
        style={{ y: orbY3 }}
        className="absolute top-24 md:top-40 right-8 md:right-20 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 bg-pink-400/10 rounded-full blur-3xl"
      />

      {/* Animated floating particles - Hidden on very small screens */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-2 h-2 bg-sky-400 rounded-full hidden sm:block"
      />
      <motion.div
        animate={{
          y: [0, 15, 0],
          x: [0, -12, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/3 right-1/3 w-3 h-3 bg-indigo-400 rounded-full hidden sm:block"
      />
      <motion.div
        animate={{
          y: [0, -10, 0],
          x: [0, 8, 0],
          opacity: [0.25, 0.55, 0.25],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full hidden sm:block"
      />

      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-sky-200 dark:border-sky-800 pulse-glow">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Welcome to the developer community</span>
              <span className="sm:hidden">Developer Community</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6"
          >
            <span className="text-gray-900 dark:text-white">Stories that</span>
            <br className="hidden md:block" />
            <span className="gradient-text">inspire developers</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4"
          >
            Discover tutorials, insights, and stories from developers around the world.
            Learn, share, and grow with our community.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
              <Link href="/blog" className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto justify-center">
                Start Reading
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
              <Link href="/create" className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto justify-center">
                Write a Post
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats with stagger - Responsive grid */}
          <StaggerWrapper className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-xs sm:max-w-md mx-auto px-2">
            {[
              { icon: BookOpen, value: '100+', label: 'Articles', color: 'text-sky-500' },
              { icon: Users, value: '5K+', label: 'Readers', color: 'text-sky-500' },
              { icon: TrendingUp, value: '50K+', label: 'Views', color: 'text-sky-500' },
            ].map((stat) => (
              <StaggerItem key={stat.label} variant={scaleUp}>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                    <stat.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${stat.color}`} aria-hidden="true" />
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerWrapper>
        </div>
      </motion.div>

      {/* Scroll indicator - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
