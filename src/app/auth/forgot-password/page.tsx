// frontend/src/app/auth/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/supabaseBrowserClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('A password reset link has been sent to your email if it exists in our system.');
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-blue-100 py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="max-w-md w-full space-y-8 bg-white/90 rounded-2xl shadow-2xl px-8 py-10"
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <motion.h2
            className="mt-2 text-center text-3xl font-extrabold text-blue-900"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            Forgot your password?
          </motion.h2>
          <p className="mt-2 text-center text-sm text-blue-700">
            Enter your email address and we&apos;ll send you a reset link.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <AnimatePresence>
            {message && (
              <motion.div
                className="rounded-xl bg-green-50 p-4 flex flex-col items-center gap-4 shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="text-sm text-green-700">{message}</div>
                <Link
                  href="/auth/login"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Back to Sign In
                </Link>
              </motion.div>
            )}
            {error && (
              <motion.div
                className="rounded-xl bg-red-50 p-4 shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="text-sm text-red-700">{error}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {!message && (
            <>
              <div>
                <label htmlFor="email" className="block text-blue-900 font-medium mb-1">
                  Email address
                </label>
                <motion.input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="appearance-none block w-full px-4 py-3 border-2 border-blue-200 placeholder-blue-400 text-blue-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 sm:text-sm transition"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 font-bold shadow-xl transition-all disabled:opacity-60"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
              <div className="text-center mt-2">
                <Link href="/auth/login" className="text-blue-600 hover:underline text-sm font-bold transition">
                  Remembered your password? Sign in
                </Link>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
}