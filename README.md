# Flight Booking System

> Modern, full-stack web application for searching, booking, and managing flights—with real-time updates, offline support, and a beautiful user experience.

---

## ✈️ Overview

The **Flight Booking System** is a robust, production-ready web app designed for seamless flight search, booking, and management. Built with [Next.js](https://nextjs.org/), [React](https://react.dev/), and [Supabase](https://supabase.com/), it delivers a responsive, engaging, and secure end-to-end experience for travelers and admins alike.

**Key Features:**
- 🔐 User authentication and profile management (Supabase Auth)
- 🛫 Flight search with filters (airports, dates, passengers, class)
- 🧾 Booking flow: passenger info, seat selection, e-ticket, modification/cancellation
- 🔁 Round-trip and one-way bookings
- 🌐 Real-time flight status (Server-Sent Events)
- 📧 Email notifications for confirmations, cancellations, and status changes
- 📈 Admin dashboard: analytics, revenue, top routes, live status
- 📱 Fully responsive (mobile & desktop)
- 🏃‍♂️ Web Workers for heavy operations (large data sorting/filtering)
- 🗄️ IndexedDB offline search result caching
- 🧩 Reusable, animated UI components (Framer Motion, Tailwind CSS)
- ⚡ Modern code structure and API (TypeScript, RESTful endpoints)
- 🧪 Unit tests (Jest, React Testing Library)
- 🚀 One-click deployment to Vercel

---

## 📸 Demo

- **Live Demo:** [https://your-vercel-app-url.vercel.app/](https://your-vercel-app-url.vercel.app/)
- **Demo Account:**  
  Email: `demo@flightbooker.com`  
  Password: `demopassword123`

---

## 🔥 Features

### User Management
- **Sign up, login, password reset, and email verification (Supabase Auth)**
- **Profile management:** personal info, contact, payment methods

### Flight Search
- Filter by origin/destination, dates, passengers, cabin class
- One-way or round-trip selection
- Real-time seat availability
- Offline search result caching (IndexedDB)

### Booking Management
- Step-by-step booking (passenger details, seat selection, payment summary)
- E-ticket generation and download
- Booking modification/cancellation
- Booking history and details page

### Real-Time & Notifications
- **Server-Sent Events (SSE):** live flight status updates
- **Email notifications:** booking confirmation, cancellation, flight status change (Resend API)

### Admin Dashboard
- Data visualizations: bookings per day, revenue by class, top routes, live status
- View and search all flights/bookings

### Technical
- **SPA:** Next.js App Router (app directory), React Context API for state
- **IndexedDB:** for offline search result caching
- **Web Workers:** for sorting/filtering large flight datasets
- **Unit tests:** Jest & Testing Library (see `/src/__tests__`)
- **TypeScript-first, clean codebase**

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React 19, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **APIs:** REST (Next.js API routes), email (Resend), serverless functions
- **Offline:** IndexedDB (`idb-keyval`)
- **Performance:** Web Workers for heavy tasks
- **Testing:** (Optional) Jest, React Testing Library
- **Deployment:** Vercel
- **CI/CD:** (Optional) GitHub Actions

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/flight-booking-system.git
cd flight-booking-system
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=your-resend-api-key
```

- Get your keys from [Supabase Project Settings](https://app.supabase.com/project/_/settings/api)
- Get your [Resend](https://resend.com/) (email) API key

### 3. Database Setup

- Use the provided SQL schema (see `/schema.sql` or `/supabase/migrations/`)
- Or use the Supabase dashboard to import tables (see below for schema diagram)

### 4. Run Locally

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🚀 Deploy to Vercel

1. **Push your repo to GitHub**
2. **Go to [vercel.com/import](https://vercel.com/import) and import your repo**
3. **Set environment variables** (as above) in the Vercel dashboard
4. **Click Deploy**
5. **Done!** Your app will be live at `https://your-app-name.vercel.app`

---

## 🗄️ Database Schema

<details>
<summary>Click to view schema (PostgreSQL/Supabase)</summary>

```sql
-- Users: Supabase Auth (auth.users)
-- Profiles
create table public.profiles (
  id uuid not null primary key references auth.users(id),
  first_name varchar(100),
  last_name varchar(100),
  phone_number varchar(20),
  date_of_birth date,
  address text,
  payment_methods jsonb[] default '{}',
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Flights
create table public.flights (
  id uuid primary key,
  flight_number varchar not null,
  origin_id integer references airports(id),
  destination_id integer references airports(id),
  departure_time timestamptz not null,
  arrival_time timestamptz not null,
  base_price numeric not null,
  available_seats jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bookings
create table public.bookings (
  id uuid primary key,
  user_id uuid references auth.users(id),
  user_email varchar,
  flight_id uuid references flights(id),
  booking_status varchar default 'Pending',
  total_amount numeric not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Passengers
create table public.passengers (
  id uuid primary key,
  booking_id uuid references bookings(id),
  first_name varchar not null,
  last_name varchar not null,
  passenger_type varchar not null,
  date_of_birth date,
  passport_number varchar,
  cabin_class varchar not null,
  created_at timestamptz default now()
);

-- Seats
create table public.seats (
  id uuid primary key,
  flight_id uuid references flights(id),
  seat_number varchar not null,
  cabin_class varchar not null,
  status varchar default 'available',
  booking_id uuid,
  passenger_id uuid,
  unique(flight_id, seat_number)
);

-- Flight status updates
create table public.flight_status_updates (
  id uuid primary key,
  flight_id uuid references flights(id),
  status varchar not null,
  message text,
  delay_minutes integer default 0,
  gate varchar,
  updated_by varchar,
  created_at timestamptz default now()
);

-- Airports
create table public.airports (
  id serial primary key,
  code varchar(10) unique not null,
  name varchar not null,
  city varchar not null,
  country varchar not null,
  latitude numeric,
  longitude numeric
);
```
</details>

---

## 🗺️ System Architecture

- **Frontend:** Next.js SPA, React Context API, Framer Motion
- **Backend:** Supabase (DB, Auth, Storage, Realtime) + Next.js API routes (custom logic, email, SSE)
- **Realtime:** SSE endpoint for live flight status pushed to all connected clients
- **Offline:** IndexedDB caching for flight search, Web Workers for sorting/filtering
- **Emails:** Resend API for transactional messages

![System Architecture Diagram](./docs/architecture-diagram.png)
*(You can generate this diagram in draw.io/Excalidraw and export here)*

---

## 📝 API Documentation

- All custom REST endpoints documented in `/docs/api.md` (Swagger or Markdown)
- Example endpoints:

| Method | Endpoint                              | Description                    |
|--------|---------------------------------------|--------------------------------|
| POST   | `/api/flights/search`                 | Search for flights             |
| POST   | `/api/bookings`                       | Create new booking             |
| PATCH  | `/api/bookings/:id`                   | Cancel or update booking       |
| GET    | `/api/flights/:flightId/seats`        | Get seat map for flight        |
| POST   | `/api/flights/:flightId/seats/select` | Assign seats to passengers     |
| GET    | `/api/bookings/history`               | Get user booking history       |
| ...    | ...                                   | See full API docs              |

---

## 🧪 Testing

- Unit and integration tests with Jest and React Testing Library
- To run tests:
  ```bash
  npm test
  ```
- (See `/src/__tests__/` for examples)

---

## 🗃️ Project Structure

```
frontend/
  ├── src/
  │   ├── app/          # Next.js app directory (pages, API routes)
  │   ├── components/   # UI components
  │   ├── contexts/     # React Context Providers
  │   ├── hooks/        # Custom hooks (Auth, SSE, etc.)
  │   ├── lib/          # Supabase clients, utils
  │   ├── types/        # TypeScript types
  │   ├── utils/        # Utility functions (IndexedDB, email, etc.)
  │   └── workers/      # Web Workers (flight sorting)
  ├── public/
  ├── .env.local
  └── package.json
```

---

## 🚦 Deployment & Setup

**Deploy to Vercel:**
1. Push to GitHub
2. Import repo on [Vercel](https://vercel.com/)
3. Set environment variables
4. Deploy (auto/CI)

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

**Other Notes:**
- For email, configure [Resend](https://resend.com/) domain if needed
- Supabase project must have all tables/migrations applied

---

## 🎤 Demo Presentation

- 15-minute walkthrough:
  - Flight search (offline/online, fast filtering)
  - Booking (one-way & round-trip)
  - Seat selection, e-ticket, booking history
  - Real-time status (live, SSE, admin update)
  - Dashboard (analytics, status, routes)
  - Profile management
  - Tech highlights: IndexedDB, Web Workers, SSE, modular code, deployment
  - Q&A

---

## 👤 Author

- **Ashwath Saxena**  
  [GitHub](https://github.com/Ashwath-saxena)

---

## 📄 License

This project is licensed under the MIT License.

---

*Built with ❤️ using Next.js, Supabase, and modern web tech.*
