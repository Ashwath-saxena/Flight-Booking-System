// frontend/src/components/BookingCard.tsx
'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { BookingWithDetails } from '@/types/booking';
import { useFlightStatus } from '@/hooks/useFlightStatus';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowserClient';

type PassengerWithSeat = {
  id: string;
  first_name: string;
  last_name: string;
  passenger_type: string;
  cabin_class: string;
  seat_number?: string | null;
};

interface BookingCardProps {
  booking: BookingWithDetails;
  onCancel?: (bookingId: string) => Promise<void>;
}

export default function BookingCard({ booking, onCancel }: BookingCardProps) {
  const [showFlightId, setShowFlightId] = useState(false);
  const { status: flightStatus, isConnected } = useFlightStatus(booking.flight.id);
  const [passengersWithSeats, setPassengersWithSeats] = useState<PassengerWithSeat[]>([]);

  useEffect(() => {
    async function fetchSeats() {
      if (!booking.id) return;
      const { data: seats } = await supabase
        .from('seats')
        .select('seat_number, passenger_id')
        .eq('booking_id', booking.id);

      const seatMap: Record<string, string> = {};
      (seats || []).forEach((s) => {
        if (s.passenger_id) seatMap[s.passenger_id] = s.seat_number;
      });

      setPassengersWithSeats(
        booking.passengers.map((p) => ({
          ...p,
          seat_number: seatMap[p.id] || null,
        }))
      );
    }
    fetchSeats();
    // eslint-disable-next-line
  }, [booking.id, booking.passengers.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFlightStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'boarding': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-yellow-100 text-yellow-800';
      case 'in flight': return 'bg-purple-100 text-purple-800';
      case 'arrived': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyFlightId = () => {
    navigator.clipboard.writeText(booking.flight.id);
    setShowFlightId(true);
    setTimeout(() => setShowFlightId(false), 2000);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex flex-wrap justify-between">
          <div>
            <div className="flex items-center">
              <span className="text-lg font-medium">
                {booking.flight.origin.city} ({booking.flight.origin.code}) → 
                {booking.flight.destination.city} ({booking.flight.destination.code})
              </span>
              <span className={`ml-4 inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                {booking.booking_status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Booked on {format(new Date(booking.created_at), 'MMMM d, yyyy')}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              {flightStatus ? (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFlightStatusColor(flightStatus.status)}`}>
                  {flightStatus.status}
                  {flightStatus.delay && flightStatus.delay > 0 && ` (+${flightStatus.delay}m)`}
                </span>
              ) : (
                <span className="text-xs text-gray-500">Loading status...</span>
              )}
              {flightStatus?.message && (
                <span className="text-xs text-gray-600">• {flightStatus.message}</span>
              )}
            </div>
          </div>
          <div className="mt-2 sm:mt-0">
            <div className="text-gray-600 text-sm">Booking Reference</div>
            <div className="font-mono text-sm">{booking.id.substring(0, 8).toUpperCase()}...</div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap justify-between items-start">
          <div className="flex-1">
            <div className="text-gray-700">
              {booking.flight.flight_number}
            </div>
            <div className="text-gray-600 text-sm">
              Departure: {format(new Date(
                flightStatus?.estimatedDeparture || booking.flight.departure_time
              ), 'MMMM d, yyyy • h:mm a')}
              {flightStatus?.delay && flightStatus.delay > 0 && (
                <span className="text-orange-600 ml-1">(Delayed)</span>
              )}
            </div>
            <div className="text-gray-600 text-sm">
              Arrival: {format(new Date(
                flightStatus?.estimatedArrival || booking.flight.arrival_time
              ), 'MMMM d, yyyy • h:mm a')}
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-blue-800 text-sm font-medium">📱 Track Flight Real-time</div>
                  <div className="text-blue-600 text-xs">Flight Tracking ID</div>
                </div>
                <button
                  onClick={copyFlightId}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                >
                  {showFlightId ? '✓ Copied!' : 'Copy ID'}
                </button>
              </div>
              {showFlightId && (
                <div className="mt-2 p-2 bg-white rounded border font-mono text-xs text-blue-800 break-all">
                  {booking.flight.id}
                </div>
              )}
            </div>
            <div className="mt-3">
              <div className="text-gray-600 text-sm font-medium mb-1">Passengers:</div>
              {passengersWithSeats.map((passenger, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {passenger.first_name} {passenger.last_name} - {passenger.passenger_type} ({passenger.cabin_class})
                  {passenger.seat_number && (
                    <span className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 font-mono">
                      Seat {passenger.seat_number}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 sm:mt-0 ml-4">
            <div className="text-gray-600 text-sm">Total Paid</div>
            <div className="text-xl font-bold">₹{booking.total_amount.toLocaleString()}</div>
          </div>
        </div>
        <div className="w-full mt-4 flex gap-2 flex-wrap">
          <Link 
            href={`/booking/confirmation/${booking.id}`}
            className="block px-4 py-2 border border-transparent rounded font-medium text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            View Details
          </Link>
          <Link 
            href={`/flight-status?flightId=${booking.flight.id}`}
            className="block px-4 py-2 border border-blue-600 rounded font-medium text-blue-600 hover:bg-blue-50"
          >
            Track Flight
          </Link>
          {booking.booking_status === 'Confirmed' && onCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              className="block px-4 py-2 border border-red-600 rounded font-medium text-red-600 hover:bg-red-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}