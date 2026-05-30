# Test Credentials

## Demo Admin
- Email: `admin@demo.com`
- Password: `demo123456`
- Role: admin (super_admin)
- Login endpoint: `POST /api/auth/admin/login`

## Demo Doctor (Dr. Farhana Rahman)
- Email: `dr.farhana@example.com`
- Password: `demo123456`
- Role: doctor (verified)
- Login endpoint: `POST /api/auth/doctor/login`
- Availability: Sun-Thu 9:00 AM - 5:00 PM (30-min slots)

## Auth Endpoints
- POST `/api/auth/doctor/login`
- POST `/api/auth/doctor/register` (creates pending registration request)
- POST `/api/auth/admin/login`
- GET  `/api/auth/me`
- POST `/api/auth/logout`
