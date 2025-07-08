// frontend/src/app/booking/confirmation/[bookingId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/supabaseBrowserClient";
import { format } from "date-fns";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { sendServerEmail } from "@/app/actions/email";
import FlightStatus from "@/components/FlightStatus";
import { motion, AnimatePresence } from "framer-motion";

type BookingDetails = {
  id: string;
  booking_status: string;
  total_amount: number;
  created_at: string;
  flight: {
    id: string;
    flight_number: string;
    airline: string;
    departure_time: string;
    arrival_time: string;
    base_price: number;
    available_seats: Record<string, number>;
    origin: {
      code: string;
      name: string;
      city: string;
    };
    destination: {
      code: string;
      name: string;
      city: string;
    };
  };
  passengers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    passenger_type: string;
    cabin_class: string;
  }>;
};

type PassengerWithSeat = {
  id: string;
  first_name: string;
  last_name: string;
  passenger_type: string;
  cabin_class: string;
  seat_number?: string | null;
};

type ErrorResponse = {
  message: string;
};

const CURRENT_TIMESTAMP = "2025-07-07 08:56:36";
const CURRENT_USER = "Ashwath-saxena";

export default function BookingConfirmationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [passengerSeats, setPassengerSeats] = useState<PassengerWithSeat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [flightIdCopied, setFlightIdCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError("Booking ID is missing");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
            *,
            flight:flights!bookings_flight_id_fkey(
              id,
              flight_number,
              departure_time,
              arrival_time,
              base_price,
              available_seats,
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
          `
          )
          .eq("id", bookingId)
          .single();

        if (error) throw error;

        if (data.user_id !== user.id) {
          throw new Error("You are not authorized to view this booking");
        }

        setBooking({
          ...data,
          flight: {
            ...data.flight,
            airline: "Flight Booker Airways",
          },
        } as BookingDetails);
      } catch (err) {
        const typedError = err as ErrorResponse;
        setError(typedError.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, router, user]);

  useEffect(() => {
    if (!bookingId || !user) return;
    async function fetchPassengerSeats() {
      const { data: passengers, error: passengersError } = await supabase
        .from("passengers")
        .select("id, first_name, last_name, passenger_type, cabin_class")
        .eq("booking_id", bookingId);

      if (passengersError) {
        setPassengerSeats([]);
        return;
      }

      const { data: seats, error: seatsError } = await supabase
        .from("seats")
        .select("seat_number, passenger_id")
        .eq("booking_id", bookingId);

      if (seatsError) {
        setPassengerSeats(passengers as PassengerWithSeat[]);
        return;
      }

      const seatMap: Record<string, string> = {};
      (seats || []).forEach((s) => {
        if (s.passenger_id) seatMap[s.passenger_id] = s.seat_number;
      });

      const passengersWithSeats = (passengers || []).map((p) => ({
        ...p,
        seat_number: seatMap[p.id] || null,
      }));

      setPassengerSeats(passengersWithSeats);
    }
    fetchPassengerSeats();
  }, [bookingId, user]);

  const copyFlightId = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.flight.id);
    setFlightIdCopied(true);
    toast.success("Flight Tracking ID copied!");
    setTimeout(() => setFlightIdCopied(false), 3000);
  };

  const handleCancelBooking = async () => {
    if (
      !booking ||
      !user ||
      !confirm(
        "Are you sure you want to cancel this booking? This action cannot be undone."
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      const { data: bookingData } = await supabase
        .from("bookings")
        .select(
          `
          *,
          flight:flights(available_seats),
          passengers(cabin_class)
        `
        )
        .eq("id", bookingId)
        .single();

      if (!bookingData) throw new Error("Booking not found");

      const seatsByClass: Record<string, number> = {};
      bookingData.passengers.forEach((passenger: { cabin_class: string }) => {
        const cabinClass = passenger.cabin_class;
        seatsByClass[cabinClass] = (seatsByClass[cabinClass] || 0) + 1;
      });

      const updatedSeats = { ...bookingData.flight.available_seats };
      Object.entries(seatsByClass).forEach(([cabinClass, count]) => {
        updatedSeats[cabinClass] = (updatedSeats[cabinClass] || 0) + count;
      });

      const { error: updateError } = await supabase.rpc("cancel_booking", {
        p_booking_id: bookingId,
        p_updated_seats: updatedSeats,
      });

      if (updateError) throw updateError;

      const emailResult = await sendServerEmail(
        {
          booking: {
            id: booking.id,
            booking_status: "Cancelled",
            total_amount: booking.total_amount,
            booking_date: new Date(CURRENT_TIMESTAMP).toISOString(),
            flight: {
              id: booking.flight.id,
              flight_number: booking.flight.flight_number,
              airline: booking.flight.airline || "Flight Booker Airways",
              departure_time: booking.flight.departure_time,
              arrival_time: booking.flight.arrival_time,
              origin: {
                code: booking.flight.origin.code,
                city: booking.flight.origin.city,
              },
              destination: {
                code: booking.flight.destination.code,
                city: booking.flight.destination.city,
              },
            },
            passengers: booking.passengers.map((p) => ({
              first_name: p.first_name,
              last_name: p.last_name,
              passenger_type: p.passenger_type,
              cabin_class: p.cabin_class,
            })),
          },
          userEmail: user.email || "",
        },
        "cancellation"
      );

      if (!emailResult.success) {
        console.error("Failed to send cancellation email:", emailResult.error);
      }

      setBooking((prev) =>
        prev
          ? {
              ...prev,
              booking_status: "Cancelled",
            }
          : null
      );

      toast.success("Booking cancelled successfully");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const generateETicket = () => {
    if (!booking) return;

    const ticketWindow = window.open("", "_blank");
    if (!ticketWindow) return;

    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>E-Ticket - ${booking.flight.airline} ${booking.flight.flight_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .ticket { border: 1px solid #ccc; padding: 20px; max-width: 800px; margin: 0 auto; position: relative; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .flight-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .passenger-list { margin-top: 20px; }
          .passenger { border-bottom: 1px solid #eee; padding: 10px 0; }
          .barcode { margin-top: 30px; text-align: center; }
          .logo { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .timestamp { position: absolute; top: 20px; right: 20px; font-size: 12px; color: #666; }
          .tracking-section { background: #f0f8ff; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc; }
          .tracking-id { font-family: monospace; background: white; padding: 8px; border: 1px dashed #0066cc; display: inline-block; margin: 5px 0; word-break: break-all; }
          ${booking.booking_status === "Cancelled" ? ".cancelled { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72px; color: red; border: 10px solid red; padding: 20px; opacity: 0.7; }" : ""}
          @media print {
            body { margin: 0; }
            .ticket { border: none; }
            .timestamp { position: fixed; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          ${booking.booking_status === "Cancelled" ? '<div class="cancelled">CANCELLED</div>' : ""}
          <div class="timestamp">Generated: ${CURRENT_TIMESTAMP} UTC by ${CURRENT_USER}</div>
          <div class="logo">✈️ Flight Booker</div>
          <div class="header">
            <h1>E-Ticket / Boarding Pass</h1>
            <p>Booking Reference: ${booking.id}</p>
            <p>Booking Date: ${format(new Date(booking.created_at), "MMMM d, yyyy")}</p>
            <p>Status: <strong>${booking.booking_status}</strong></p>
          </div>
          
          <div class="tracking-section">
            <h3>📱 Track Your Flight Real-time</h3>
            <p><strong>Flight Tracking ID:</strong></p>
            <div class="tracking-id">${booking.flight.id}</div>
            <p><small>Use this ID to track real-time flight status, delays, and gate changes</small></p>
          </div>
          
          <div class="flight-info">
            <div>
              <h2>${booking.flight.airline} ${booking.flight.flight_number}</h2>
              <p><strong>From:</strong> ${booking.flight.origin.city} (${booking.flight.origin.code})</p>
              <p><strong>To:</strong> ${booking.flight.destination.city} (${booking.flight.destination.code})</p>
            </div>
            <div>
              <p><strong>Departure:</strong> ${format(new Date(booking.flight.departure_time), "MMM d, yyyy h:mm a")}</p>
              <p><strong>Arrival:</strong> ${format(new Date(booking.flight.arrival_time), "MMM d, yyyy h:mm a")}</p>
            </div>
          </div>
          
          <div class="passenger-list">
            <h3>Passengers</h3>
            ${passengerSeats
              .map(
                (passenger) => `
              <div class="passenger">
                <p><strong>${passenger.first_name} ${passenger.last_name}</strong></p>
                <p>Type: ${passenger.passenger_type}</p>
                <p>Class: ${passenger.cabin_class}</p>
                <p>Seat: ${passenger.seat_number || "Not assigned"}</p>
              </div>
            `
              )
              .join("")}
          </div>
          
          <div class="barcode">
            <p>*** This is your electronic ticket. Please present this along with a valid ID at the airport. ***</p>
            <p>Booking ID: ${booking.id}</p>
            <p>Total Amount Paid: ₹${booking.total_amount.toLocaleString()}</p>
            <p><small>Generated by: ${CURRENT_USER}</small></p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    ticketWindow.document.write(ticketHtml);
    ticketWindow.document.close();
  };

  if (loading) {
    return (
      <motion.div
        className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-[50vh]"
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
          Loading booking details...
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="max-w-4xl mx-auto p-6"
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
        <button
          onClick={() => router.push("/bookings")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          View All Bookings
        </button>
      </motion.div>
    );
  }

  if (!booking) {
    return (
      <motion.div
        className="max-w-4xl mx-auto p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-xl text-red-600"
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Booking not found
        </motion.div>
        <button
          onClick={() => router.push("/bookings")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          View All Bookings
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      <Toaster position="top-center" />

      <AnimatePresence>
        {booking.booking_status === "Confirmed" && (
          <motion.div
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.3 }}
          >
            <svg
              className="w-6 h-6 text-green-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-green-800 font-medium">
              Booking confirmed successfully!
            </span>
          </motion.div>
        )}

        {booking.booking_status === "Cancelled" && (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.3 }}
          >
            <svg
              className="w-6 h-6 text-red-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="text-red-800 font-medium">
              This booking has been cancelled
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h1
        className="text-3xl font-extrabold mb-8 text-blue-800 text-center"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Booking Details
      </motion.h1>

      <motion.div
        className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="font-medium text-blue-900 mb-2 flex items-center">
          📱 Track Your Flight Real-time
          <div className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </h3>
        <p className="text-blue-700 text-sm mb-2">
          Use this Flight Tracking ID to get real-time updates on delays, gate changes, and boarding status:
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="bg-white px-3 py-2 rounded border font-mono text-sm flex-1 min-w-0 break-all text-blue-800">
            {booking.flight.id}
          </code>
          <button
            onClick={copyFlightId}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              flightIdCopied 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {flightIdCopied ? '✓ Copied!' : 'Copy ID'}
          </button>
          <Link
            href={`/flight-status?flightId=${booking.flight.id}`}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
          >
            Track Now
          </Link>
        </div>
        <p className="text-blue-600 text-xs mt-1">
          💡 Bookmark the tracking page or save this ID for quick access to real-time updates
        </p>
      </motion.div>

      <motion.div
        className="bg-white shadow rounded-lg overflow-hidden mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.3 }}
      >
        <div className="p-6 border-b">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-semibold">Booking Reference</h2>
              <p className="text-gray-700">{booking.id}</p>
            </div>
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  booking.booking_status === "Confirmed"
                    ? "bg-green-100 text-green-800"
                    : booking.booking_status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {booking.booking_status}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Booked on {format(new Date(booking.created_at), "MMMM d, yyyy")} by {CURRENT_USER}
          </p>
        </div>

        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">Flight Details</h2>
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <div className="text-xl font-medium">
                {booking.flight.airline} {booking.flight.flight_number}
              </div>
              <div className="flex items-center mt-2">
                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    {booking.flight.origin.code}
                  </div>
                  <div className="text-lg font-medium">
                    {format(new Date(booking.flight.departure_time), "h:mm a")}
                  </div>
                  <div className="text-sm">
                    {format(
                      new Date(booking.flight.departure_time),
                      "MMM d, yyyy"
                    )}
                  </div>
                </div>
                <div className="mx-4 flex-grow">
                  <div className="border-t-2 border-gray-300 relative">
                    <div className="absolute -mt-1.5 -ml-2">
                      <svg
                        className="h-3 w-3 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="12" />
                      </svg>
                    </div>
                    <div className="absolute -mt-1.5 right-0 -mr-2">
                      <svg
                        className="h-3 w-3 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="12" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-gray-600 text-xs text-center mt-1">
                    Direct Flight
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    {booking.flight.destination.code}
                  </div>
                  <div className="text-lg font-medium">
                    {format(new Date(booking.flight.arrival_time), "h:mm a")}
                  </div>
                  <div className="text-sm">
                    {format(
                      new Date(booking.flight.arrival_time),
                      "MMM d, yyyy"
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 md:text-right">
              <div className="text-gray-600 text-sm">Total Price</div>
              <div className="text-xl font-bold">
                ₹{booking.total_amount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-b bg-blue-50">
          <FlightStatus
            flightId={booking.flight.id}
            flightNumber={booking.flight.flight_number}
            showAdminControls={user?.email?.includes('ashwath')}
          />
        </div>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Passenger Information</h2>
          <div className="divide-y">
            {passengerSeats.map((passenger, index) => (
              <div key={index} className="py-3 first:pt-0 last:pb-0 flex justify-between">
                <div>
                  <div className="font-medium">
                    {passenger.first_name} {passenger.last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {passenger.passenger_type}
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  {passenger.cabin_class}
                  {passenger.seat_number && (
                    <span className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 font-mono">
                      Seat {passenger.seat_number}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <motion.button
          onClick={generateETicket}
          className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Generate E-Ticket
        </motion.button>
        <div className="flex gap-4">
          {booking.booking_status !== "Cancelled" && (
            <motion.button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="border border-red-300 hover:bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold transition disabled:opacity-60"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {cancelling ? "Cancelling..." : "Cancel Booking"}
            </motion.button>
          )}
          <Link
            href="/bookings"
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-bold transition text-center"
          >
            View All Bookings
          </Link>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-gray-500">
        Last updated: {CURRENT_TIMESTAMP} UTC by {CURRENT_USER}
      </div>
    </motion.div>
  );
}