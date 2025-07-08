// frontend/src/app/dashboard/page.tsx
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

const COLORS = ['#1a73e8', '#fbbc05', '#34a853', '#ea4335', '#9c27b0', '#00bcd4'];

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

export default function DashboardPage() {
  // Dashboard stats
  const [summary, setSummary] = useState<any>(null);
  const [bookingsPerDay, setBookingsPerDay] = useState<any[]>([]);
  const [revenueByClass, setRevenueByClass] = useState<any[]>([]);
  const [topRoutes, setTopRoutes] = useState<any[]>([]);
  const [flightStatus, setFlightStatus] = useState<any>({});
  const [statsLoading, setStatsLoading] = useState(true);

  // Flight search section
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outboundFlights, setOutboundFlights] = useState<Flight[]>([]);
  const [returnFlights, setReturnFlights] = useState<Flight[]>([]);
  const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load dashboard stats
  useEffect(() => {
    async function fetchDashboard() {
      setStatsLoading(true);
      const [summaryRes, bookingsDayRes, revenueClassRes, topRoutesRes, statusRes] = await Promise.all([
        fetch('/api/dashboard/summary').then(r => r.json()),
        fetch('/api/dashboard/bookings-per-day').then(r => r.json()),
        fetch('/api/dashboard/revenue-per-class').then(r => r.json()),
        fetch('/api/dashboard/top-routes').then(r => r.json()),
        fetch('/api/dashboard/flight-status-counts').then(r => r.json()),
      ]);
      setSummary(summaryRes);
      setBookingsPerDay(bookingsDayRes.bookingsPerDay || []);
      setRevenueByClass(
        Object.entries(revenueClassRes.revenueByClass || {}).map(([k, v]) => ({ name: k, value: v }))
      );
      setTopRoutes(topRoutesRes.topRoutes || []);
      setFlightStatus(statusRes.statusCounts || {});
      setStatsLoading(false);
    }
    fetchDashboard();
  }, []);

  // Flight search handler
  const handleSearch = async (params: FlightSearchParams) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSearchParams(params);
    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to search for flights');
      setOutboundFlights(data.outboundFlights || []);
      setReturnFlights(data.returnFlights || []);
      if (data.outboundFlights.length === 0) {
        toast.error('No outbound flights found for your search criteria');
      }
      if (params.tripType === 'round-trip' && data.returnFlights.length === 0) {
        toast.error('No return flights found for your search criteria');
      }
    } catch (err) {
      const typedError = err as { message?: string };
      setError(typedError.message || 'Failed to search for flights');
      toast.error(typedError.message || 'Failed to search for flights');
    } finally {
      setLoading(false);
    }
  };

  if (statsLoading) {
    return (
      <motion.div
        className="w-full h-[70vh] flex items-center justify-center text-2xl font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.span
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="mr-3 text-blue-600"
        >✈️</motion.span>
        Loading dashboard...
      </motion.div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Toaster position="top-center" />

      {/* Dashboard heading */}
      <motion.h1
        className="text-4xl font-extrabold mb-12 text-center bg-gradient-to-r from-blue-600 to-green-400 bg-clip-text text-transparent tracking-tight"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        Airline Admin Dashboard
      </motion.h1>

      {/* Flight search area */}
      <ScrollFadeIn delay={0.05}>
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto mb-8 border border-blue-200">
          <SectionHeading>
            <span className="mr-2">🔍</span>Find and Book Flights
          </SectionHeading>
          <FlightSearchForm onSearch={handleSearch} />
        </div>
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
                    loading={loading}
                    error={error}
                    tripType="round-trip"
                    departureDate={searchParams?.departureDate}
                    returnDate={searchParams?.returnDate}
                  />
                  {outboundFlights.length > 0 && (
                    <>
                      <h2 className="text-2xl font-bold mt-10 mb-4 text-green-700">Return Flights</h2>
                      <FlightSearchResult
                        outboundFlights={returnFlights}
                        loading={loading}
                        error={returnFlights.length === 0 ? 'No return flights found' : null}
                        tripType="round-trip"
                        departureDate={searchParams?.departureDate}
                        returnDate={searchParams?.returnDate}
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4 mt-8 text-blue-700">Available Flights</h2>
                  <FlightSearchResult
                    outboundFlights={outboundFlights}
                    loading={loading}
                    error={error}
                    tripType="one-way"
                    departureDate={searchParams?.departureDate}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollFadeIn>

      {/* Dashboard Stats */}
      {!hasSearched && (
        <>
          <ScrollFadeIn delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
              <StatCard label="Total Bookings" value={summary.totalBookings} icon="🗓️" delay={0} />
              <StatCard label="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} icon="💸" delay={0.1} />
              <StatCard label="Active Flights" value={summary.activeFlights} icon="✈️" delay={0.2} />
              <StatCard label="Total Users" value={summary.totalUsers} icon="👤" delay={0.3} />
              <StatCard label="Total Flights" value={summary.totalFlights} icon="🛫" delay={0.4} />
            </div>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <ScrollFadeIn delay={0.15}>
              {/* Bookings per day chart */}
              <motion.section className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-8">
                <SectionHeading>📈 Bookings Per Day (Last 30 Days)</SectionHeading>
                <ResponsiveContainer width="100%" height={250}>
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
              {/* Revenue by cabin class chart */}
              <motion.section className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl shadow-xl p-8">
                <SectionHeading>💼 Revenue by Cabin Class</SectionHeading>
                <ResponsiveContainer width="100%" height={250}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <ScrollFadeIn delay={0.21}>
              {/* Top routes */}
              <motion.section className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-xl p-8">
                <SectionHeading>🏆 Top 5 Routes</SectionHeading>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={topRoutes}
                    layout="vertical"
                    margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="route" width={150} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#fbbc05" animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.section>
            </ScrollFadeIn>
            <ScrollFadeIn delay={0.24}>
              {/* Flight status counts */}
              <motion.section className="bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-xl p-8">
                <SectionHeading>🛬 Live Flight Status</SectionHeading>
                <ResponsiveContainer width="100%" height={250}>
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
        </>
      )}
    </main>
  );
}