# University Schedule — Lecture Timetable Scheduling System

A full-stack MERN application that automatically generates conflict-free lecture
timetables using a **Constraint Satisfaction Problem (CSP) solved with Backtracking
Search**, with role-based dashboards for Admins, Lecturers, and Students.

---

## 1. What's fully implemented

**Backend (Node.js / Express / MongoDB / Socket.IO)**
- JWT authentication with bcrypt password hashing, RBAC middleware (`admin` / `lecturer` / `student`)
- **Public self-registration for all three roles**: anyone can create an Admin, Lecturer, or Student account via
  `POST /api/auth/register`. The account is active immediately and the endpoint logs the user straight in
  (returns a token, same as `/login`), so the frontend takes them directly to their role's dashboard - no
  approval step in between. Admins can still deactivate any account later from the Users page.
- MVC architecture: `models/ → controllers/ → routes/`, generic CRUD factory for reference-data resources
- **CSP + Backtracking scheduling engine** (`services/schedulerService.js`) — deterministic, MRV-ordered,
  hard constraints for lecturer/venue/student clashes and room capacity, with graceful degradation and a
  standalone `detectClashes()` validator for manual edits
- Full REST API: auth, users, courses (+ lecturer assignment), faculties/departments/programmes/levels,
  venues/time-slots, academic sessions/semesters, timetable generate/publish/edit, notifications, analytics,
  activity logs
- Real-time notifications over Socket.IO (per-user rooms), triggered on account creation, course assignment,
  and timetable publication
- Security: Helmet, CORS, Mongo sanitize, rate limiting (general + strict auth limiter), centralized error handler
- Seed script (`npm run seed`) that creates one Admin/Lecturer/Student account plus sample courses/venues/slots

**Frontend (React 18 + Vite + Tailwind + Framer Motion)**
- Dark-blue/white glassmorphism theme, dark/light mode toggle, animated page transitions, loading skeletons,
  toast notifications, gradient stat cards
- Auth flow with public registration, instant login, and automatic role-based redirect straight to dashboard
- **Admin**: analytics dashboard (charts for lecturer workload & venue utilization), Faculties/Departments/
  Programmes/Levels/Sessions manager, Courses manager with lecturer assignment, Users manager (role-specific
  fields incl. phone/office/hours, active/disabled toggle), Venues & Time Slots manager, **Generate Timetable**
  page that calls the CSP engine and shows live stats + publish action, Activity Logs
- **Lecturer**: dashboard with today's classes, color-coded timetable grid, PDF export, profile & password update
- **Student**: dashboard, personalized timetable grid with a lecturer-details modal and a **Call Lecturer** button
  for class reps, advanced multi-filter search across all published classes, PDF export
- Notification bell with unread badge and real-time Socket.IO updates
- Reusable UI kit: Card, Button, Modal, Table, Badge, Skeleton, StatCard, EmptyState, TimetableGrid,
  ReferenceDataManager (config-driven CRUD)

## 2. What you'll still want to add before a real launch

This is a strong, working foundation — not a finished commercial product. Realistic next steps:
- Automated tests (Jest/Vitest + Supertest, React Testing Library)
- Drag-and-drop manual timetable editing UI (the backend `PUT /timetables/:id/entries/:entryId` endpoint
  already supports it; only the frontend interaction is left)
- Calendar-view (month/week) rendering, in addition to the grid view
- Email delivery for notifications (currently in-app + Socket.IO only)
- File/avatar uploads (currently a plain URL string field)
- Pagination on large list endpoints beyond Activity Logs
- CI pipeline and environment-specific config validation

## 3. Local setup

**Prerequisites:** Node.js 18+, a MongoDB connection string (local or MongoDB Atlas).

```bash
# Backend
cd backend
cp .env.example .env        # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed                # creates demo admin/lecturer/student + sample data
npm run dev                 # http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

**Seeded demo accounts** (from `npm run seed`):

| Role     | Email                     | Password      |
|----------|----------------------------|---------------|
| Admin    | admin@university.edu       | Admin@123     |
| Lecturer | lecturer@university.edu    | Lecturer@123  |
| Student  | student@university.edu     | Student@123   |

Log in as Admin → **Generate Timetable** → pick the seeded department/session/semester → Generate → Publish.
Then log in as the Lecturer or Student to see the same schedule, download it as PDF, and receive the
real-time "Timetable Published" notification.

## 4. How the scheduling algorithm works

See the header comment in `backend/src/services/schedulerService.js` for full detail. In short:
- **Variables**: one per course per required weekly session
- **Domain**: every (time slot × venue) pair whose venue capacity fits the course's expected class size
- **Hard constraints**: no lecturer, venue, or student-group (level+programme) double-booking
- **Search**: depth-first backtracking with a Minimum-Remaining-Values variable ordering, fully deterministic
  (no randomness) so the same input always produces the same, auditable output
- If a session's domain is exhausted, it's reported as **unscheduled** rather than failing the whole run,
  so administrators can see exactly which course needs a new venue/slot rather than getting nothing at all

## 5. Deployment

**Frontend → Vercel**
1. Import the `frontend/` folder as a new Vercel project (framework preset: Vite)
2. Set env vars `VITE_API_URL` and `VITE_SOCKET_URL` to your deployed backend URL
3. `vercel.json` is already included with an SPA rewrite rule

**Backend → Render or Railway**
1. Create a new Web Service pointing at `backend/`, build `npm install`, start `npm start`
2. Set env vars from `.env.example` (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, etc.) — `render.yaml` is included
   as a Render blueprint
3. Make sure `CLIENT_URL` matches your deployed Vercel URL exactly (used for CORS + Socket.IO)

**Database → MongoDB Atlas**
1. Create a free M0 cluster, a database user, and allow network access from your Render/Railway IP (or 0.0.0.0/0
   for simplicity during development)
2. Copy the connection string into `MONGO_URI`
3. Run `npm run seed` once against the Atlas connection string (locally, pointed at Atlas) to bootstrap data

## 6. Project structure

```
backend/
  src/
    config/       # MongoDB connection
    models/       # Mongoose schemas (User, Course, Timetable, Venue, TimeSlot, Notification, ...)
    controllers/  # Business logic (MVC "C")
    routes/       # Express routers (MVC routing layer)
    middleware/   # JWT auth, RBAC, error handler, rate limiting
    services/     # schedulerService.js (CSP/backtracking), notificationService.js
    sockets/      # Socket.IO server setup
    utils/        # token generation, ApiError, seed script
frontend/
  src/
    api/          # axios instance with auth interceptor
    context/      # Auth, Theme, Socket providers
    components/
      ui/         # reusable design-system components
      layout/     # Sidebar, Navbar, DashboardLayout, route guards
    pages/
      admin/ lecturer/ student/ auth/
    utils/        # pdfExport.js, cn.js
```
