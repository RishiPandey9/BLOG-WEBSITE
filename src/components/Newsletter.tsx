'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    toast.success('Successfully subscribed to newsletter!');
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden bg-gradient-to-br from-sky-500 to-indigo-600 rounded-3xl p-8 md:p-12 text-white gradient-shift"
    >
      {/* Animated Background Orbs */}
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
      />
      <motion.div
        animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
      />

      <div className="relative max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm"
        >
          <Mail className="w-7 h-7" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-2xl md:text-3xl font-bold mb-3"
        >
          Stay in the Loop
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sky-100 text-sm md:text-base mb-6"
        >
          Get the latest articles, tutorials, and developer insights delivered straight to your inbox.
          No spam, ever.
        </motion.p>
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-sky-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            required
          />
          <button
            type="submit"
            disabled={subscribed}
            className="px-6 py-3 bg-white text-sky-600 font-semibold rounded-xl hover:bg-sky-50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
          >
            {subscribed ? (
              <>
                <Check className="w-4 h-4" /> Subscribed!
              </>
            ) : (
              <>
                Subscribe <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.form>
      </div>
    </motion.section>
  );
}
