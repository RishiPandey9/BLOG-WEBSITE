'use client';

import Link from 'next/link';
import { BookOpen, Twitter, Github, Mail, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import Script from 'next/script';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <>
        {/* Load Elfsight Script */}
      <Script
        src="https://elfsightcdn.com/platform.js"
        strategy="lazyOnload"
      />
    
      {/* Google Reviews Section */}
      <div className="py-16 bg-gray-100 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">

          <h2 className="text-2xl font-bold text-center mb-8">
            What People Say About Us
          </h2>

          <div
            className="elfsight-app-1df82850-e783-4582-ac5a-ee5af53f58fd"
            data-elfsight-app-lazy
          ></div>

        </div>
      </div>

  {/* Instagram Feed Section */}
  <div className="py-16 bg-gray-100 dark:bg-gray-950">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <h2 className="text-2xl font-bold text-center mb-8">
        Follow us on Instagram
      </h2>

      <Script
        src="https://elfsightcdn.com/platform.js"
        strategy="lazyOnload"
      />

      <div
        className="elfsight-app-d0d3792d-2521-4648-bba0-744cb27aedc3"
        data-elfsight-app-lazy
      ></div>

    </div>
  </div>
    <footer className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          {/* Brand */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2"
          >
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">DevBlog</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-600 max-w-sm leading-relaxed">
              A modern platform for developers to share knowledge, explore the latest in technology, and grow together as a community.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" aria-label="Follow DevBlog on Twitter" className="p-2 text-gray-600 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all">
                <Twitter className="w-4 h-4" aria-hidden="true" />
              </a>
              <a href="#" aria-label="View DevBlog on GitHub" className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
                <Github className="w-4 h-4" aria-hidden="true" />
              </a>
              <a href="/contact" aria-label="Contact DevBlog by email" className="p-2 text-gray-600 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all">
                <Mail className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </motion.div>

          {/* Links */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5 }}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Explore</h4>
            <ul className="space-y-2">
              {[
                { label: 'All Posts', href: '/blog' },
                { label: 'Technology', href: '/blog?category=technology' },
                { label: 'Tutorials', href: '/blog?category=tutorial' },
                { label: 'AI & ML', href: '/blog?category=ai-ml' },
                { label: 'Design', href: '/blog?category=design' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 dark:text-gray-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5 }}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Platform</h4>
            <ul className="space-y-2">
              {[
                { label: 'Write a Post', href: '/create' },
                { label: 'My Profile', href: '/profile' },
                { label: 'Sign In', href: '/auth/signin' },
                { label: 'Contact', href: '/contact' },
                { label: 'About', href: '/about' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 dark:text-gray-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-800"
        >
          <p className="text-sm text-gray-600 dark:text-gray-600">
            © {currentYear} DevBlog. All rights reserved.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-600 flex items-center gap-1 mt-2 sm:mt-0">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" aria-hidden="true" /> by Rishi Pandey
          </p>
        </motion.div>
      </div>
    </footer>
  </>
  );
}
