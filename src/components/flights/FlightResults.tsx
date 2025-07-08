// frontend/src/components/flights/FlightResults.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Flight = {
  id: string;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  price?: number;
  cabin_class?: string;
  available_seats?: number;
};

type Props = {
  outboundFlights: Flight[];
  returnFlights?: Flight[];
  loading: boolean;
  error?: string | null;
  tripType?: 'one-way' | 'round-trip';
  departureDate?: string;
  returnDate?: string;
};

export default function FlightSearchResult({
  outboundFlights,
  returnFlights = [],
  loading,
  error,
  tripType = 'one-way',
}: Props) {
  const router = useRouter();
  const [selectedOutboundId, setSelectedOutboundId] = useState<string | null>(null);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  // Toggle logic for outbound
  const handleOutboundClick = (flightId: string) => {
    setSelectedOutboundId(prev => (prev === flightId ? null : flightId));
  };

  // Toggle logic for return
  const handleReturnClick = (flightId: string) => {
    setSelectedReturnId(prev => (prev === flightId ? null : flightId));
  };

  const handleBookFlight = (flightId: string) => {
    router.push(`/booking/${flightId}`);
  };

  const handleBookBoth = () => {
    if (selectedOutboundId && selectedReturnId) {
      router.push(`/booking/round-trip?outbound=${selectedOutboundId}&return=${selectedReturnId}`);
    }
  };

  if (loading)
    return (
      <motion.div className="p-6 flex items-center gap-2 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.1 }}
          className="text-blue-600"
        >✈️</motion.span>
        Searching for flights...
      </motion.div>
    );
  if (error) return <motion.div className="p-6 text-red-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>;
  if (tripType === 'round-trip' && outboundFlights.length === 0 && returnFlights.length === 0)
    return <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No flights found for your search.</motion.div>;
  if (tripType === 'one-way' && outboundFlights.length === 0)
    return <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No flights found for your search.</motion.div>;

  if (tripType === 'round-trip') {
    return (
      <div className="space-y-8 mt-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Outbound Flights</h2>
          <AnimatePresence>
            <motion.div className="space-y-4" initial={false}>
              {outboundFlights.length === 0 && <motion.div className="text-gray-600 mb-4">No outbound flights found.</motion.div>}
              {outboundFlights.map((flight, idx) => (
                <motion.div
                  key={flight.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.32 + idx * 0.06 }}
                  className={`border rounded flex flex-row items-center justify-between bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer focus-within:ring-2 focus-within:ring-blue-400
                    ${selectedOutboundId === flight.id ? "border-blue-600 ring-2 ring-blue-400 bg-blue-50" : ""}
                  `}
                  tabIndex={0}
                  onClick={() => handleOutboundClick(flight.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleOutboundClick(flight.id);
                  }}
                  role="button"
                  aria-pressed={selectedOutboundId === flight.id}
                  style={{ userSelect: "none" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedOutboundId === flight.id}
                    readOnly
                    className="w-5 h-5 ml-4 mr-6 accent-blue-600"
                    aria-label="Select outbound flight"
                    tabIndex={-1}
                  />
                  <div className="flex-1 w-full py-4">
                    <FlightCardContent flight={flight} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Return Flights</h2>
          <AnimatePresence>
            <motion.div className="space-y-4" initial={false}>
              {returnFlights.length === 0 && <motion.div className="text-gray-600 mb-4">No return flights found.</motion.div>}
              {returnFlights.map((flight, idx) => (
                <motion.div
                  key={flight.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.32 + idx * 0.06 }}
                  className={`border rounded flex flex-row items-center justify-between bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer focus-within:ring-2 focus-within:ring-blue-400
                    ${selectedReturnId === flight.id ? "border-blue-600 ring-2 ring-blue-400 bg-blue-50" : ""}
                  `}
                  tabIndex={0}
                  onClick={() => handleReturnClick(flight.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleReturnClick(flight.id);
                  }}
                  role="button"
                  aria-pressed={selectedReturnId === flight.id}
                  style={{ userSelect: "none" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedReturnId === flight.id}
                    readOnly
                    className="w-5 h-5 ml-4 mr-6 accent-blue-600"
                    aria-label="Select return flight"
                    tabIndex={-1}
                  />
                  <div className="flex-1 w-full py-4">
                    <FlightCardContent flight={flight} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <motion.div className="text-center mt-8" layout>
          <motion.button
            onClick={handleBookBoth}
            className={`px-6 py-3 rounded font-semibold text-lg transition-all shadow ${
              selectedOutboundId && selectedReturnId
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!selectedOutboundId || !selectedReturnId}
            data-testid="book-both-btn"
            whileHover={selectedOutboundId && selectedReturnId ? { scale: 1.08 } : {}}
            whileTap={selectedOutboundId && selectedReturnId ? { scale: 0.96 } : {}}
          >
            Book both
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // One-way
  return (
    <motion.div className="space-y-4 mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence>
        {outboundFlights.map((flight, idx) => (
          <motion.div
            key={flight.id}
            layout
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -36 }}
            transition={{ duration: 0.36 + idx * 0.05 }}
            className="border rounded p-4 flex flex-col md:flex-row justify-between items-center bg-white shadow-sm hover:shadow-lg transition"
          >
            <FlightCardContent flight={flight} />
            <motion.div className="flex flex-col items-center mt-4 md:mt-0"
              initial={false}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: 0, duration: 0.36 }}
            >
              <div className="text-xl font-bold mb-2">
                {typeof flight.price === "number"
                  ? `₹${flight.price.toLocaleString()}`
                  : "Price not available"}
              </div>
              <motion.button
                onClick={() => handleBookFlight(flight.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                disabled={flight.available_seats === 0}
                whileHover={flight.available_seats !== 0 ? { scale: 1.06 } : {}}
                whileTap={flight.available_seats !== 0 ? { scale: 0.97 } : {}}
              >
                {flight.available_seats === 0 ? "Sold Out" : "Book"}
              </motion.button>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

function FlightCardContent({ flight }: { flight: Flight }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      className="w-full"
      transition={{ duration: 0.2 }}
    >
      <div className="font-semibold text-lg flex gap-2 items-center">
        <span className="text-blue-700">{flight.airline ?? "Unknown Airline"}</span>
        <span className="bg-blue-100 px-2 py-1 rounded text-xs">{flight.flight_number ?? "N/A"}</span>
      </div>
      <div className="mb-1">
        <span className="font-mono">{flight.departure_airport ?? "???"}</span>
        <span className="mx-1">→</span>
        <span className="font-mono">{flight.arrival_airport ?? "???"}</span>
      </div>
      <div className="text-gray-600 text-sm">
        Departure:{" "}
        {flight.departure_time
          ? new Date(flight.departure_time).toLocaleString()
          : "Unknown"}
      </div>
      <div className="text-gray-600 text-sm">
        Arrival:{" "}
        {flight.arrival_time
          ? new Date(flight.arrival_time).toLocaleString()
          : "Unknown"}
      </div>
      <div className="text-gray-500 text-sm">
        Duration: {flight.duration ?? "Unknown"}
      </div>
      <div className="text-gray-500 text-sm">
        Cabin: {flight.cabin_class ?? "Unknown"}
      </div>
      <div className="text-gray-500 text-sm">
        Available seats:{" "}
        {typeof flight.available_seats === "number"
          ? flight.available_seats
          : "?"}
      </div>
      <div className="text-xl font-bold mt-2 text-green-700">
        {typeof flight.price === "number"
          ? `₹${flight.price.toLocaleString()}`
          : "Price not available"}
      </div>
    </motion.div>
  );
}