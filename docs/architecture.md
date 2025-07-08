# System Architecture – Flight Booking System

## **Component Overview**

```
+--------------------+      +-----------------------------+      +-----------------------+
|   User Browser     | <==> |  Next.js Frontend (React)   | <==> |   Supabase Backend    |
| (SPA: Search/Book) |      | - Pages, API Routes (REST)  |      | - PostgreSQL Database |
|                    |      | - Context, State, Workers   |      | - Auth, Storage       |
+--------------------+      +-----------------------------+      +-----------------------+
        |                             |                                   |
        |  IndexedDB (offline cache)  |                                   |
        |  Web Workers (sorting)      |                                   |
        |                             |                                   |
        |         SSE (flight status) |<------[SSE endpoint]--------------|
        |<--------/api/flights/status |                                   |
        |                             |                                   |
        |         RESTful API Calls   |<-------[REST API]-----------------|
        |<--------/api/flights/...    |                                   |
        |<--------/api/bookings/...   |                                   |
        |                             |                                   |
        |         Email Notifications |<------[Resend API]----------------|
        |                             |                                   |
        |         Real-time updates   |<------[Supabase Realtime]---------|
        |                             |                                   |
```

**Key Flows:**
- User interacts with a modern SPA (Next.js w/ App Router)
- API routes in Next.js handle business logic, integrate with Supabase, and expose REST endpoints
- Supabase handles persistent data (PostgreSQL), auth (users & sessions), and file storage
- Real-time flight status via SSE endpoints (custom API route) and/or Supabase Realtime (for live updates)
- Web Workers for computationally heavy tasks (flight filtering, sorting)
- IndexedDB for caching flight search results (offline support)
- Email notifications (booking confirmation, status updates) sent via Resend API from backend
- Admin dashboard consumes same APIs for analytics & management

---

## **Deployment Overview**

- **Frontend/Backend:** Deployed as a single Next.js (serverless) app on Vercel
- **Supabase:** Managed cloud backend for DB/Auth/Storage/Realtime
- **Custom Domain:** Optional (Vercel supports custom domains)
- **Environment Variables:** Securely managed in Vercel dashboard

---

## **Security**

- All sensitive endpoints protected via Supabase Auth (middleware)
- No direct DB credentials exposed to client; all business logic via API routes/serverless functions
- CORS, CSRF, and session handling managed by Next.js and Supabase

---

## **Scalability**

- Stateless frontend (serverless scaling via Vercel)
- Backend is serverless (API routes) + scalable Supabase/Postgres
- IndexedDB and Web Workers ensure smooth UX even with large datasets

---

## **Extensibility**

- Add more analytics, admin features, notification channels (SMS, WhatsApp)
- Integrate payments, airline APIs, loyalty programs, etc.

---

*For a visual diagram, use draw.io or Excalidraw and export as PNG/SVG for your docs/presentation.*
