# API Documentation – Flight Booking System

> **Base URL:**  
> For local dev: `http://localhost:3000/api/`  
> For production: `https://your-vercel-app-url.vercel.app/api/`

---

## Table of Contents

- [Authentication](#authentication)
- [Airports](#airports)
- [Flights](#flights)
- [Bookings](#bookings)
- [Passengers](#passengers)
- [Seats](#seats)
- [Profiles](#profiles)
- [Flight Status (Realtime)](#flight-status-realtime)
- [Dashboard / Analytics](#dashboard--analytics)
- [Error Handling](#error-handling)
- [Common Response Codes](#common-response-codes)

---

## Authentication

**Authentication is required for most endpoints.**  
Use Supabase Auth (JWT in cookies).  
See `/auth/login`, `/auth/register`, `/auth/forgot-password` for browser-based flows.

---

## Airports

### `GET /airports/cities`

**Description:** List all unique airport cities (for search dropdowns).

**Response:**
```json
{
  "cities": ["Bangalore", "Delhi", "Mumbai", ...]
}
```

---

## Flights

### `POST /flights/search`

**Description:** Search for flights by filters.

**Request Body:**
```json
{
  "origin": "Bangalore",
  "destination": "Delhi",
  "departureDate": "2025-07-10",
  "returnDate": "2025-07-15", // (optional, for round-trip)
  "tripType": "one-way" | "round-trip",
  "adults": 1,
  "children": 0,
  "infants": 0,
  "cabinClass": "Economy" | "Premium Economy" | "Business" | "First"
}
```

**Response:**
```json
{
  "outboundFlights": [ ... ],
  "returnFlights": [ ... ], // only for round-trip
  "params": { ... }
}
```

---

### `GET /flights/:flightId`

**Description:** Get detailed flight information.

**Query Params:**  
- `cabinClass` (optional): for price/availability per class.

**Response:**
```json
{
  "id": "...",
  "flight_number": "...",
  "airline": "...",
  "departure_airport": "...",
  "arrival_airport": "...",
  "departure_time": "...",
  "arrival_time": "...",
  "duration": "...",
  "price": 5000,
  "cabin_class": "Economy",
  "available_seats": 40
}
```

---

### `GET /flights/:flightId/seats`

**Description:** Get seat map for a flight.

**Response:**
```json
{
  "seats": [
    {
      "id": "...",
      "seat_number": "12A",
      "cabin_class": "Economy",
      "status": "available" | "booked",
      "booking_id": "...",
      "passenger_id": "..."
    },
    ...
  ]
}
```

---

### `POST /flights/:flightId/seats/select`

**Description:** Reserve seats for passengers.

**Request Body:**
```json
{
  "seatNumbers": ["12A", "12B"],
  "bookingId": "...",
  "passengerIds": ["...", "..."]
}
```
**Response:**
```json
{ "success": true }
```

---

### `GET /flights/:flightId/status`

**Description:** Get current flight status (requires auth).

**Response:**
```json
{
  "flightId": "...",
  "status": {
    "status": "Scheduled",
    "message": "Flight is on schedule",
    "color": "green",
    "estimatedDeparture": "...",
    "estimatedArrival": "...",
    "delay": 0,
    "gate": "A12",
    "lastUpdated": "...",
    "updatedBy": "admin@airline.com"
  },
  "flight": { ... }
}
```

---

### `POST /flights/:flightId/status`

**Description:** Update flight status (admin only).

**Request Body:**
```json
{
  "status": "Delayed",
  "delay": 15,
  "gate": "B2",
  "message": "Delayed due to weather"
}
```
**Response:**
```json
{ "success": true }
```

---

### `GET /flights/status`

**Description:**  
**Server-Sent Events (SSE)** endpoint for real-time flight status.  
**Use:**  
`/flights/status?flightId=...`  
- Returns live updates as SSE stream.

---

## Bookings

### `POST /bookings`

**Description:** Create a new booking (one-way or round-trip).

**Request Body:**
```json
{
  "flightId": "...",
  "cabinClass": "Economy",
  "passengers": {
    "adults": 1, "children": 0, "infants": 0, "total": 1
  },
  "passengerInfo": {
    "firstName": "Ashwath",
    "lastName": "Saxena",
    "email": "user@example.com",
    "phone": "...",
    "dateOfBirth": "2002-01-02",
    "passportNumber": "A1234567"
  },
  "totalAmount": 7000,
  "userId": "..."
}
```

**Response:**
```json
{
  "id": "...",
  "status": "Pending",
  "message": "Booking created successfully",
  "bookingDate": "2025-07-08T10:02:06Z"
}
```

---

### `PATCH /bookings/:id`

**Description:** Cancel a booking.

**Request Body:**
```json
{
  "bookingId": "..."
}
```
**Response:**
```json
{
  "status": "Cancelled",
  "message": "Booking cancelled successfully."
}
```

---

### `GET /bookings/history`

**Description:** Get all bookings for authenticated user.

**Response:**
```json
{
  "bookings": [
    {
      "id": "...",
      "booking_status": "Confirmed",
      "flight": { ... },
      "passengers": [ ... ],
      ...
    }
  ]
}
```

---

### `POST /bookings/cancel`

**Description:** Cancel a booking (alternative RPC).

**Request Body:**
```json
{ "bookingId": "..." }
```
**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "bookingId": "..."
}
```

---

## Passengers

### `GET /bookings/:bookingId/passengers`

**Description:** Get passenger list for a booking.

**Response:**
```json
{
  "passengers": [
    {
      "id": "...",
      "first_name": "...",
      "last_name": "...",
      "passenger_type": "Adult"
    },
    ...
  ]
}
```

---

## Profiles

### `GET /profile?id=...`

**Description:** Get profile by user id.

**Response:**
```json
{
  "profile": {
    "id": "...",
    "first_name": "...",
    "last_name": "...",
    "phone_number": "...",
    "date_of_birth": "...",
    "address": "...",
    "payment_methods": [],
    "preferences": {},
    "email": "..."
  }
}
```

### `PUT /profile/update`

**Description:** Update user profile.

**Request Body:**
```json
{
  "id": "...",
  "first_name": "...",
  "last_name": "...",
  "phone_number": "...",
  "date_of_birth": "...",
  "address": "..."
}
```
**Response:**
```json
{ "message": "Profile updated" }
```

---

## Dashboard / Analytics

### `GET /dashboard/summary`

**Description:** Get system summary stats.

**Response:**
```json
{
  "totalBookings": 131,
  "totalRevenue": 540000,
  "activeFlights": 15,
  "totalUsers": 102,
  "totalFlights": 38
}
```

### `GET /dashboard/bookings-per-day`

**Description:** Get bookings count per day (last 30 days).

**Response:**
```json
{
  "bookingsPerDay": [
    { "date": "2025-07-01", "count": 2 },
    ...
  ]
}
```

### `GET /dashboard/revenue-per-class`

**Description:** Get revenue by cabin class.

**Response:**
```json
{
  "revenueByClass": {
    "Economy": 12000,
    "Business": 40000,
    ...
  }
}
```

### `GET /dashboard/top-routes`

**Description:** Get top 5 most popular routes.

**Response:**
```json
{
  "topRoutes": [
    { "route": "Bangalore (BLR) → Delhi (DEL)", "count": 20 },
    ...
  ]
}
```

### `GET /dashboard/flight-status-counts`

**Description:** Get count of flights by current live status.

**Response:**
```json
{
  "statusCounts": {
    "Scheduled": 10,
    "Delayed": 2,
    ...
  }
}
```

---

## Error Handling

- All error responses use consistent JSON:
```json
{ "error": "Error message here" }
```

- 401 Unauthorized for missing/invalid auth
- 400 Bad Request for missing/invalid parameters
- 404 Not Found for missing resources
- 500 Internal Server Error for unexpected errors

---

## Common Response Codes

| Code | Meaning              |
|------|----------------------|
| 200  | Success              |
| 201  | Created              |
| 204  | No content           |
| 400  | Bad request          |
| 401  | Unauthorized         |
| 403  | Forbidden            |
| 404  | Not found            |
| 409  | Conflict             |
| 500  | Internal server error|

---

## SSE Example (Flight Status)

**Request:**
```
GET /api/flights/status?flightId=...   (Accept: text/event-stream)
```
**Response:**  
- Stream of events; each event is a JSON blob
```json
{
  "type": "flight_status",
  "flightId": "...",
  "status": { ... },
  "timestamp": "2025-07-08T10:02:06Z"
}
```
---

## Contact

For questions, open an [issue](https://github.com/yourusername/flight-booking-system/issues) or contact the author.

---