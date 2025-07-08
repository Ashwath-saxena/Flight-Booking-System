// frontend/src/app/bookings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/supabaseBrowserClient';
import Link from 'next/link';
import BookingCard from '@/components/BookingCard';
import { BookingWithDetails } from '@/types/booking';
import { motion, AnimatePresence } from 'framer-motion';

type ErrorResponse = {
  message: string;
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            flight:flights!bookings_flight_id_fkey(
              id,
              flight_number,
              departure_time,
              arrival_time,
              available_seats,
              base_price,
              origin:airports!flights_origin_id_fkey(
                code, 
                city, 
                name
              ),
              destination:airports!flights_destination_id_fkey(
                code, 
                city, 
                name
              )
            ),
            passengers(
              id,
              first_name,
              last_name,
              passenger_type,
              cabin_class
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookings(data as BookingWithDetails[]);
      } catch (err) {
        const typedError = err as ErrorResponse;
        console.error('Error fetching bookings:', typedError);
        setError(typedError.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          *,
          flight:flights(available_seats),
          passengers(cabin_class)
        `)
        .eq('id', bookingId)
        .single();

      if (!bookingData) throw new Error('Booking not found');

      // Calculate seats to restore
      const seatsByClass: Record<string, number> = {};
      bookingData.passengers.forEach((passenger: { cabin_class: string }) => {
        const cabinClass = passenger.cabin_class;
        seatsByClass[cabinClass] = (seatsByClass[cabinClass] || 0) + 1;
      });

      // Update flight's available seats
      const updatedSeats = { ...bookingData.flight.available_seats };
      Object.entries(seatsByClass).forEach(([cabinClass, count]) => {
        updatedSeats[cabinClass] = (updatedSeats[cabinClass] || 0) + count;
      });

      // Call the cancel_booking function
      const { error: updateError } = await supabase.rpc('cancel_booking', {
        p_booking_id: bookingId,
        p_updated_seats: updatedSeats
      });

      if (updateError) throw updateError;

      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, booking_status: 'Cancelled' }
            : booking
        )
      );

      alert('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <motion.div
        className="max-w-6xl mx-auto p-6 flex justify-center items-center min-h-[50vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-xl text-blue-700 flex items-center gap-3"
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <svg className="animate-spin h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading your bookings...
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="max-w-6xl mx-auto p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-xl text-red-600"
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {error}
        </motion.div>
      </motion.div>
    );
  }

  if (bookings.length === 0) {
    return (
      <motion.div
        className="max-w-6xl mx-auto p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.h1
          className="text-3xl font-bold mb-8 text-center text-blue-800"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          My Bookings
        </motion.h1>
        <motion.div
          className="bg-white/90 shadow-xl rounded-2xl p-10 text-center border border-blue-100"
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-blue-700">No bookings found</h3>
          <p className="mt-1 text-blue-600">You haven&apos;t made any flight bookings yet.</p>
          <div className="mt-8">
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 transition-all"
            >
              Search for Flights
            </Link>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      <motion.h1
        className="text-3xl font-extrabold mb-10 tracking-tight text-blue-800 text-center"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        My Bookings
      </motion.h1>
      <motion.div
        className="grid grid-cols-1 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <AnimatePresence>
          {bookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <BookingCard
                booking={booking}
                onCancel={handleCancelBooking}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}