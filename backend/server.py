"""Main FastAPI app - Doctor Finder API."""
from dotenv import load_dotenv
load_dotenv()

import os
import uuid
from datetime import datetime, timezone, date, time, timedelta
from pathlib import Path
from typing import Optional

import aiofiles
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Request, Response, Depends, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import get_db, init_indexes
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_doctor, require_admin,
    check_brute_force, record_failed_attempt, clear_attempts,
    set_auth_cookie, clear_auth_cookie,
)
from seed import seed_all, write_test_credentials
from schemas import (
    DoctorLoginIn, AdminLoginIn, DoctorRegisterIn, UserOut,
    DoctorProfileUpdate, EducationIn, AwardIn, ResearchIn, ExpertiseIn,
    CurrentExperienceIn, PreviousExperienceIn, ChamberIn, ChamberScheduleIn,
    AppointmentCreateIn, AppointmentStatusUpdate, AvailabilityIn,
    RegistrationActionIn, VerifyDoctorIn, SpecializationLinkIn, SuggestionIn,
)

# ---------------- App setup ----------------
app = FastAPI(title="Doctor Finder API")

origins_env = os.environ.get("CORS_ORIGINS", "*")
allow_origins = ["*"] if origins_env.strip() == "*" else [o.strip() for o in origins_env.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=False if allow_origins == ["*"] else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static uploads
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.on_event("startup")
async def on_startup():
    await init_indexes()
    await seed_all()
    await write_test_credentials()


# ---------------- Helpers ----------------
def oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")


def serialize(doc: dict) -> dict:
    if doc is None:
        return None
    out = dict(doc)
    if "_id" in out:
        out["id"] = str(out.pop("_id"))
    for k, v in list(out.items()):
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, (datetime, date, time)):
            out[k] = v.isoformat()
    return out


def serialize_list(docs):
    return [serialize(d) for d in docs]


def user_to_out(user: dict) -> dict:
    return {
        "id": user["id"] if "id" in user else str(user.get("_id")),
        "email": user.get("email"),
        "name": user.get("name", ""),
        "role": user.get("role"),
        "doctor_id": user.get("doctor_id"),
        "admin_role": user.get("admin_role"),
    }


# ---------------- Health ----------------
@app.get("/api/")
async def root():
    return {"message": "Doctor Finder API", "status": "ok"}


@app.get("/api/health")
async def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


# ---------------- Auth ----------------
@app.post("/api/auth/doctor/login")
async def doctor_login(body: DoctorLoginIn, request: Request, response: Response):
    db = get_db()
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await check_brute_force(db, identifier)

    user = await db.users.find_one({"email": email, "role": "doctor"})
    if not user or not verify_password(body.password, user["password_hash"]):
        await record_failed_attempt(db, identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await clear_attempts(db, identifier)
    token = create_access_token(str(user["_id"]), email, "doctor", user.get("doctor_id"))
    set_auth_cookie(response, token)
    return {"access_token": token, "user": user_to_out({**user, "id": str(user["_id"])})}


@app.post("/api/auth/admin/login")
async def admin_login(body: AdminLoginIn, request: Request, response: Response):
    db = get_db()
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await check_brute_force(db, identifier)

    user = await db.users.find_one({"email": email, "role": "admin"})
    if not user or not verify_password(body.password, user["password_hash"]):
        await record_failed_attempt(db, identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await clear_attempts(db, identifier)
    token = create_access_token(str(user["_id"]), email, "admin")
    set_auth_cookie(response, token)
    return {"access_token": token, "user": user_to_out({**user, "id": str(user["_id"])})}


@app.post("/api/auth/doctor/register")
async def doctor_register(body: DoctorRegisterIn):
    """Creates a pending registration request. Admin approves to create doctor + user."""
    db = get_db()
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_req = await db.doctor_registration_requests.find_one({"email": email, "status": "pending"})
    if existing_req:
        raise HTTPException(status_code=400, detail="Registration request already pending for this email")

    now = datetime.now(timezone.utc)
    doc = {
        "name": body.name, "email": email, "phone": body.phone,
        "specialty": body.specialty, "bmdc_number": body.bmdc_number,
        "experience": body.experience, "message": body.message,
        "password_hash": hash_password(body.password),
        "status": "pending", "doctor_id": None,
        "created_at": now, "processed_at": None, "processed_by": None,
    }
    res = await db.doctor_registration_requests.insert_one(doc)
    return {"id": str(res.inserted_id), "status": "pending", "message": "Registration submitted. Awaiting admin approval."}


@app.get("/api/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user_to_out(user)


@app.post("/api/auth/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out"}


# ---------------- Specializations / Departments / Categories ----------------
@app.get("/api/specializations")
async def list_specializations():
    db = get_db()
    docs = await db.specializations.find().sort("name", 1).to_list(500)
    return serialize_list(docs)


@app.get("/api/departments")
async def list_departments():
    db = get_db()
    docs = await db.departments.find().sort("name", 1).to_list(500)
    return serialize_list(docs)


@app.get("/api/divisions")
async def list_divisions():
    db = get_db()
    pipeline = [
        {"$match": {"division": {"$ne": ""}}},
        {"$group": {"_id": "$division"}},
        {"$sort": {"_id": 1}},
    ]
    rows = await db.chambers.aggregate(pipeline).to_list(100)
    return [r["_id"] for r in rows if r["_id"]]


# ---------------- Doctors (public) ----------------
@app.get("/api/doctors")
async def list_doctors(
    search: Optional[str] = None,
    specialization: Optional[str] = None,
    division: Optional[str] = None,
    verified_only: bool = True,
):
    db = get_db()
    query: dict = {}
    if verified_only:
        query["is_verified"] = True
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
        ]
    doctors = await db.doctors.find(query).sort("rating", -1).to_list(500)

    # Specialization filter requires a join
    spec_map: dict[str, str] = {}
    if doctors:
        ids = [str(d["_id"]) for d in doctors]
        ds_pipeline = [
            {"$match": {"doctor_id": {"$in": ids}, "is_primary": True}},
        ]
        ds_rows = await db.doctor_specializations.aggregate(ds_pipeline).to_list(2000)
        spec_ids = list({r["specialization_id"] for r in ds_rows})
        specs = await db.specializations.find({"_id": {"$in": [oid(s) for s in spec_ids]}}).to_list(500)
        spec_by_id = {str(s["_id"]): s["name"] for s in specs}
        for r in ds_rows:
            spec_map[r["doctor_id"]] = spec_by_id.get(r["specialization_id"], "")

    # Current experience map
    exp_rows = await db.current_experience.find({"doctor_id": {"$in": [str(d["_id"]) for d in doctors]}}).to_list(2000)
    exp_map: dict[str, dict] = {}
    for r in exp_rows:
        exp_map.setdefault(r["doctor_id"], {"designation": r.get("designation", ""), "department": r.get("department", "")})

    # Optional spec filter (case-insensitive)
    if specialization and specialization.lower() != "all":
        doctors = [d for d in doctors if spec_map.get(str(d["_id"]), "").lower() == specialization.lower()]

    # Optional division filter via chambers
    if division:
        chamber_rows = await db.chambers.find({"division": division}).to_list(2000)
        ok_ids = {c["doctor_id"] for c in chamber_rows}
        doctors = [d for d in doctors if str(d["_id"]) in ok_ids]

    result = []
    for d in doctors:
        s = serialize(d)
        s["primary_specialization"] = spec_map.get(s["id"], "")
        s["current_experience"] = exp_map.get(s["id"])
        result.append(s)
    return result


@app.get("/api/doctors/{doctor_id}")
async def get_doctor(doctor_id: str):
    db = get_db()
    doc = await db.doctors.find_one({"_id": oid(doctor_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # All related data
    specs_links = await db.doctor_specializations.find({"doctor_id": doctor_id}).to_list(50)
    spec_ids = [s["specialization_id"] for s in specs_links]
    specs = await db.specializations.find({"_id": {"$in": [oid(s) for s in spec_ids]}}).to_list(50) if spec_ids else []
    spec_by_id = {str(s["_id"]): s for s in specs}
    specializations_full = []
    for link in specs_links:
        spec = spec_by_id.get(link["specialization_id"])
        if spec:
            specializations_full.append({
                "id": str(spec["_id"]), "name": spec["name"], "slug": spec["slug"],
                "is_primary": link.get("is_primary", False),
            })

    chambers = serialize_list(await db.chambers.find({"doctor_id": doctor_id}).to_list(50))
    chamber_ids = [c["id"] for c in chambers]
    schedules = serialize_list(await db.chamber_schedules.find({"chamber_id": {"$in": chamber_ids}}).to_list(500))
    for c in chambers:
        c["schedules"] = [s for s in schedules if s["chamber_id"] == c["id"]]

    education = serialize_list(await db.education.find({"doctor_id": doctor_id}).sort("year", -1).to_list(50))
    awards = serialize_list(await db.awards.find({"doctor_id": doctor_id}).sort("year", -1).to_list(50))
    research = serialize_list(await db.research_publications.find({"doctor_id": doctor_id}).sort("year", -1).to_list(100))
    expertise = serialize_list(await db.expertise.find({"doctor_id": doctor_id}).to_list(50))
    current_exp = serialize_list(await db.current_experience.find({"doctor_id": doctor_id}).to_list(20))
    previous_exp = serialize_list(await db.previous_experience.find({"doctor_id": doctor_id}).sort("end_year", -1).to_list(50))

    result = serialize(doc)
    result.update({
        "specializations": specializations_full,
        "chambers": chambers,
        "education": education,
        "awards": awards,
        "research_publications": research,
        "expertise": expertise,
        "current_experience": current_exp,
        "previous_experience": previous_exp,
    })
    return result


# ---------------- Doctor self-management ----------------
@app.get("/api/doctor/me")
async def doctor_me(user: dict = Depends(require_doctor)):
    db = get_db()
    if not user.get("doctor_id"):
        raise HTTPException(status_code=404, detail="No doctor profile linked")
    doc = await db.doctors.find_one({"_id": oid(user["doctor_id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return serialize(doc)


@app.put("/api/doctor/me")
async def update_doctor_me(body: DoctorProfileUpdate, user: dict = Depends(require_doctor)):
    db = get_db()
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if update:
        await db.doctors.update_one({"_id": oid(user["doctor_id"])}, {"$set": update})
    doc = await db.doctors.find_one({"_id": oid(user["doctor_id"])})
    return serialize(doc)


# Generic helper to manage subcollection items for current doctor
def _make_sub_routes(prefix: str, coll: str, schema):
    @app.get(f"/api/doctor/me/{prefix}")
    async def list_items(user: dict = Depends(require_doctor)):
        db = get_db()
        rows = await db[coll].find({"doctor_id": user["doctor_id"]}).to_list(500)
        return serialize_list(rows)

    @app.post(f"/api/doctor/me/{prefix}")
    async def add_item(body: schema, user: dict = Depends(require_doctor)):
        db = get_db()
        doc = body.model_dump()
        doc["doctor_id"] = user["doctor_id"]
        doc["created_at"] = datetime.now(timezone.utc)
        res = await db[coll].insert_one(doc)
        return serialize(await db[coll].find_one({"_id": res.inserted_id}))

    @app.delete(f"/api/doctor/me/{prefix}/{{item_id}}")
    async def delete_item(item_id: str, user: dict = Depends(require_doctor)):
        db = get_db()
        result = await db[coll].delete_one({"_id": oid(item_id), "doctor_id": user["doctor_id"]})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"deleted": True}


_make_sub_routes("education", "education", EducationIn)
_make_sub_routes("awards", "awards", AwardIn)
_make_sub_routes("research", "research_publications", ResearchIn)
_make_sub_routes("expertise", "expertise", ExpertiseIn)
_make_sub_routes("current-experience", "current_experience", CurrentExperienceIn)
_make_sub_routes("previous-experience", "previous_experience", PreviousExperienceIn)


# Chambers (with schedules)
@app.get("/api/doctor/me/chambers")
async def list_chambers(user: dict = Depends(require_doctor)):
    db = get_db()
    chambers = serialize_list(await db.chambers.find({"doctor_id": user["doctor_id"]}).to_list(50))
    chamber_ids = [c["id"] for c in chambers]
    schedules = serialize_list(await db.chamber_schedules.find({"chamber_id": {"$in": chamber_ids}}).to_list(500))
    for c in chambers:
        c["schedules"] = [s for s in schedules if s["chamber_id"] == c["id"]]
    return chambers


@app.post("/api/doctor/me/chambers")
async def add_chamber(body: ChamberIn, user: dict = Depends(require_doctor)):
    db = get_db()
    doc = body.model_dump()
    doc["doctor_id"] = user["doctor_id"]
    doc["created_at"] = datetime.now(timezone.utc)
    res = await db.chambers.insert_one(doc)
    return serialize(await db.chambers.find_one({"_id": res.inserted_id}))


@app.delete("/api/doctor/me/chambers/{chamber_id}")
async def delete_chamber(chamber_id: str, user: dict = Depends(require_doctor)):
    db = get_db()
    await db.chamber_schedules.delete_many({"chamber_id": chamber_id})
    result = await db.chambers.delete_one({"_id": oid(chamber_id), "doctor_id": user["doctor_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": True}


@app.post("/api/doctor/me/chamber-schedules")
async def add_schedule(body: ChamberScheduleIn, user: dict = Depends(require_doctor)):
    db = get_db()
    # Verify ownership of chamber
    ch = await db.chambers.find_one({"_id": oid(body.chamber_id), "doctor_id": user["doctor_id"]})
    if not ch:
        raise HTTPException(status_code=404, detail="Chamber not owned")
    doc = body.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    res = await db.chamber_schedules.insert_one(doc)
    return serialize(await db.chamber_schedules.find_one({"_id": res.inserted_id}))


@app.delete("/api/doctor/me/chamber-schedules/{sched_id}")
async def delete_schedule(sched_id: str, user: dict = Depends(require_doctor)):
    db = get_db()
    sched = await db.chamber_schedules.find_one({"_id": oid(sched_id)})
    if not sched:
        raise HTTPException(status_code=404, detail="Not found")
    ch = await db.chambers.find_one({"_id": oid(sched["chamber_id"]), "doctor_id": user["doctor_id"]})
    if not ch:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.chamber_schedules.delete_one({"_id": oid(sched_id)})
    return {"deleted": True}


# Doctor specialization links
@app.post("/api/doctor/me/specializations")
async def link_specialization(body: SpecializationLinkIn, user: dict = Depends(require_doctor)):
    db = get_db()
    if body.is_primary:
        await db.doctor_specializations.update_many(
            {"doctor_id": user["doctor_id"]}, {"$set": {"is_primary": False}}
        )
    await db.doctor_specializations.update_one(
        {"doctor_id": user["doctor_id"], "specialization_id": body.specialization_id},
        {"$set": {"is_primary": body.is_primary, "created_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"linked": True}


@app.delete("/api/doctor/me/specializations/{spec_id}")
async def unlink_specialization(spec_id: str, user: dict = Depends(require_doctor)):
    db = get_db()
    await db.doctor_specializations.delete_one({"doctor_id": user["doctor_id"], "specialization_id": spec_id})
    return {"deleted": True}


# ---------------- Availability ----------------
@app.get("/api/doctor/me/availability")
async def my_availability(user: dict = Depends(require_doctor)):
    db = get_db()
    rows = await db.doctor_availability.find({"doctor_id": user["doctor_id"]}).to_list(50)
    return serialize_list(rows)


@app.post("/api/doctor/me/availability")
async def add_availability(body: AvailabilityIn, user: dict = Depends(require_doctor)):
    db = get_db()
    doc = body.model_dump()
    doc["doctor_id"] = user["doctor_id"]
    doc["created_at"] = datetime.now(timezone.utc)
    res = await db.doctor_availability.insert_one(doc)
    return serialize(await db.doctor_availability.find_one({"_id": res.inserted_id}))


@app.delete("/api/doctor/me/availability/{a_id}")
async def del_availability(a_id: str, user: dict = Depends(require_doctor)):
    db = get_db()
    result = await db.doctor_availability.delete_one({"_id": oid(a_id), "doctor_id": user["doctor_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": True}


@app.get("/api/doctors/{doctor_id}/availability")
async def public_availability(doctor_id: str):
    db = get_db()
    rows = await db.doctor_availability.find({"doctor_id": doctor_id, "is_active": True}).to_list(50)
    return serialize_list(rows)


@app.get("/api/doctors/{doctor_id}/slots")
async def get_slots(doctor_id: str, date_str: str = Query(..., alias="date")):
    """Return available time slots for a specific date."""
    db = get_db()
    try:
        target = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format (YYYY-MM-DD)")
    # JS Date.getDay() compatibility - use python weekday + 1 mod 7 to get 0=Sunday
    py_wd = target.weekday()  # 0=Mon..6=Sun
    dow = (py_wd + 1) % 7  # 0=Sun..6=Sat

    avail = await db.doctor_availability.find_one({
        "doctor_id": doctor_id, "day_of_week": dow, "is_active": True
    })
    if not avail:
        return {"slots": [], "doctor_id": doctor_id, "date": date_str}

    # Generate slots
    def to_min(s: str) -> int:
        h, m = s.split(":")
        return int(h) * 60 + int(m)

    def to_str(m: int) -> str:
        return f"{m // 60:02d}:{m % 60:02d}"

    start = to_min(avail["start_time"])
    end = to_min(avail["end_time"])
    dur = avail.get("slot_duration", 30)
    all_slots = [to_str(t) for t in range(start, end, dur)]

    # Filter out already-booked
    booked_rows = await db.appointments.find({
        "doctor_id": doctor_id,
        "appointment_date": date_str,
        "status": {"$in": ["pending", "confirmed"]},
    }).to_list(200)
    booked = {r["appointment_time"] for r in booked_rows}
    free_slots = [s for s in all_slots if s not in booked]

    return {"slots": free_slots, "doctor_id": doctor_id, "date": date_str}


# ---------------- Appointments ----------------
@app.post("/api/appointments")
async def create_appointment(body: AppointmentCreateIn):
    db = get_db()
    # Validate doctor
    doctor = await db.doctors.find_one({"_id": oid(body.doctor_id)})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Find or create patient
    patient = await db.patients.find_one({"email": body.patient_email.lower()})
    now = datetime.now(timezone.utc)
    if not patient:
        patient_doc = {
            "name": body.patient_name, "email": body.patient_email.lower(),
            "phone": body.patient_phone,
            "date_of_birth": body.date_of_birth.isoformat() if body.date_of_birth else None,
            "gender": body.gender, "address": body.address,
            "created_at": now,
        }
        res = await db.patients.insert_one(patient_doc)
        patient_id = str(res.inserted_id)
    else:
        patient_id = str(patient["_id"])

    # Check slot already taken
    existing = await db.appointments.find_one({
        "doctor_id": body.doctor_id,
        "appointment_date": body.appointment_date.isoformat(),
        "appointment_time": body.appointment_time,
        "status": {"$in": ["pending", "confirmed"]},
    })
    if existing:
        raise HTTPException(status_code=409, detail="This time slot is already booked")

    appt = {
        "doctor_id": body.doctor_id,
        "patient_id": patient_id,
        "appointment_date": body.appointment_date.isoformat(),
        "appointment_time": body.appointment_time,
        "status": "pending",
        "consultation_type": body.consultation_type,
        "notes": body.notes,
        "doctor_notes": "",
        "created_at": now,
        "updated_at": now,
    }
    res = await db.appointments.insert_one(appt)
    return {"id": str(res.inserted_id), "status": "pending", "message": "Appointment booked"}


@app.get("/api/doctor/me/appointments")
async def my_appointments(status: Optional[str] = None, user: dict = Depends(require_doctor)):
    db = get_db()
    query: dict = {"doctor_id": user["doctor_id"]}
    if status:
        query["status"] = status
    rows = await db.appointments.find(query).sort([("appointment_date", -1), ("appointment_time", -1)]).to_list(500)
    rows = serialize_list(rows)
    # Attach patient details
    patient_ids = list({r["patient_id"] for r in rows})
    patients = await db.patients.find({"_id": {"$in": [oid(p) for p in patient_ids]}}).to_list(500)
    p_by_id = {str(p["_id"]): serialize(p) for p in patients}
    for r in rows:
        r["patient"] = p_by_id.get(r["patient_id"])
    return rows


@app.patch("/api/appointments/{appt_id}")
async def update_appointment(appt_id: str, body: AppointmentStatusUpdate, user: dict = Depends(require_doctor)):
    db = get_db()
    appt = await db.appointments.find_one({"_id": oid(appt_id), "doctor_id": user["doctor_id"]})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    update = {"status": body.status, "updated_at": datetime.now(timezone.utc)}
    if body.doctor_notes is not None:
        update["doctor_notes"] = body.doctor_notes
    await db.appointments.update_one({"_id": oid(appt_id)}, {"$set": update})
    return serialize(await db.appointments.find_one({"_id": oid(appt_id)}))


# ---------------- Admin ----------------
@app.get("/api/admin/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    db = get_db()
    pending = await db.doctor_registration_requests.count_documents({"status": "pending"})
    verified = await db.doctors.count_documents({"is_verified": True})
    total_docs = await db.doctors.count_documents({})
    total_appts = await db.appointments.count_documents({})
    return {
        "pending_requests": pending,
        "verified_doctors": verified,
        "total_doctors": total_docs,
        "total_appointments": total_appts,
    }


@app.get("/api/admin/registration-requests")
async def list_registration_requests(status: Optional[str] = None, user: dict = Depends(require_admin)):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    rows = await db.doctor_registration_requests.find(query).sort("created_at", -1).to_list(500)
    # don't expose password hashes
    out = []
    for r in rows:
        s = serialize(r)
        s.pop("password_hash", None)
        out.append(s)
    return out


@app.post("/api/admin/registration-requests/{req_id}/approve")
async def approve_request(req_id: str, body: RegistrationActionIn, user: dict = Depends(require_admin)):
    db = get_db()
    req = await db.doctor_registration_requests.find_one({"_id": oid(req_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    now = datetime.now(timezone.utc)
    # Create doctor profile
    doctor_doc = {
        "name": req["name"], "title": "", "profile_image": "",
        "overview": req.get("message", ""), "years_of_experience": 0,
        "consultation_fee": 0, "fee_new_patient": 0, "fee_old_patient": 0, "fee_report_checking": 0,
        "phone": req["phone"], "email": req["email"],
        "bmdc_number": req["bmdc_number"], "designation": "",
        "gender": "", "rating": 0, "total_reviews": 0,
        "is_verified": True, "verification_status": "approved",
        "verification_notes": body.notes,
        "created_at": now,
    }
    doctor_res = await db.doctors.insert_one(doctor_doc)
    doctor_id = str(doctor_res.inserted_id)

    # Create user
    user_res = await db.users.insert_one({
        "email": req["email"], "password_hash": req["password_hash"],
        "name": req["name"], "role": "doctor", "doctor_id": doctor_id, "created_at": now,
    })
    await db.doctors.update_one({"_id": doctor_res.inserted_id}, {"$set": {"user_id": str(user_res.inserted_id)}})

    # Link specialty
    spec = await db.specializations.find_one({"name": req["specialty"]})
    if spec:
        await db.doctor_specializations.insert_one({
            "doctor_id": doctor_id, "specialization_id": str(spec["_id"]),
            "is_primary": True, "created_at": now,
        })

    # Update request
    await db.doctor_registration_requests.update_one(
        {"_id": oid(req_id)},
        {"$set": {
            "status": "approved", "doctor_id": doctor_id,
            "processed_at": now, "processed_by": user["id"],
        }, "$unset": {"password_hash": ""}},
    )
    return {"approved": True, "doctor_id": doctor_id}


@app.post("/api/admin/registration-requests/{req_id}/reject")
async def reject_request(req_id: str, body: RegistrationActionIn, user: dict = Depends(require_admin)):
    db = get_db()
    req = await db.doctor_registration_requests.find_one({"_id": oid(req_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Already processed")
    await db.doctor_registration_requests.update_one(
        {"_id": oid(req_id)},
        {"$set": {
            "status": "rejected", "processed_at": datetime.now(timezone.utc),
            "processed_by": user["id"], "rejection_notes": body.notes,
        }, "$unset": {"password_hash": ""}},
    )
    return {"rejected": True}


@app.get("/api/admin/doctors")
async def admin_list_doctors(user: dict = Depends(require_admin)):
    db = get_db()
    rows = await db.doctors.find().sort("created_at", -1).to_list(1000)
    return serialize_list(rows)


@app.patch("/api/admin/doctors/{doctor_id}/verify")
async def admin_verify_doctor(doctor_id: str, body: VerifyDoctorIn, user: dict = Depends(require_admin)):
    db = get_db()
    doc = await db.doctors.find_one({"_id": oid(doctor_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    await db.doctors.update_one({"_id": oid(doctor_id)}, {"$set": {
        "is_verified": body.is_verified,
        "verification_status": "approved" if body.is_verified else "rejected",
        "verification_notes": body.notes,
    }})
    return serialize(await db.doctors.find_one({"_id": oid(doctor_id)}))


@app.get("/api/admin/appointments")
async def admin_list_appointments(user: dict = Depends(require_admin)):
    db = get_db()
    rows = serialize_list(await db.appointments.find().sort("created_at", -1).to_list(1000))
    doctor_ids = list({r["doctor_id"] for r in rows})
    patient_ids = list({r["patient_id"] for r in rows})
    doctors = await db.doctors.find({"_id": {"$in": [oid(d) for d in doctor_ids]}}).to_list(1000)
    patients = await db.patients.find({"_id": {"$in": [oid(p) for p in patient_ids]}}).to_list(1000)
    d_by_id = {str(d["_id"]): serialize(d) for d in doctors}
    p_by_id = {str(p["_id"]): serialize(p) for p in patients}
    for r in rows:
        r["doctor"] = d_by_id.get(r["doctor_id"])
        r["patient"] = p_by_id.get(r["patient_id"])
    return rows


# ---------------- Suggestions (autocomplete) ----------------
@app.get("/api/suggestions/institutions")
async def list_institutions():
    db = get_db()
    rows = await db.institutions.find().sort("usage_count", -1).to_list(500)
    return serialize_list(rows)


@app.post("/api/suggestions/institutions")
async def add_institution(body: SuggestionIn, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.institutions.update_one(
        {"name": body.name.strip()},
        {"$setOnInsert": {"name": body.name.strip(), "usage_count": 0, "created_at": datetime.now(timezone.utc)},
         "$inc": {"usage_count": 1}},
        upsert=True,
    )
    return {"added": True}


@app.get("/api/suggestions/positions")
async def list_positions():
    db = get_db()
    rows = await db.positions.find().sort("usage_count", -1).to_list(500)
    return serialize_list(rows)


# ---------------- Image upload ----------------
@app.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP, GIF allowed")
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"
    fname = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / fname
    async with aiofiles.open(dest, "wb") as f:
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
        await f.write(content)
    return {"url": f"/api/uploads/{fname}", "filename": fname}
