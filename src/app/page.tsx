// frontend/src/app/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip as RechartTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import FlightSearchForm, { FlightSearchParams } from '@/components/flights/FlightSearchForm';
import FlightSearchResult, { Flight } from '@/components/flights/FlightResults';
import toast, { Toaster } from 'react-hot-toast';
import ScrollFadeIn from '@/components/dashboard/ScrollFadeIn';
import { getCachedFlightResults, setCachedFlightResults } from '@/utils/flightCache';

const COLORS = ['#1a73e8', '#fbbc05', '#34a853', '#ea4335', '#9c27b0', '#00bcd4'];

// --- Types for Dashboard ---
interface SummaryStats {
  totalBookings: number;
  totalRevenue: number;
  activeFlights: number;
  totalUsers: number;
  totalFlights: number;
}
interface BookingPerDay { date: string; count: number }
interface RevenueByClass { name: string; value: number }
interface TopRoute { route: string; count: number }
interface FlightStatusCount { [status: string]: number }

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      className="text-2xl font-bold mb-6 text-blue-800 tracking-tight flex items-center"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      {children}
      <motion.div
        className="ml-2 h-1 w-10 bg-gradient-to-r from-blue-400 to-green-400 rounded"
        initial={{ width: 0 }}
        animate={{ width: 40 }}
        transition={{ duration: 0.7, type: "spring" }}
      />
    </motion.h2>
  );
}

function Tooltip(props: any) {
  return <RechartTooltip {...props} />;
}

type ErrorResponse = {
  message: string;
};

export default function Home() {
  // Dashboard stats
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [bookingsPerDay, setBookingsPerDay] = useState<BookingPerDay[]>([]);
  const [revenueByClass, setRevenueByClass] = useState<RevenueByClass[]>([]);
  const [topRoutes, setTopRoutes] = useState<TopRoute[]>([]);
  const [flightStatus, setFlightStatus] = useState<FlightStatusCount>({});
  const [statsLoading, setStatsLoading] = useState(true);

  // Flight search section
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outboundFlights, setOutboundFlights] = useState<Flight[]>([]);
  const [returnFlights, setReturnFlights] = useState<Flight[]>([]);
  const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [offline, setOffline] = useState(false);

  // Listen for offline/online status
  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Load dashboard stats
  useEffect(() => {
    async function fetchDashboard() {
      setStatsLoading(true);
      try {
        const [summaryRes, bookingsDayRes, revenueClassRes, topRoutesRes, statusRes] = await Promise.all([
          fetch('/api/dashboard/summary').then(r => r.json()),
          fetch('/api/dashboard/bookings-per-day').then(r => r.json()),
          fetch('/api/dashboard/revenue-per-class').then(r => r.json()),
          fetch('/api/dashboard/top-routes').then(r => r.json()),
          fetch('/api/dashboard/flight-status-counts').then(r => r.json()),
        ]);
        setSummary(summaryRes as SummaryStats);
        setBookingsPerDay(bookingsDayRes.bookingsPerDay as BookingPerDay[] || []);
        setRevenueByClass(
          Object.entries(revenueClassRes.revenueByClass || {}).map(([k, v]) => ({ name: k, value: v as number }))
        );
        setTopRoutes(topRoutesRes.topRoutes as TopRoute[] || []);
        setFlightStatus(statusRes.statusCounts as FlightStatusCount || {});
      } finally {
        setStatsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Flight search handler with animations & cache
  const handleSearch = async (params: FlightSearchParams) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSearchParams(params);

    // Try cache first
    const cached = await getCachedFlightResults(params);
    if (cached) {
      setOutboundFlights(cached.outboundFlights || []);
      setReturnFlights(cached.returnFlights || []);
      setFromCache(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        if (!navigator.onLine) {
          setOffline(true);
          if (cached) {
            setOutboundFlights(cached.outboundFlights || []);
            setReturnFlights(cached.returnFlights || []);
            setFromCache(true);
            toast.error('Offline: Showing cached results if available.');
          } else {
            toast.error('Offline and no cached results available.');
          }
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to search for flights');
      }

      const data = await response.json();
      setOutboundFlights(data.outboundFlights || []);
      setReturnFlights(data.returnFlights || []);
      setFromCache(false);
      await setCachedFlightResults(params, data);

      if (data.outboundFlights.length === 0) {
        toast.error('No outbound flights found for your search criteria');
      }
      if (params.tripType === 'round-trip' && data.returnFlights.length === 0) {
        toast.error('No return flights found for your search criteria');
      }
    } catch (err) {
      const typedError = err as ErrorResponse;
      setError(typedError.message || 'Failed to search for flights');
      toast.error(typedError.message || 'Failed to search for flights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-2 sm:px-4 py-8 max-w-[1550px]">
      <Toaster position="top-center" />

      <motion.h1
        className="text-3xl md:text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-600 to-green-400 bg-clip-text text-transparent tracking-tight"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        Flight Booker Search
      </motion.h1>

      {/* FLIGHT SEARCH SECTION */}
      <motion.section
        className="w-full max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring" }}
      >
        <ScrollFadeIn delay={0.05}>
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-blue-200">
            <SectionHeading>
              <span className="mr-2">🔍</span>Search for your flight
            </SectionHeading>
            <FlightSearchForm onSearch={handleSearch} />
          </div>
          <AnimatePresence>
            {offline && (
              <motion.div
                key="offline"
                className="mb-4 text-sm text-red-700 bg-red-100 rounded px-3 py-2 inline-block"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                You are offline. Showing cached results if available.
              </motion.div>
            )}
            {fromCache && (
              <motion.div
                key="fromcache"
                className="mb-4 text-sm text-yellow-700 bg-yellow-100 rounded px-3 py-2 inline-block"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                Showing cached results (offline or repeated search)
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {hasSearched && (
              <motion.div
                key="search-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                {searchParams?.tripType === 'round-trip' ? (
                  <>
                    <h2 className="text-2xl font-bold mb-4 mt-8 text-blue-700">Outbound Flights</h2>
                    <FlightSearchResult
                      outboundFlights={outboundFlights}
                      returnFlights={returnFlights}
                      loading={loading}
                      error={error}
                      tripType={searchParams.tripType}
                      departureDate={searchParams.departureDate}
                      returnDate={searchParams.returnDate}
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-4 mt-8 text-blue-700">Available Flights</h2>
                    <FlightSearchResult
                      outboundFlights={outboundFlights}
                      loading={loading}
                      error={error}
                      tripType={searchParams?.tripType || 'one-way'}
                      departureDate={searchParams?.departureDate}
                    />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollFadeIn>
      </motion.section>

      {/* DASHBOARD SECTION */}
        <motion.h1
        className="text-3xl md:text-4xl font-extrabold mb-8 mt-40 text-center bg-gradient-to-r from-blue-600 to-green-400 bg-clip-text text-transparent tracking-tight"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        Flight Booker Dashboard
      </motion.h1>
      <motion.section
        className="w-full mt-12"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8, type: "spring" }}
      >
        <AnimatePresence>
          {statsLoading ? (
            <motion.div
              key="dashboard-loading"
              className="w-full flex items-center justify-center text-xl font-bold min-h-[250px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="mr-3 text-blue-600"
              >✈️</motion.span>
              Loading dashboard...
            </motion.div>
          ) : (
            <motion.div
              key="dashboard-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
            >
              <ScrollFadeIn delay={0.1}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
                  <StatCard label="Total Bookings" value={summary?.totalBookings || 0} icon="🗓️" delay={0} />
                  <StatCard label="Total Revenue" value={`₹${summary?.totalRevenue?.toLocaleString?.() ?? (summary?.totalRevenue || 0)}`} icon="💸" delay={0.1} />
                  <StatCard label="Active Flights" value={summary?.activeFlights || 0} icon="✈️" delay={0.2} />
                  <StatCard label="Total Users" value={summary?.totalUsers || 0} icon="👤" delay={0.3} />
                  <StatCard label="Total Flights" value={summary?.totalFlights || 0} icon="🛫" delay={0.4} />
                </div>
              </ScrollFadeIn>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <ScrollFadeIn delay={0.15}>
                  <motion.section className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-6 md:p-8 h-full">
                    <SectionHeading>📈 Bookings Per Day (Last 30 Days)</SectionHeading>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={bookingsPerDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1a73e8" animationDuration={900} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.section>
                </ScrollFadeIn>
                <ScrollFadeIn delay={0.18}>
                  <motion.section className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl shadow-xl p-6 md:p-8 h-full">
                    <SectionHeading>💼 Revenue by Cabin Class</SectionHeading>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={revenueByClass}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name }) => name}
                          isAnimationActive={true}
                          animationDuration={1200}
                        >
                          {revenueByClass.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.section>
                </ScrollFadeIn>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ScrollFadeIn delay={0.21}>
                  <motion.section className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-xl p-6 md:p-8 h-full">
                    <SectionHeading>🏆 Top 5 Routes</SectionHeading>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={topRoutes}
                        layout="vertical"
                        margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="route" width={120} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#fbbc05" animationDuration={1000} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.section>
                </ScrollFadeIn>
                <ScrollFadeIn delay={0.24}>
                  <motion.section className="bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-xl p-6 md:p-8 h-full">
                    <SectionHeading>🛬 Live Flight Status</SectionHeading>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={Object.entries(flightStatus).map(([k, v]) => ({ name: k, value: v }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name}: ${value}`}
                          isAnimationActive={true}
                          animationDuration={1200}
                        >
                          {Object.entries(flightStatus).map((_, idx) => (
                            <Cell key={`cell-status-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.section>
                </ScrollFadeIn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </main>
  );
}