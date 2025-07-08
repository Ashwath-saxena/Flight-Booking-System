// frontend/src/app/booking/round-trip/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface FlightDetails {
  id: string;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: number;
  cabin_class: string;
}

interface PassengerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportNumber: string;
}

type ErrorType = {
  message: string;
};

export default function RoundTripBookingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const outboundId = params.get('outbound');
  const returnId = params.get('return');
  const cabinClass = params.get('cabinClass') || 'Economy';
  const adultsParam = params.get('adults') || '1';
  const childrenParam = params.get('children') || '0';
  const infantsParam = params.get('infants') || '0';

  const adults = parseInt(adultsParam, 10);
  const children = parseInt(childrenParam, 10);
  const infants = parseInt(infantsParam, 10);
  const totalPassengers = adults + children + infants;

  // Step: 1 = Outbound Passenger, 2 = Return Passenger, 3 = Redirect to Seat Selection, 4 = Confirmation
  const [step, setStep] = useState<number>(1);

  // Outbound
  const [outboundDetails, setOutboundDetails] = useState<FlightDetails | null>(null);
  const [outboundLoading, setOutboundLoading] = useState(true);
  const [outboundError, setOutboundError] = useState<string | null>(null);
  const [outboundPassengerInfo, setOutboundPassengerInfo] = useState<PassengerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    passportNumber: '',
  });
  const [outboundBookingId, setOutboundBookingId] = useState<string | null>(null);

  // Return
  const [returnDetails, setReturnDetails] = useState<FlightDetails | null>(null);
  const [returnLoading, setReturnLoading] = useState(true);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnPassengerInfo, setReturnPassengerInfo] = useState<PassengerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    passportNumber: '',
  });
  const [returnBookingId, setReturnBookingId] = useState<string | null>(null);

  // Fetch flight details
  useEffect(() => {
    if (!outboundId) return;
    setOutboundLoading(true);
    fetch(`/api/flights/${outboundId}?cabinClass=${cabinClass}`)
      .then(res => res.json())
      .then(data => setOutboundDetails(data))
      .catch(() => setOutboundError('Failed to load outbound flight details'))
      .finally(() => setOutboundLoading(false));
  }, [outboundId, cabinClass]);

  useEffect(() => {
    if (!returnId) return;
    setReturnLoading(true);
    fetch(`/api/flights/${returnId}?cabinClass=${cabinClass}`)
      .then(res => res.json())
      .then(data => setReturnDetails(data))
      .catch(() => setReturnError('Failed to load return flight details'))
      .finally(() => setReturnLoading(false));
  }, [returnId, cabinClass]);

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email) {
      setOutboundPassengerInfo(prev => ({ ...prev, email: user.email || '' }));
      setReturnPassengerInfo(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  // Auth redirect
  useEffect(() => {
    if (!user) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [user, router]);

  // Handlers
  const handlePassengerChange = (
    setter: React.Dispatch<React.SetStateAction<PassengerInfo>>
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setter(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitOutboundPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outboundDetails || !user) return;
    try {
      setOutboundLoading(true);
      const bookingPayload = {
        flightId: outboundId,
        cabinClass,
        passengers: {
          adults,
          children,
          infants,
          total: totalPassengers,
        },
        passengerInfo: outboundPassengerInfo,
        totalAmount: outboundDetails.price * totalPassengers,
        userId: user.id,
        direction: 'outbound',
      };
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create outbound booking');
      setOutboundBookingId(data.id);
      setStep(2);
    } catch (err: any) {
      setOutboundError(err.message || 'Failed to book outbound flight');
    } finally {
      setOutboundLoading(false);
    }
  };

  const handleSubmitReturnPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnDetails || !user) return;
    try {
      setReturnLoading(true);
      const bookingPayload = {
        flightId: returnId,
        cabinClass,
        passengers: {
          adults,
          children,
          infants,
          total: totalPassengers,
        },
        passengerInfo: returnPassengerInfo,
        totalAmount: returnDetails.price * totalPassengers,
        userId: user.id,
        direction: 'return',
      };
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create return booking');
      setReturnBookingId(data.id);
      setStep(3);
    } catch (err: any) {
      setReturnError(err.message || 'Failed to book return flight');
    } finally {
      setReturnLoading(false);
    }
  };

  // After both bookings are created, redirect to seat selection
  useEffect(() => {
    if (
      step === 3 &&
      outboundBookingId &&
      returnBookingId &&
      outboundId &&
      returnId
    ) {
      router.replace(
        `/booking/round-trip/seat-selection?outboundBookingId=${outboundBookingId}&returnBookingId=${returnBookingId}&outbound=${outboundId}&return=${returnId}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, outboundBookingId, returnBookingId, outboundId, returnId]);

  // Loading/auth/error states
  if (!user) {
    return (
      <motion.div
        className="container mx-auto p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, repeat: Infinity, repeatType: "mirror" }}
          />
          <p className="mt-4 text-blue-700 text-lg font-semibold">Redirecting to login...</p>
        </div>
      </motion.div>
    );
  }
  if (step === 1 && (outboundLoading || !outboundDetails)) {
    return (
      <motion.div
        className="container mx-auto p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, repeat: Infinity, repeatType: "mirror" }}
          />
          <p className="mt-4 text-blue-700 text-lg font-semibold">Loading outbound flight details...</p>
        </div>
      </motion.div>
    );
  }
  if (step === 2 && (returnLoading || !returnDetails)) {
    return (
      <motion.div
        className="container mx-auto p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, repeat: Infinity, repeatType: "mirror" }}
          />
          <p className="mt-4 text-blue-700 text-lg font-semibold">Loading return flight details...</p>
        </div>
      </motion.div>
    );
  }
  if (outboundError) {
    return (
      <motion.div
        className="container mx-auto p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded shadow">
          <p className="font-medium text-lg">Error</p>
          <p>{outboundError}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }
  if (returnError) {
    return (
      <motion.div
        className="container mx-auto p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded shadow">
          <p className="font-medium text-lg">Error</p>
          <p>{returnError}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  // --- Step 1: Outbound Passenger Info ---
  if (step === 1) {
    return (
      <motion.div
        className="container mx-auto p-6"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.h1
          className="text-3xl font-extrabold text-blue-800 mb-8 text-center"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Complete Outbound Booking
        </motion.h1>
        <BookingDetailsSection flight={outboundDetails!} cabinClass={cabinClass} />
        <PassengerForm
          passengerInfo={outboundPassengerInfo}
          handleChange={handlePassengerChange(setOutboundPassengerInfo)}
          handleSubmit={handleSubmitOutboundPassenger}
          loading={outboundLoading}
          adults={adults}
          childrenCount={children}
          infants={infants}
          totalPassengers={totalPassengers}
          price={outboundDetails!.price}
          buttonLabel="Continue to Return Booking"
        />
      </motion.div>
    );
  }

  // --- Step 2: Return Passenger Info ---
  if (step === 2) {
    return (
      <motion.div
        className="container mx-auto p-6"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.h1
          className="text-3xl font-extrabold text-blue-800 mb-8 text-center"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Complete Return Booking
        </motion.h1>
        <BookingDetailsSection flight={returnDetails!} cabinClass={cabinClass} />
        <PassengerForm
          passengerInfo={returnPassengerInfo}
          handleChange={handlePassengerChange(setReturnPassengerInfo)}
          handleSubmit={handleSubmitReturnPassenger}
          loading={returnLoading}
          adults={adults}
          childrenCount={children}
          infants={infants}
          totalPassengers={totalPassengers}
          price={returnDetails!.price}
          buttonLabel="Continue to Seat Selection"
        />
      </motion.div>
    );
  }

  // --- Step 3: Redirecting to seat selection ---
  if (step === 3) {
    return (
      <motion.div
        className="container mx-auto p-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, repeat: Infinity, repeatType: "mirror" }}
        />
        <p className="mt-4 text-blue-700 text-lg font-semibold">Redirecting to seat selection...</p>
      </motion.div>
    );
  }

  // Fallback
  return null;
}

// --- Subcomponents ---

function BookingDetailsSection({ flight, cabinClass }: { flight: FlightDetails; cabinClass: string }) {
  return (
    <motion.div
      className="bg-gray-50 p-4 rounded-lg shadow mb-6 border border-blue-100"
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-bold mb-4 text-blue-800">Flight Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-900">
        <div>
          <p className="text-blue-700">Flight</p>
          <p className="font-medium">{flight.airline} {flight.flight_number}</p>
        </div>
        <div>
          <p className="text-blue-700">Date</p>
          <p className="font-medium">{new Date(flight.departure_time).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-blue-700">Departure</p>
          <p className="font-medium">{flight.departure_airport} <span className="text-xs text-blue-400">({new Date(flight.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})</span></p>
        </div>
        <div>
          <p className="text-blue-700">Arrival</p>
          <p className="font-medium">{flight.arrival_airport} <span className="text-xs text-blue-400">({new Date(flight.arrival_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})</span></p>
        </div>
        <div>
          <p className="text-blue-700">Duration</p>
          <p className="font-medium">{flight.duration}</p>
        </div>
        <div>
          <p className="text-blue-700">Cabin Class</p>
          <p className="font-medium">{cabinClass}</p>
        </div>
      </div>
    </motion.div>
  );
}

function PassengerForm({
  passengerInfo,
  handleChange,
  handleSubmit,
  loading,
  adults,
  childrenCount,
  infants,
  totalPassengers,
  price,
  buttonLabel,
}: {
  passengerInfo: PassengerInfo,
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleSubmit: (e: React.FormEvent) => void,
  loading: boolean,
  adults: number,
  childrenCount: number,
  infants: number,
  totalPassengers: number,
  price: number,
  buttonLabel: string,
}) {
  return (
    <motion.div
      className="bg-white p-4 rounded-lg shadow mb-6 border border-blue-100"
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.05, duration: 0.3 }}
    >
      <h2 className="text-xl font-bold mb-4 text-blue-800">Passenger Information</h2>
      <p className="mb-4 text-blue-700">
        Passengers: {adults} {adults === 1 ? 'Adult' : 'Adults'}
        {childrenCount > 0 && `, ${childrenCount} ${childrenCount === 1 ? 'Child' : 'Children'}`}
        {infants > 0 && `, ${infants} ${infants === 1 ? 'Infant' : 'Infants'}`}
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-blue-900 mb-1 font-medium">First Name</label>
            <motion.input
              type="text"
              id="firstName"
              name="firstName"
              value={passengerInfo.firstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 transition"
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-blue-900 mb-1 font-medium">Last Name</label>
            <motion.input
              type="text"
              id="lastName"
              name="lastName"
              value={passengerInfo.lastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 transition"
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-blue-900 mb-1 font-medium">Email</label>
            <motion.input
              type="email"
              id="email"
              name="email"
              value={passengerInfo.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 transition"
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-blue-900 mb-1 font-medium">Phone</label>
            <motion.input
              type="tel"
              id="phone"
              name="phone"
              value={passengerInfo.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 transition"
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
            />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-blue-900 mb-1 font-medium">Date of Birth</label>
            <motion.input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={passengerInfo.dateOfBirth}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 transition"
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
            />
          </div>
          <div>
            <label htmlFor="passportNumber" className="block text-blue-900 mb-1 font-medium">Passport Number (Optional)</label>
            <motion.input
              type="text"
              id="passportNumber"
              name="passportNumber"
              value={passengerInfo.passportNumber}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 transition"
              whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
            />
          </div>
        </div>
        <motion.div
          className="bg-gray-50 p-4 rounded-lg mb-6 border border-blue-100"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.07, duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-2 text-blue-900">Price Summary</h3>
          <div className="flex justify-between mb-2">
            <span>Base fare ({totalPassengers} {totalPassengers === 1 ? 'passenger' : 'passengers'})</span>
            <span>₹{price.toFixed(2)} × {totalPassengers}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 text-blue-800">
            <span>Total</span>
            <span>₹{(price * totalPassengers).toFixed(2)}</span>
          </div>
        </motion.div>
        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? 'Processing...' : buttonLabel}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}