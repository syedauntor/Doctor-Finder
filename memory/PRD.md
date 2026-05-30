# Doctor Finder — Migration PRD

## Original Problem Statement
> "bring data from github" → `https://github.com/syedauntor/Doctor-Finder.git`
> Migrate from Supabase to a FREE stack (Python + free DB).
> Save changes to new branch `feature/python-backend`.
> Frontend: convert to CRA React + JS.
> Image storage: local disk.
> Seed same demo credentials as DEMO_CREDENTIALS.md.

## Architecture
- **Backend**: FastAPI 0.115 + Motor (async MongoDB) + Pydantic v2 + bcrypt + PyJWT, served by Uvicorn on `:8001`.
- **Frontend**: Create-React-App + React 18 + react-router-dom + Tailwind + lucide-react + axios, served on `:3000`.
- **Database**: MongoDB local (`mongodb://localhost:27017`, db `doctor_finder`).
- **Auth**: JWT (HS256, 7-day expiry) via `Authorization: Bearer` header + httpOnly cookie fallback. Per IP+email brute-force lockout (5 fails → 15 min).
- **Images**: stored under `/app/backend/uploads/`, served via `/api/uploads/...`.
- **Routing**: All backend routes prefixed `/api/...` (Kubernetes ingress).

## User Personas
1. **Patient (anonymous)** — Browse doctors, book appointments.
2. **Doctor** — Manage profile, schedules, availability, appointments.
3. **Admin** — Approve doctor registrations, verify doctors, view all appointments + stats.

## Core Requirements (static)
- Public doctor browsing with search + spec/division filters.
- Comprehensive doctor profile (education, awards, research, expertise, current/previous experience, chambers w/ schedules, multiple fee types).
- Doctor self-registration → admin approval.
- Doctor login + dashboard for appointment management.
- Doctor profile + availability self-edit.
- Patient booking with slot generation against availability + double-booking prevention.
- Admin stats + approve/reject + verify/unverify + appointment overview.
- BMDC verification badge.
- Bangladesh location hierarchy (Division → District → Upazila).

## What's Been Implemented (2026-05-30)
### Backend
- 30+ REST endpoints across auth / doctors / appointments / availability / admin / suggestions / upload.
- Full schema migration from 11 Supabase SQL migrations → MongoDB collections.
- JWT auth, role-based access, brute-force lockout, idempotent seed of admin + 5 sample doctors + 20 specializations + 20 departments + 20 institutions + 20 positions.
- 23/23 backend tests passed via testing agent.

### Frontend
- Pages: Home, About, Contact, Category, DoctorDetail, BookAppointment, DoctorLogin, DoctorRegistration, DoctorDashboard, DoctorProfileEdit, AvailabilityManagement, AdminLogin, AdminDashboard.
- Components: Navbar, Footer, DoctorCard.
- AuthContext with localStorage-backed JWT.
- React-router protected routes by role.
- All UI verified visually loading + login flow E2E.

### Migration Hygiene
- Legacy Supabase Vite TS code moved to `/app/legacy_supabase_app/` for reference.
- All work committed to `feature/python-backend` branch — `main` is untouched.

## Prioritized Backlog (Future)
### P1
- Image upload via UI (input already exists, hook up `/api/upload/image` in profile edit).
- Real autocomplete using `/api/suggestions/institutions` & `/api/suggestions/positions`.
- LocationPicker map widget (leaflet) for chambers.
- Doctor specialization management UI (currently API-only).

### P2
- Email notifications on appointment status change (Resend/SendGrid).
- Patient login + history.
- Reviews & ratings flow.
- Split `server.py` into routers (`auth.py`, `doctors.py`, `appointments.py`, `admin.py`).
- Wrap admin approve in transaction to avoid orphan docs.

## Demo Credentials
See `/app/memory/test_credentials.md` (auto-generated).

## Branch
All work on `feature/python-backend`. Original Doctor-Finder code preserved at `main`.
