// frontend/src/app/flights/[flightId]/select-seats/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, } from 'framer-motion';

type Seat = {
  id: string;
  seat_number: string;
  cabin_class: string;
  status: string;
  booking_id: string | null;
  passenger_id: string | null;
};

type Passenger = {
  id: string;
  first_name: string;
  last_name: string;
  passenger_type: string;
};

function SeatButton({
  seat,
  selected,
  onClick,
}: {
  seat: Seat;
  selected: boolean;
  onClick: () => void;
}) {
  let color =
    'bg-green-200 hover:bg-green-300 border-green-400 shadow-sm hover:shadow-md';
  if (seat.status !== 'available') color = 'bg-gray-300 border-gray-400 cursor-not-allowed';
  if (selected) color = 'bg-blue-600 text-white border-blue-800 shadow-lg scale-105 ring-2 ring-blue-400';

  return (
    <motion.button
      className={
        `w-12 h-12 m-1 rounded-xl transition-all duration-150 font-bold text-lg flex items-center justify-center border ` +
        color
      }
      disabled={seat.status !== 'available'}
      onClick={onClick}
      type="button"
      aria-label={`Seat ${seat.seat_number}`}
      whileHover={seat.status === 'available' ? { scale: 1.09 } : {}}
      whileTap={seat.status === 'available' ? { scale: 0.98 } : {}}
      layout
    >
      {seat.seat_number}
    </motion.button>
  );
}

export default function SeatSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const flightId = params.flightId ?? '';
  const bookingId = searchParams.get('bookingId') ?? '';

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(true);
  const [passengersLoading, setPassengersLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedSeats, setSelectedSeats] = useState<{ [passengerId: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch passengers
  useEffect(() => {
    async function fetchPassengers() {
      setPassengersLoading(true);
      try {
        const res = await fetch(`/api/bookings/${bookingId}/passengers`);
        const data = await res.json();
        setPassengers(data.passengers || []);
      } catch {
        setError('Failed to load passengers.');
      } finally {
        setPassengersLoading(false);
      }
    }
    if (bookingId) fetchPassengers();
  }, [bookingId]);

  // Fetch seats
  useEffect(() => {
    async function fetchSeats() {
      setSeatsLoading(true);
      setError('');
      const res = await fetch(`/api/flights/${flightId}/seats`);
      const data = await res.json();
      setSeats(data.seats || []);
      setSeatsLoading(false);
    }
    if (flightId) fetchSeats();
  }, [flightId]);

  // Group seats by row for rendering
  function groupSeatsByRows(seats: Seat[]) {
    const map: { [row: string]: Seat[] } = {};
    seats.forEach((seat) => {
      const row = seat.seat_number.replace(/\D/g, '');
      if (!map[row]) map[row] = [];
      map[row].push(seat);
    });
    // Sort rows and seats within rows
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([row, seats]) => ({
        row,
        seats: seats.sort((a, b) => a.seat_number.localeCompare(b.seat_number)),
      }));
  }

  function handleSeatSelect(passengerId: string, seatNumber: string) {
    // Prevent duplicate seat selection
    const alreadySelected = Object.entries(selectedSeats).find(
      ([, s]) => s === seatNumber
    );
    if (alreadySelected && alreadySelected[0] !== passengerId) return;
    setSelectedSeats((prev) => ({
      ...prev,
      [passengerId]: prev[passengerId] === seatNumber ? '' : seatNumber,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const seatNumbers = passengers.map((p) => selectedSeats[p.id]);
      if (seatNumbers.some((s) => !s)) {
        setError('Please select a seat for each passenger.');
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/flights/${flightId}/seats/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumbers,
          bookingId,
          passengerIds: passengers.map((p) => p.id),
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/booking/confirmation/${bookingId}`);
        }, 1400);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('Failed to reserve seats.');
    } finally {
      setSubmitting(false);
    }
  }

  if (seatsLoading || passengersLoading)
    return (
      <motion.div
        className="flex justify-center items-center min-h-[40vh] text-blue-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mr-3"
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.2 }}
        />
        <span className="text-lg font-semibold">Loading seat map...</span>
      </motion.div>
    );

  if (error)
    return (
      <motion.div
        className="text-red-600 text-center py-12"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {error}
      </motion.div>
    );

  const seatsByRows = groupSeatsByRows(seats);

  return (
    <motion.div
      className="max-w-4xl mx-auto p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <motion.h1
        className="text-3xl font-extrabold mb-8 tracking-tight text-blue-800 text-center"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Select Seats
      </motion.h1>
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        {passengers.map((passenger, i) => (
          <motion.div
            key={passenger.id}
            className="mb-12 bg-blue-50 border border-blue-100 rounded-xl p-6 shadow"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4 }}
          >
            <div className="font-bold text-blue-900 mb-2">
              {passenger.first_name} {passenger.last_name} <span className="font-normal text-blue-600">({passenger.passenger_type})</span>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex flex-col">
                {seatsByRows.map(({ row, seats }) => (
                  <div key={row} className="flex items-center mb-1">
                    <span className="w-8 text-right mr-3 text-xs text-gray-500">{row}</span>
                    {seats.map((seat) => (
                      <SeatButton
                        key={seat.seat_number}
                        seat={seat}
                        selected={selectedSeats[passenger.id] === seat.seat_number}
                        onClick={() => handleSeatSelect(passenger.id, seat.seat_number)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-700">
              Selected seat:{" "}
              <span className="font-mono font-semibold">
                {selectedSeats[passenger.id] || <span className="text-blue-400">None</span>}
              </span>
            </div>
          </motion.div>
        ))}
        <div className="flex items-center gap-4">
          <motion.button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold text-lg shadow hover:from-green-500 hover:to-blue-700 transition-all disabled:opacity-60"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {submitting ? "Reserving..." : "Reserve Selected Seats"}
          </motion.button>
          {success && (
            <motion.span
              className="text-green-600 font-semibold"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Seats reserved!
            </motion.span>
          )}
        </div>
        {error && <div className="text-red-600 mt-4">{error}</div>}
      </motion.form>
      <div className="mt-10 text-sm text-blue-700 text-center">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <span>
            <span className="inline-block w-6 h-6 bg-green-200 border-2 border-green-400 rounded-xl align-middle mr-1"></span>
            Available
          </span>
          <span>
            <span className="inline-block w-6 h-6 bg-gray-300 border-2 border-gray-400 rounded-xl align-middle mr-1"></span>
            Booked/Unavailable
          </span>
          <span>
            <span className="inline-block w-6 h-6 bg-blue-600 border-2 border-blue-800 rounded-xl align-middle mr-1"></span>
            Your Selection
          </span>
        </div>
      </div>
    </motion.div>
  );
}