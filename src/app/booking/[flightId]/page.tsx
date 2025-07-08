// frontend/src/app/booking/[flightId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, } from 'framer-motion';

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

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const flightId = params?.flightId as string;

  const [flightDetails, setFlightDetails] = useState<FlightDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    passportNumber: '',
  });

  // Extract cabin class and passenger count from search params
  const cabinClass = searchParams?.get('cabinClass') || 'Economy';
  const adultsParam = searchParams?.get('adults') || '1';
  const childrenParam = searchParams?.get('children') || '0';
  const infantsParam = searchParams?.get('infants') || '0';

  const adults = parseInt(adultsParam, 10);
  const children = parseInt(childrenParam, 10);
  const infants = parseInt(infantsParam, 10);
  const totalPassengers = adults + children + infants;

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [user, router]);

  useEffect(() => {
    const fetchFlightDetails = async () => {
      if (!flightId) {
        setError('Flight ID is missing');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/flights/${flightId}?cabinClass=${cabinClass}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch flight details');
        }
        const data = await response.json();
        setFlightDetails(data);
      } catch (err: unknown) {
        const typedError = err as ErrorType;
        setError(typedError.message || 'An error occurred while fetching flight details');
      } finally {
        setLoading(false);
      }
    };

    fetchFlightDetails();
  }, [flightId, cabinClass]);

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email) {
      setPassengerInfo(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassengerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flightDetails) {
      setError('No flight details available');
      return;
    }

    if (!user) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bookingPayload = {
        flightId,
        cabinClass,
        passengers: {
          adults,
          children,
          infants,
          total: totalPassengers
        },
        passengerInfo,
        totalAmount: flightDetails.price * totalPassengers,
        userId: user.id
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      // Redirect to seat selection page with bookingId
      router.push(`/flights/${flightId}/select-seats?bookingId=${data.id}`);
    } catch (err: unknown) {
      const typedError = err as ErrorType;
      setError(typedError.message || 'An error occurred while processing your booking');
    } finally {
      setLoading(false);
    }
  };

  // Animations for loader, error, and main
  if (!user) {
    return (
      <motion.div
        className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div
            className="mx-auto mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
          >
            <span className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></span>
          </motion.div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div
            className="mx-auto mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, repeat: Infinity, repeatType: "mirror" }}
          >
            <span className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></span>
          </motion.div>
          <p className="mt-4 text-gray-600">Loading flight details...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-xl shadow-xl w-full max-w-lg"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <p className="font-bold text-lg mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 bg-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-red-700 transition"
          >
            Go Back
          </button>
        </motion.div>
      </motion.div>
    );
  }

  if (!flightDetails) {
    return (
      <motion.div
        className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-6 rounded-xl shadow-xl w-full max-w-lg"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <p>Flight details not found. Please try again or select another flight.</p>
          <button
            onClick={() => router.back()}
            className="mt-6 bg-yellow-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-yellow-700 transition"
          >
            Go Back
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto px-2 sm:px-6 py-10"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <motion.h1
        className="text-3xl md:text-4xl font-extrabold text-blue-800 mb-10 text-center"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Complete Your Booking
      </motion.h1>

      {/* Flight Details Card */}
      <motion.div
        className="bg-white/90 p-7 rounded-2xl shadow-xl mb-8 border border-blue-100"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-bold mb-4 text-blue-800">Flight Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-900">
          <div>
            <p className="text-blue-700">Flight</p>
            <p className="font-medium">{flightDetails.airline} {flightDetails.flight_number}</p>
          </div>
          <div>
            <p className="text-blue-700">Date</p>
            <p className="font-medium">{new Date(flightDetails.departure_time).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-blue-700">Departure</p>
            <p className="font-medium">{flightDetails.departure_airport} <span className="text-xs text-blue-400">({new Date(flightDetails.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span></p>
          </div>
          <div>
            <p className="text-blue-700">Arrival</p>
            <p className="font-medium">{flightDetails.arrival_airport} <span className="text-xs text-blue-400">({new Date(flightDetails.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span></p>
          </div>
          <div>
            <p className="text-blue-700">Duration</p>
            <p className="font-medium">{flightDetails.duration}</p>
          </div>
          <div>
            <p className="text-blue-700">Cabin Class</p>
            <p className="font-medium">{cabinClass}</p>
          </div>
        </div>
      </motion.div>

      {/* Passenger Info Form */}
      <motion.div
        className="bg-blue-50 p-7 rounded-2xl shadow-lg mb-8 border border-blue-200"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <h2 className="text-xl font-bold mb-4 text-blue-800">Passenger Information</h2>
        <p className="mb-4 text-blue-700">
          Passengers: {adults} {adults === 1 ? 'Adult' : 'Adults'}
          {children > 0 && `, ${children} ${children === 1 ? 'Child' : 'Children'}`}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 transition"
                whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
              />
            </div>
          </div>

          {/* Price Summary */}
          <motion.div
            className="bg-white/90 p-5 rounded-xl mb-4 border border-blue-100"
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.07, duration: 0.3 }}
          >
            <h3 className="text-lg font-bold mb-2 text-blue-900">Price Summary</h3>
            <div className="flex justify-between mb-2">
              <span>Base fare ({totalPassengers} {totalPassengers === 1 ? 'passenger' : 'passengers'})</span>
              <span>₹{flightDetails.price.toFixed(2)} × {totalPassengers}</span>
            </div>
            <div className="flex justify-between font-extrabold text-xl border-t pt-3 text-blue-800">
              <span>Total</span>
              <span>₹{(flightDetails.price * totalPassengers).toFixed(2)}</span>
            </div>
          </motion.div>

          <div className="flex justify-end gap-2 pt-2">
            <motion.button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 text-blue-800 bg-blue-100 rounded-xl font-semibold hover:bg-blue-200 transition"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Back
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}