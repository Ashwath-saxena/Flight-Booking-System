// frontend/src/app/booking/round-trip/seat-selection/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function SeatLegend() {
  return (
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
  );
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function RoundTripSeatSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2>(1);

  // Outbound
  const outboundBookingId = searchParams.get('outboundBookingId') || '';
  const outboundFlightId = searchParams.get('outbound') || '';
  const [outboundPassengers, setOutboundPassengers] = useState<Passenger[]>([]);
  const [outboundSeats, setOutboundSeats] = useState<Seat[]>([]);
  const [outboundSeatsLoading, setOutboundSeatsLoading] = useState(true);
  const [outboundPassengersLoading, setOutboundPassengersLoading] = useState(true);
  const [outboundError, setOutboundError] = useState<string>('');
  const [selectedOutboundSeats, setSelectedOutboundSeats] = useState<{ [passengerId: string]: string }>({});
  const [outboundSubmitting, setOutboundSubmitting] = useState(false);

  // Return
  const returnBookingId = searchParams.get('returnBookingId') || '';
  const returnFlightId = searchParams.get('return') || '';
  const [returnPassengers, setReturnPassengers] = useState<Passenger[]>([]);
  const [returnSeats, setReturnSeats] = useState<Seat[]>([]);
  const [returnSeatsLoading, setReturnSeatsLoading] = useState(true);
  const [returnPassengersLoading, setReturnPassengersLoading] = useState(true);
  const [returnError, setReturnError] = useState<string>('');
  const [selectedReturnSeats, setSelectedReturnSeats] = useState<{ [passengerId: string]: string }>({});
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const [success, setSuccess] = useState(false);

  // Outbound passengers/seats
  useEffect(() => {
    async function fetchPassengers() {
      setOutboundPassengersLoading(true);
      try {
        const res = await fetch(`/api/bookings/${outboundBookingId}/passengers`);
        const data = await res.json();
        setOutboundPassengers(data.passengers || []);
      } catch {
        setOutboundError('Failed to load outbound passengers.');
      } finally {
        setOutboundPassengersLoading(false);
      }
    }
    if (outboundBookingId) fetchPassengers();
  }, [outboundBookingId]);

  useEffect(() => {
    async function fetchSeats() {
      setOutboundSeatsLoading(true);
      setOutboundError('');
      try {
        const res = await fetch(`/api/flights/${outboundFlightId}/seats`);
        const data = await res.json();
        setOutboundSeats(data.seats || []);
      } catch {
        setOutboundError('Failed to load outbound seat map.');
      }
      setOutboundSeatsLoading(false);
    }
    if (outboundFlightId) fetchSeats();
  }, [outboundFlightId]);

  // Return passengers/seats
  useEffect(() => {
    async function fetchPassengers() {
      setReturnPassengersLoading(true);
      try {
        const res = await fetch(`/api/bookings/${returnBookingId}/passengers`);
        const data = await res.json();
        setReturnPassengers(data.passengers || []);
      } catch {
        setReturnError('Failed to load return passengers.');
      } finally {
        setReturnPassengersLoading(false);
      }
    }
    if (returnBookingId) fetchPassengers();
  }, [returnBookingId]);

  useEffect(() => {
    async function fetchSeats() {
      setReturnSeatsLoading(true);
      setReturnError('');
      try {
        const res = await fetch(`/api/flights/${returnFlightId}/seats`);
        const data = await res.json();
        setReturnSeats(data.seats || []);
      } catch {
        setReturnError('Failed to load return seat map.');
      }
      setReturnSeatsLoading(false);
    }
    if (returnFlightId) fetchSeats();
  }, [returnFlightId]);

  // Robust seat grouping function
  function groupSeatsByRows(seats: Seat[]) {
    const map: { [row: string]: Seat[] } = {};
    seats.forEach((seat) => {
      const match = seat.seat_number.match(/^(\d+)/);
      const row = match ? match[1] : seat.seat_number;
      if (!map[row]) map[row] = [];
      map[row].push(seat);
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([row, seats]) => ({
        row,
        seats: seats.sort((a, b) => a.seat_number.localeCompare(b.seat_number)),
      }));
  }

  function handleSeatSelect(
    passengerId: string,
    seatNumber: string,
    selectedSeats: { [passengerId: string]: string },
    setSelectedSeats: React.Dispatch<React.SetStateAction<{ [passengerId: string]: string }>>
  ) {
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

  async function handleSubmitOutboundSeats(e: React.FormEvent) {
    e.preventDefault();
    setOutboundSubmitting(true);
    setOutboundError('');
    try {
      const seatNumbers = outboundPassengers.map((p) => selectedOutboundSeats[p.id]);
      if (seatNumbers.some((s) => !s)) {
        setOutboundError('Please select a seat for each passenger.');
        setOutboundSubmitting(false);
        return;
      }
      const res = await fetch(`/api/flights/${outboundFlightId}/seats/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumbers,
          bookingId: outboundBookingId,
          passengerIds: outboundPassengers.map((p) => p.id),
        }),
      });
      if (res.ok) {
        setStep(2);
      } else {
        const data = await res.json();
        setOutboundError(data.error || 'Something went wrong.');
      }
    } catch {
      setOutboundError('Failed to reserve seats.');
    } finally {
      setOutboundSubmitting(false);
    }
  }

  async function handleSubmitReturnSeats(e: React.FormEvent) {
    e.preventDefault();
    setReturnSubmitting(true);
    setReturnError('');
    try {
      const seatNumbers = returnPassengers.map((p) => selectedReturnSeats[p.id]);
      if (seatNumbers.some((s) => !s)) {
        setReturnError('Please select a seat for each passenger.');
        setReturnSubmitting(false);
        return;
      }
      const res = await fetch(`/api/flights/${returnFlightId}/seats/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumbers,
          bookingId: returnBookingId,
          passengerIds: returnPassengers.map((p) => p.id),
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(
            `/booking/round-trip/confirmation?outboundBookingId=${outboundBookingId}&returnBookingId=${returnBookingId}`
          );
        }, 1200);
      } else {
        const data = await res.json();
        setReturnError(data.error || 'Something went wrong.');
      }
    } catch {
      setReturnError('Failed to reserve seats.');
    } finally {
      setReturnSubmitting(false);
    }
  }

  // Outbound seat selection step
  if (step === 1) {
    if (outboundSeatsLoading || outboundPassengersLoading)
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
          <span className="text-lg font-semibold">Loading outbound seat map...</span>
        </motion.div>
      );
    if (outboundError)
      return (
        <motion.div
          className="text-red-600 text-center py-12"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {outboundError}
        </motion.div>
      );
    const seatsByRows = groupSeatsByRows(outboundSeats);

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
          Select Outbound Flight Seats
        </motion.h1>
        <motion.form
          onSubmit={handleSubmitOutboundSeats}
          className="space-y-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          {outboundPassengers.map((passenger, i) => (
            <motion.div
              key={passenger.id}
              className="mb-12 bg-blue-50 border border-blue-100 rounded-xl p-6 shadow"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
            >
              <div className="font-bold text-blue-900 mb-2">
                {passenger.first_name} {passenger.last_name}{' '}
                <span className="font-normal text-blue-600">
                  ({passenger.passenger_type})
                </span>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex flex-col">
                  {seatsByRows.map(({ row, seats }) => (
                    <div key={row} className="flex items-center mb-1">
                      <span className="w-8 text-right mr-3 text-xs text-gray-500">
                        {row}
                      </span>
                      {seats.map((seat) => (
                        <SeatButton
                          key={seat.seat_number}
                          seat={seat}
                          selected={selectedOutboundSeats[passenger.id] === seat.seat_number}
                          onClick={() =>
                            handleSeatSelect(
                              passenger.id,
                              seat.seat_number,
                              selectedOutboundSeats,
                              setSelectedOutboundSeats
                            )
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                Selected seat:{' '}
                <span className="font-mono font-semibold">
                  {selectedOutboundSeats[passenger.id] || (
                    <span className="text-blue-400">None</span>
                  )}
                </span>
              </div>
            </motion.div>
          ))}
          <div className="flex items-center gap-4">
            <motion.button
              type="submit"
              disabled={outboundSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold text-lg shadow hover:from-green-500 hover:to-blue-700 transition-all disabled:opacity-60"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {outboundSubmitting
                ? 'Reserving...'
                : 'Continue to Return Seat Selection'}
            </motion.button>
          </div>
          {outboundError && (
            <div className="text-red-600 mt-4">{outboundError}</div>
          )}
        </motion.form>
        <SeatLegend />
      </motion.div>
    );
  }

  // Return seat selection step
  if (step === 2) {
    if (returnSeatsLoading || returnPassengersLoading)
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
          <span className="text-lg font-semibold">Loading return seat map...</span>
        </motion.div>
      );
    if (returnError)
      return (
        <motion.div
          className="text-red-600 text-center py-12"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {returnError}
        </motion.div>
      );
    const seatsByRows = groupSeatsByRows(returnSeats);

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
          Select Return Flight Seats
        </motion.h1>
        <motion.form
          onSubmit={handleSubmitReturnSeats}
          className="space-y-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          {returnPassengers.map((passenger, i) => (
            <motion.div
              key={passenger.id}
              className="mb-12 bg-blue-50 border border-blue-100 rounded-xl p-6 shadow"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
            >
              <div className="font-bold text-blue-900 mb-2">
                {passenger.first_name} {passenger.last_name}{' '}
                <span className="font-normal text-blue-600">
                  ({passenger.passenger_type})
                </span>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex flex-col">
                  {seatsByRows.map(({ row, seats }) => (
                    <div key={row} className="flex items-center mb-1">
                      <span className="w-8 text-right mr-3 text-xs text-gray-500">
                        {row}
                      </span>
                      {seats.map((seat) => (
                        <SeatButton
                          key={seat.seat_number}
                          seat={seat}
                          selected={selectedReturnSeats[passenger.id] === seat.seat_number}
                          onClick={() =>
                            handleSeatSelect(
                              passenger.id,
                              seat.seat_number,
                              selectedReturnSeats,
                              setSelectedReturnSeats
                            )
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                Selected seat:{' '}
                <span className="font-mono font-semibold">
                  {selectedReturnSeats[passenger.id] || (
                    <span className="text-blue-400">None</span>
                  )}
                </span>
              </div>
            </motion.div>
          ))}
          <div className="flex items-center gap-4">
            <motion.button
              type="submit"
              disabled={returnSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold text-lg shadow hover:from-green-500 hover:to-blue-700 transition-all disabled:opacity-60"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {returnSubmitting ? 'Reserving...' : 'Finish Booking'}
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
          {returnError && (
            <div className="text-red-600 mt-4">{returnError}</div>
          )}
        </motion.form>
        <SeatLegend />
      </motion.div>
    );
  }

  return null;
}

// Loading component for Suspense fallback
function SeatSelectionLoading() {
  return (
    <motion.div
      className="container mx-auto p-6 flex justify-center items-center min-h-[50vh]"
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
        Loading seat selection...
      </motion.div>
    </motion.div>
  );
}

// Main export wrapped with Suspense
export default function RoundTripSeatSelectionPage() {
  return (
    <Suspense fallback={<SeatSelectionLoading />}>
      <RoundTripSeatSelectionContent />
    </Suspense>
  );
}