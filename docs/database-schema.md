# Database Schema – Flight Booking System

## Entity-Relationship Overview

The schema supports user management, airport and flight management, passenger handling, seat assignment, real-time status, and booking workflows.

---

## **Schema Diagram (Textual)**

```
auth.users (Supabase Auth)
   │
   └───┬───────────────┐
       │               │
profiles            bookings
       │                │
       │                ├── passengers
       │                │
       │                └── seats
       │
flights ──┬── seats
          ├── bookings
          └── flight_status_updates
     ▲             ▲
     │             │
airports <--- flights (origin_id, destination_id)
```

---

## **Table Definitions**

### 1. `airports`
```sql
create table public.airports (
  id serial primary key,
  code varchar(3) unique not null,
  name varchar(100) not null,
  city varchar(100) not null,
  country varchar(100) not null,
  latitude numeric(10,8),
  longitude numeric(11,8)
);
```

---

### 2. `flights`
```sql
create table public.flights (
  id uuid primary key default extensions.uuid_generate_v4(),
  flight_number varchar(10) not null,
  origin_id integer references airports(id),
  destination_id integer references airports(id),
  departure_time timestamptz not null,
  arrival_time timestamptz not null,
  base_price numeric(10,2) not null,
  available_seats json not null,  -- { "Economy": 80, "Business": 20, ... }
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);
```

---

### 3. `bookings`
```sql
create table public.bookings (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id),
  flight_id uuid references flights(id),
  booking_status public.booking_status default 'Pending',
  total_amount numeric(10,2) not null,
  booking_date timestamptz default current_timestamp,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  user_email varchar(255) not null
);
```

---

### 4. `passengers`
```sql
create table public.passengers (
  id uuid primary key default extensions.uuid_generate_v4(),
  booking_id uuid references bookings(id),
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  passenger_type public.passenger_type not null,
  date_of_birth date not null,
  passport_number varchar(20),
  cabin_class public.cabin_class not null,
  created_at timestamptz default current_timestamp
);
```

---

### 5. `seats`
```sql
create table public.seats (
  id uuid primary key default extensions.uuid_generate_v4(),
  flight_id uuid not null references flights(id) on delete cascade,
  seat_number varchar(10) not null,
  cabin_class public.cabin_class not null,
  status varchar(20) not null default 'available',
  booking_id uuid references bookings(id) on delete set null,
  passenger_id uuid references passengers(id) on delete set null,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  unique(flight_id, seat_number)
);
```

---

### 6. `profiles`
```sql
create table public.profiles (
  id uuid primary key references auth.users(id),
  first_name varchar(100),
  last_name varchar(100),
  phone_number varchar(20),
  date_of_birth date,
  address text,
  payment_methods jsonb[] default array[]::jsonb[],
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  email varchar(255)
);
```

---

### 7. `flight_status_updates`
```sql
create table public.flight_status_updates (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references flights(id) on delete cascade,
  status varchar(50) not null,
  message text not null,
  delay_minutes integer default 0,
  gate varchar(10),
  updated_by varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_flight_status_updates_flight_id on public.flight_status_updates(flight_id);
create index idx_flight_status_updates_created_at on public.flight_status_updates(created_at desc);
```

---

### 8. **Enums (in Supabase)**
```sql
create type public.booking_status as enum ('Pending', 'Confirmed', 'Cancelled');
create type public.passenger_type as enum ('Adult', 'Child', 'Infant');
create type public.cabin_class as enum ('Economy', 'Premium Economy', 'Business', 'First');
```

---

## **Triggers**
- All major tables use an `update_*_updated_at` trigger to maintain `updated_at` timestamps.

---

## **Relationships**
- `bookings.user_id` → `auth.users.id`
- `bookings.flight_id` → `flights.id`
- `flights.origin_id` & `flights.destination_id` → `airports.id`
- `passengers.booking_id` → `bookings.id`
- `seats.flight_id` → `flights.id`
- `seats.booking_id` → `bookings.id`
- `seats.passenger_id` → `passengers.id`
- `profiles.id` → `auth.users.id`
- `flight_status_updates.flight_id` → `flights.id`

---

## **Indexes**
- All primary/foreign keys indexed.
- Explicit indexes on `flight_status_updates` for efficient status/history lookups.

---

## **Notes**
- User authentication is handled via Supabase Auth (`auth.users`).
- All amounts are stored as `numeric` (supports currency, precision).
- Seats are assigned per flight/booking/passenger, and support multi-class cabins.
- All timestamps use UTC (`timestamptz`).
- Email is stored in both `profiles` and `bookings` for convenience and audit.

---
