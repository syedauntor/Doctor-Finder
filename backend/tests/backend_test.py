"""End-to-end API tests for Doctor Finder backend.

Covers: health, public doctors, auth (admin/doctor), registration approve/reject,
doctor self-management (profile, education, availability, chamber+schedule),
slots & appointments, admin endpoints, suggestions, RBAC + brute force.
"""
import os
import uuid
from datetime import date, timedelta

import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
ADMIN_EMAIL = os.environ.get("DEMO_ADMIN_EMAIL", "admin@demo.com")
ADMIN_PW = os.environ.get("DEMO_ADMIN_PASSWORD", "demo123456")
DOCTOR_EMAIL = os.environ.get("DEMO_DOCTOR_EMAIL", "dr.farhana@example.com")
DOCTOR_PW = os.environ.get("DEMO_DOCTOR_PASSWORD", "demo123456")


# -------------- Shared session / fixtures --------------
@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def admin_token():
    # Use a throwaway session so cookie does not leak into shared session.
    r = requests.post(f"{BASE_URL}/api/auth/admin/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def doctor_token():
    r = requests.post(f"{BASE_URL}/api/auth/doctor/login",
                      json={"email": DOCTOR_EMAIL, "password": DOCTOR_PW})
    assert r.status_code == 200, f"Doctor login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(autouse=True)
def _no_cookies(s):
    # Prevent cookie pollution between tests (server prefers cookie over Bearer).
    s.cookies.clear()
    yield
    s.cookies.clear()


def admin_headers(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


def doc_headers(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


# ==================== Health & Public ====================
class TestPublic:
    def test_health(self, s):
        r = s.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_doctors_list(self, s):
        r = s.get(f"{BASE_URL}/api/doctors")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 5, f"Expected >=5 doctors, got {len(data)}"
        # at least one should have primary_specialization populated
        with_spec = [d for d in data if d.get("primary_specialization")]
        assert len(with_spec) >= 1
        with_exp = [d for d in data if d.get("current_experience")]
        assert len(with_exp) >= 1

    def test_doctor_detail_farhana(self, s):
        # find Farhana doctor id
        r = s.get(f"{BASE_URL}/api/doctors")
        farhana = next((d for d in r.json() if "Farhana" in d.get("name", "")), None)
        assert farhana, "Farhana not found in doctor list"
        det = s.get(f"{BASE_URL}/api/doctors/{farhana['id']}")
        assert det.status_code == 200
        d = det.json()
        # All expected nested fields present
        for key in ("chambers", "education", "current_experience",
                    "expertise", "specializations", "awards",
                    "research_publications", "previous_experience"):
            assert key in d, f"Missing key {key}"
        # chambers should have schedules attached
        if d["chambers"]:
            assert "schedules" in d["chambers"][0]

    def test_specializations(self, s):
        r = s.get(f"{BASE_URL}/api/specializations")
        assert r.status_code == 200
        assert len(r.json()) >= 20

    def test_divisions(self, s):
        r = s.get(f"{BASE_URL}/api/divisions")
        assert r.status_code == 200
        divs = r.json()
        assert "Dhaka" in divs
        assert "Chittagong" in divs

    def test_suggestions(self, s):
        r1 = s.get(f"{BASE_URL}/api/suggestions/institutions")
        r2 = s.get(f"{BASE_URL}/api/suggestions/positions")
        assert r1.status_code == 200 and len(r1.json()) >= 1
        assert r2.status_code == 200 and len(r2.json()) >= 1


# ==================== Auth ====================
class TestAuth:
    def test_admin_login_success(self, s):
        r = s.post(f"{BASE_URL}/api/auth/admin/login",
                   json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
        assert r.status_code == 200
        j = r.json()
        assert "access_token" in j
        assert j["user"]["role"] == "admin"

    def test_admin_login_wrong_pw(self, s):
        r = s.post(f"{BASE_URL}/api/auth/admin/login",
                   json={"email": ADMIN_EMAIL, "password": "totally-wrong-pw-xyz"})
        assert r.status_code in (401, 429)

    def test_doctor_login_success(self, s):
        r = s.post(f"{BASE_URL}/api/auth/doctor/login",
                   json={"email": DOCTOR_EMAIL, "password": DOCTOR_PW})
        assert r.status_code == 200
        j = r.json()
        assert j["user"]["role"] == "doctor"
        assert j["user"]["doctor_id"]

    def test_me_with_bearer(self, s, doctor_token):
        r = s.get(f"{BASE_URL}/api/auth/me", headers=doc_headers(doctor_token))
        assert r.status_code == 200
        assert r.json()["email"] == DOCTOR_EMAIL

    def test_unauth_protected(self, s):
        r = s.get(f"{BASE_URL}/api/doctor/me")
        assert r.status_code == 401
        r2 = s.get(f"{BASE_URL}/api/admin/stats")
        assert r2.status_code == 401

    def test_brute_force_lockout(self, s):
        # use unique email so we don't lock real demos
        email = f"TEST_brute_{uuid.uuid4().hex[:8]}@nope.com"
        last_code = None
        for _ in range(6):
            r = s.post(f"{BASE_URL}/api/auth/admin/login",
                       json={"email": email, "password": "wrong"})
            last_code = r.status_code
        assert last_code == 429, f"Expected 429 after 6 fails, got {last_code}"


# ==================== Registration (Approve/Reject) ====================
class TestRegistration:
    def test_register_approve_then_login(self, s, admin_token):
        unique = uuid.uuid4().hex[:8]
        email = f"TEST_newdoc_{unique}@example.com"
        password = "newdocpass123"
        reg = s.post(f"{BASE_URL}/api/auth/doctor/register", json={
            "name": "TEST New Doc", "email": email, "phone": "01711000000",
            "specialty": "Cardiology", "bmdc_number": f"BMDC-T{unique}",
            "experience": "5 years", "message": "hi", "password": password,
        })
        assert reg.status_code == 200, reg.text
        req_id = reg.json()["id"]

        # admin sees pending
        list_r = s.get(f"{BASE_URL}/api/admin/registration-requests?status=pending",
                       headers=admin_headers(admin_token))
        assert list_r.status_code == 200
        assert any(x["id"] == req_id for x in list_r.json())

        # approve
        ap = s.post(f"{BASE_URL}/api/admin/registration-requests/{req_id}/approve",
                    json={"notes": "ok"}, headers=admin_headers(admin_token))
        assert ap.status_code == 200, ap.text
        assert ap.json()["approved"] is True

        # new doctor can login with that password
        login = s.post(f"{BASE_URL}/api/auth/doctor/login",
                       json={"email": email, "password": password})
        assert login.status_code == 200
        assert login.json()["user"]["role"] == "doctor"

    def test_register_reject(self, s, admin_token):
        unique = uuid.uuid4().hex[:8]
        email = f"TEST_rej_{unique}@example.com"
        reg = s.post(f"{BASE_URL}/api/auth/doctor/register", json={
            "name": "TEST Rej", "email": email, "phone": "01711000000",
            "specialty": "Cardiology", "bmdc_number": f"BMDC-R{unique}",
            "experience": "1", "message": "x", "password": "rejpass123",
        })
        req_id = reg.json()["id"]
        rj = s.post(f"{BASE_URL}/api/admin/registration-requests/{req_id}/reject",
                    json={"notes": "no"}, headers=admin_headers(admin_token))
        assert rj.status_code == 200
        assert rj.json()["rejected"] is True


# ==================== Admin ====================
class TestAdmin:
    def test_stats(self, s, admin_token):
        r = s.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers(admin_token))
        assert r.status_code == 200
        j = r.json()
        for k in ("pending_requests", "verified_doctors",
                  "total_doctors", "total_appointments"):
            assert k in j

    def test_admin_doctors_and_verify(self, s, admin_token):
        r = s.get(f"{BASE_URL}/api/admin/doctors", headers=admin_headers(admin_token))
        assert r.status_code == 200 and len(r.json()) >= 5
        # pick a doctor; toggle
        d = r.json()[0]
        original = d["is_verified"]
        toggle = s.patch(f"{BASE_URL}/api/admin/doctors/{d['id']}/verify",
                         json={"is_verified": not original, "notes": "toggle"},
                         headers=admin_headers(admin_token))
        assert toggle.status_code == 200
        assert toggle.json()["is_verified"] == (not original)
        # restore
        s.patch(f"{BASE_URL}/api/admin/doctors/{d['id']}/verify",
                json={"is_verified": original, "notes": "restore"},
                headers=admin_headers(admin_token))


# ==================== Slots & Appointments ====================
class TestAppointments:
    def _farhana_id(self, s):
        r = s.get(f"{BASE_URL}/api/doctors")
        return next(d["id"] for d in r.json() if "Farhana" in d["name"])

    def _next_sunday(self):
        today = date.today()
        offset = (6 - today.weekday()) % 7 + 1  # python: Sun=6
        # python weekday: Mon=0..Sun=6; we want next Sunday strictly after today
        offset = ((6 - today.weekday()) % 7) or 7
        return today + timedelta(days=offset)

    def test_slots_and_book_and_conflict(self, s, doctor_token):
        farhana = self._farhana_id(s)
        d = self._next_sunday().isoformat()
        r = s.get(f"{BASE_URL}/api/doctors/{farhana}/slots", params={"date": d})
        assert r.status_code == 200, r.text
        slots = r.json()["slots"]
        assert isinstance(slots, list) and len(slots) > 0, f"No slots for {d}"
        slot = slots[0]
        unique = uuid.uuid4().hex[:8]
        appt_payload = {
            "doctor_id": farhana,
            "patient_name": f"TEST P {unique}",
            "patient_email": f"TEST_p_{unique}@ex.com",
            "patient_phone": "017XXXXXXXX",
            "date_of_birth": "1990-01-01",
            "gender": "male", "address": "Dhaka",
            "appointment_date": d, "appointment_time": slot,
            "consultation_type": "in-person", "notes": "test",
        }
        b = s.post(f"{BASE_URL}/api/appointments", json=appt_payload)
        assert b.status_code == 200, b.text
        assert b.json()["status"] == "pending"
        appt_id = b.json()["id"]

        # Conflict
        b2 = s.post(f"{BASE_URL}/api/appointments", json={**appt_payload,
                                                          "patient_email": f"TEST_p2_{unique}@ex.com"})
        assert b2.status_code == 409

        # Doctor sees in own list
        own = s.get(f"{BASE_URL}/api/doctor/me/appointments",
                    headers=doc_headers(doctor_token))
        assert own.status_code == 200
        match = next((a for a in own.json() if a["id"] == appt_id), None)
        assert match, "New appointment not in doctor list"
        assert match.get("patient") and match["patient"]["email"].startswith("test_p_")

        # Confirm
        upd = s.patch(f"{BASE_URL}/api/appointments/{appt_id}",
                      json={"status": "confirmed"},
                      headers=doc_headers(doctor_token))
        assert upd.status_code == 200
        assert upd.json()["status"] == "confirmed"


# ==================== Doctor self-management ====================
class TestDoctorSelf:
    def test_me_get_update(self, s, doctor_token):
        r = s.get(f"{BASE_URL}/api/doctor/me", headers=doc_headers(doctor_token))
        assert r.status_code == 200
        original_overview = r.json().get("overview", "")
        new_overview = original_overview + " [TEST]"
        u = s.put(f"{BASE_URL}/api/doctor/me", json={"overview": new_overview},
                  headers=doc_headers(doctor_token))
        assert u.status_code == 200
        assert u.json()["overview"] == new_overview
        # restore
        s.put(f"{BASE_URL}/api/doctor/me", json={"overview": original_overview},
              headers=doc_headers(doctor_token))

    def test_education_crud(self, s, doctor_token):
        h = doc_headers(doctor_token)
        add = s.post(f"{BASE_URL}/api/doctor/me/education",
                     json={"degree": "TEST MD", "institution": "TEST Uni",
                           "year": 2020, "details": "x"}, headers=h)
        assert add.status_code == 200
        eid = add.json()["id"]
        lst = s.get(f"{BASE_URL}/api/doctor/me/education", headers=h)
        assert lst.status_code == 200
        assert any(e["id"] == eid for e in lst.json())
        d = s.delete(f"{BASE_URL}/api/doctor/me/education/{eid}", headers=h)
        assert d.status_code == 200

    def test_availability_crud(self, s, doctor_token):
        h = doc_headers(doctor_token)
        add = s.post(f"{BASE_URL}/api/doctor/me/availability",
                     json={"day_of_week": 5, "start_time": "10:00",
                           "end_time": "12:00", "slot_duration": 30,
                           "is_active": True}, headers=h)
        assert add.status_code == 200
        aid = add.json()["id"]
        lst = s.get(f"{BASE_URL}/api/doctor/me/availability", headers=h)
        assert any(a["id"] == aid for a in lst.json())
        d = s.delete(f"{BASE_URL}/api/doctor/me/availability/{aid}", headers=h)
        assert d.status_code == 200

    def test_chamber_and_schedule(self, s, doctor_token):
        h = doc_headers(doctor_token)
        ch = s.post(f"{BASE_URL}/api/doctor/me/chambers", json={
            "name": "TEST Chamber", "address": "TEST St",
            "city": "Dhaka", "division": "Dhaka", "phone": "017",
            "is_primary": False,
        }, headers=h)
        assert ch.status_code == 200, ch.text
        cid = ch.json()["id"]
        sched = s.post(f"{BASE_URL}/api/doctor/me/chamber-schedules", json={
            "chamber_id": cid, "day_of_week": "1",
            "start_time": "09:00", "end_time": "12:00",
        }, headers=h)
        assert sched.status_code == 200, sched.text
        sid = sched.json()["id"]
        # cleanup
        s.delete(f"{BASE_URL}/api/doctor/me/chamber-schedules/{sid}", headers=h)
        s.delete(f"{BASE_URL}/api/doctor/me/chambers/{cid}", headers=h)


# ==================== RBAC ====================
class TestRBAC:
    def test_doctor_cannot_admin(self, s, doctor_token):
        r = s.get(f"{BASE_URL}/api/admin/stats", headers=doc_headers(doctor_token))
        assert r.status_code == 403

    def test_admin_cannot_doctor_me(self, s, admin_token):
        r = s.get(f"{BASE_URL}/api/doctor/me", headers=admin_headers(admin_token))
        assert r.status_code == 403
