// frontend/src/utils/types.ts
export interface FlightDetails {
  id: string; // Add this line
  flight_number: string;
  airline: string;
  departure_time: string;
  arrival_time: string;
  origin: {
    code: string;
    city: string;
  };
  destination: {
    code: string;
    city: string;
  };
}

export interface PassengerDetails {
  first_name: string;
  last_name: string;
  passenger_type: string;
  cabin_class: string;
}

export interface BookingDetails {
  id: string;
  booking_status: string;
  total_amount: number;
  booking_date: string;
  flight: FlightDetails;
  passengers: PassengerDetails[];
}

export interface EmailData {
  booking: BookingDetails;
  userEmail: string;
}

// Additional types for booking system
export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
}

export interface Flight {
  id: string;
  flight_number: string;
  airline: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  available_seats: Record<string, number>;
  origin: Airport;
  destination: Airport;
}

export interface Passenger {
  id?: string;
  first_name: string;
  last_name: string;
  passenger_type: 'Adult' | 'Child' | 'Infant';
  cabin_class: 'Economy' | 'Business' | 'First';
}

export interface Booking {
  id: string;
  user_id: string;
  flight_id: string;
  booking_status: 'Confirmed' | 'Pending' | 'Cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  flight: Flight;
  passengers: Passenger[];
}

// Flight Status types
export interface FlightStatus {
  status: string;
  message: string;
  color: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  delay?: number;
  gate?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

export interface FlightStatusUpdate {
  type: 'connected' | 'flight_status' | 'flight_update';
  flightId?: string;
  status?: FlightStatus;
  update?: Partial<FlightStatus>;
  timestamp: string;
  user?: string;
  updatedBy?: string;
}

export interface FlightStatusUpdateEmailData {
  userEmail: string;
  userName: string;
  flightNumber: string;
  flightId: string;
  bookingId: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  statusUpdate: {
    previousStatus?: string;
    newStatus: string;
    message: string;
    delay?: number;
    gate?: string;
    updatedBy: string;
    timestamp: string;
  };
}