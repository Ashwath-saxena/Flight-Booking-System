// frontend/src/app/auth/register/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarning(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        // Supabase error code for duplicate email is 23505, but check message too
        if (
          error.message?.toLowerCase().includes('already registered') ||
          error.message?.toLowerCase().includes('already exists') ||
          error.message?.toLowerCase().includes('duplicate') ||
          error.message?.toLowerCase().includes('user') ||
          error.message?.toLowerCase().includes('email')
        ) {
          setWarning("An account with this email already exists. Please login instead.");
        } else {
          setError(error.message);
        }
        return;
      }
      router.push('/auth/verify-email');
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
          Create your account
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
            {warning && (
              <motion.div
                className="rounded-xl bg-yellow-50 p-4 shadow flex flex-col gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="text-sm text-yellow-800 font-semibold">{warning}</div>
                <Link
                  href="/auth/login"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Go to Login
                </Link>
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
              disabled={!!warning}
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
              disabled={!!warning}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-blue-900 font-medium mb-1 mt-2">
              Confirm Password
            </label>
            <motion.input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              className="appearance-none block w-full px-4 py-3 border-2 border-blue-200 placeholder-blue-400 text-blue-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 sm:text-sm transition"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
              disabled={!!warning}
            />
          </div>
          <div className="flex items-center justify-between mt-4">
            <Link href="/auth/login" className="font-bold text-blue-600 hover:text-blue-500 transition text-sm">
              Already have an account? Sign in
            </Link>
          </div>
          <motion.button
            type="submit"
            disabled={loading || !!warning}
            className="w-full py-3 mt-2 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 font-bold shadow-xl transition-all disabled:opacity-60"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}