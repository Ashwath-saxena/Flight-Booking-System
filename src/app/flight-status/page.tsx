// frontend/src/app/flight-status/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FlightStatus from '@/components/FlightStatus';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function FlightStatusContent() {
  const [flightId, setFlightId] = useState('');
  const [searchedFlightId, setSearchedFlightId] = useState('');
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Auto-fill flight ID from URL parameter
  useEffect(() => {
    const urlFlightId = searchParams.get('flightId');
    if (urlFlightId) {
      setFlightId(urlFlightId);
      setSearchedFlightId(urlFlightId);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedFlightId(flightId);
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto px-2 sm:px-6 py-10"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <motion.h1
        className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-800 mb-8 text-center"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Real-time Flight Status
      </motion.h1>

      <motion.div
        className="bg-white/90 shadow-xl rounded-2xl p-8 mb-10 border border-blue-100"
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-base font-semibold text-blue-900 mb-2">
              Enter Flight Tracking ID
            </label>
            <motion.input
              type="text"
              value={flightId}
              onChange={(e) => setFlightId(e.target.value)}
              className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 font-mono text-base focus:ring-2 focus:ring-blue-400 transition"
              placeholder="Paste your Flight Tracking ID from booking email"
              required
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
            />
            <p className="text-xs text-blue-500 mt-2">
              💡 Find your Flight Tracking ID in your booking confirmation email or My Bookings page.
            </p>
          </div>
          <div className="flex items-end">
            <motion.button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all mb-7"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Track Flight
            </motion.button>
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
        {searchedFlightId && (
          <motion.div
            key={searchedFlightId}
            initial={{ opacity: 0, y: 20, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <FlightStatus 
              flightId={searchedFlightId}
              showAdminControls={user?.email?.includes('ashwath')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-6 shadow"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <h3 className="font-semibold text-blue-900 mb-2 text-lg">Real-time Updates</h3>
        <p className="text-blue-700 text-sm">
          This page uses <span className="font-semibold">Server-Sent Events (SSE)</span> to provide real-time flight status updates. 
          Status changes are automatically pushed to your browser without needing to refresh the page.
        </p>
        <p className="text-blue-700 text-sm mt-2">
          <strong>Current User:</strong> Ashwath-saxena | <strong>Connected:</strong> 2025-07-07 08:43:23 UTC
        </p>
      </motion.div>
    </motion.div>
  );
}

// Loading component for Suspense fallback
function FlightStatusLoading() {
  return (
    <motion.div
      className="max-w-4xl mx-auto px-2 sm:px-6 py-10 flex justify-center items-center min-h-[50vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-xl text-blue-700 flex items-center gap-3"
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500"></div>
        Loading flight status...
      </motion.div>
    </motion.div>
  );
}

// Main export wrapped with Suspense
export default function FlightStatusPage() {
  return (
    <Suspense fallback={<FlightStatusLoading />}>
      <FlightStatusContent />
    </Suspense>
  );
}