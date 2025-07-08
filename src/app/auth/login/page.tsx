// frontend/src/app/auth/login/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/supabaseBrowserClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        return;
      }

      // Wait for session cookie to be available before redirect
      let session = null, tries = 0;
      while (tries < 10) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
        if (session) break;
        await new Promise(res => setTimeout(res, 100));
        tries++;
      }
      if (session) {
        window.location.href = '/';
      } else {
        setError('Login succeeded, but session not available yet. Please refresh manually.');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
        <motion.h2
          className="mt-2 text-center text-3xl font-extrabold text-blue-900"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Sign in to your account
        </motion.h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <AnimatePresence>
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
          <div>
            <label htmlFor="email" className="block text-blue-900 font-medium mb-1">
              Email address
            </label>
            <motion.input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none block w-full px-4 py-3 border-2 border-blue-200 placeholder-blue-400 text-blue-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 sm:text-sm transition"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-blue-900 font-medium mb-1 mt-2">
              Password
            </label>
            <motion.input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none block w-full px-4 py-3 border-2 border-blue-200 placeholder-blue-400 text-blue-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 sm:text-sm transition"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1 mt-4">
            <Link href="/auth/register" className="font-bold text-blue-600 hover:text-blue-500 transition text-sm">
              Don&apos;t have an account? Sign up
            </Link>
            <Link href="/auth/forgot-password" className="font-bold text-blue-600 hover:text-blue-500 transition text-sm">
              Forgot your password?
            </Link>
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 font-bold shadow-xl transition-all disabled:opacity-60"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}