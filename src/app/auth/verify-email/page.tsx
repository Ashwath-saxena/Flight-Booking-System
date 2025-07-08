// frontend/src/app/auth/verify-email/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function VerifyEmail() {
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
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-2"
          >
            <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2 text-center">
            Activate your account
          </h2>
          <p className="text-blue-700 text-md text-center">
            We&apos;ve sent an activation link to your email.<br/>
            Please check your email inbox and click the link to activate your account.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 mt-6">
          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Sign in
          </Link>
          <span className="text-xs text-blue-400 mt-1 text-center">
            Didn&apos;t receive the email? Check your spam folder.
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}