"""Seed demo data: admin user, a sample doctor, specializations, departments, etc."""
import os
from datetime import datetime, timezone

from slugify import slugify

from auth import hash_password
from database import get_db


SPECIALIZATIONS = [
    "Gynecologist & Obstetrician",
    "Medicine Specialist",
    "Cardiologist",
    "Pediatrician",
    "General Surgeon",
    "Otolaryngologists (ENT)",
    "Dermatologist",
    "Orthopedic Surgeon",
    "Neurologist",
    "Psychiatrist",
    "Ophthalmologist",
    "Urologist",
    "Gastroenterologist",
    "Endocrinologist",
    "Pulmonologist",
    "Oncologist",
    "Nephrologist",
    "Rheumatologist",
    "Dentist",
    "Radiologist",
]

DEPARTMENTS = [
    "Cardiology", "Neurology", "Pediatrics", "Gynecology", "Surgery",
    "Internal Medicine", "Orthopedics", "Dermatology", "ENT", "Ophthalmology",
    "Urology", "Gastroenterology", "Endocrinology", "Oncology", "Radiology",
    "Psychiatry", "Anesthesiology", "Emergency Medicine", "Family Medicine", "Dentistry",
]

INSTITUTIONS = [
    "Bangladesh Medical College", "Dhaka Medical College", "Sir Salimullah Medical College",
    "Chittagong Medical College", "Rajshahi Medical College", "Sylhet MAG Osmani Medical College",
    "Mymensingh Medical College", "Bangladesh College of Physicians and Surgeons",
    "Bangabandhu Sheikh Mujib Medical University", "Holy Family Red Crescent Hospital",
    "Ibn Sina Hospital", "Square Hospital", "United Hospital", "Apollo Hospitals Dhaka",
    "Popular Diagnostic Centre", "Lab Aid Hospital", "Bangladesh Specialized Hospital",
    "National Institute of Cardiovascular Diseases", "Dhaka Shishu Hospital",
    "National Institute of Cancer Research and Hospital",
]

POSITIONS = [
    "Professor", "Associate Professor", "Assistant Professor", "Senior Consultant",
    "Consultant", "Medical Officer", "Resident Physician", "Registrar", "Senior Registrar",
    "Chief Consultant", "Specialist", "Junior Consultant", "Lecturer", "Clinical Fellow",
    "House Officer", "Intern", "Chief of Department", "Head of Department", "Director",
    "Medical Director",
]


async def seed_all() -> None:
    db = get_db()
    now = datetime.now(timezone.utc)

    # --- Specializations
    for name in SPECIALIZATIONS:
        await db.specializations.update_one(
            {"slug": slugify(name)},
            {"$setOnInsert": {"name": name, "slug": slugify(name), "created_at": now}},
            upsert=True,
        )

    # --- Departments
    for name in DEPARTMENTS:
        await db.departments.update_one(
            {"slug": slugify(name)},
            {"$setOnInsert": {"name": name, "slug": slugify(name), "created_at": now}},
            upsert=True,
        )

    # --- Institutions
    for name in INSTITUTIONS:
        await db.institutions.update_one(
            {"name": name},
            {"$setOnInsert": {"name": name, "usage_count": 0, "created_at": now}},
            upsert=True,
        )

    # --- Positions
    for title in POSITIONS:
        await db.positions.update_one(
            {"title": title},
            {"$setOnInsert": {"title": title, "usage_count": 0, "created_at": now}},
            upsert=True,
        )

    # --- Admin user
    admin_email = os.environ["DEMO_ADMIN_EMAIL"]
    admin_password = os.environ["DEMO_ADMIN_PASSWORD"]
    existing_admin = await db.users.find_one({"email": admin_email})
    if existing_admin is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Demo Admin",
            "role": "admin",
            "admin_role": "super_admin",
            "created_at": now,
        })
    else:
        # update password if changed
        from auth import verify_password
        if not verify_password(admin_password, existing_admin["password_hash"]):
            await db.users.update_one(
                {"_id": existing_admin["_id"]},
                {"$set": {"password_hash": hash_password(admin_password)}},
            )

    # --- Demo Doctor user + doctor profile
    doc_email = os.environ["DEMO_DOCTOR_EMAIL"]
    doc_password = os.environ["DEMO_DOCTOR_PASSWORD"]
    existing_doc_user = await db.users.find_one({"email": doc_email})

    if existing_doc_user is None:
        # Create doctor profile first
        gyn_spec = await db.specializations.find_one({"slug": "gynecologist-obstetrician"})
        doctor_doc = {
            "name": "Dr. Farhana Rahman",
            "title": "MBBS, FCPS (Gynecology & Obstetrics)",
            "profile_image": "https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=400",
            "overview": "Dr. Farhana Rahman is a renowned gynecologist with over 15 years of experience in women's healthcare. She specializes in high-risk pregnancies, laparoscopic surgery, and infertility treatments.",
            "years_of_experience": 15,
            "consultation_fee": 1500,
            "fee_new_patient": 1500,
            "fee_old_patient": 1000,
            "fee_report_checking": 500,
            "phone": "+880 1712-345678",
            "email": doc_email,
            "bmdc_number": "A-12345",
            "designation": "Senior Consultant",
            "gender": "female",
            "rating": 4.8,
            "total_reviews": 124,
            "is_verified": True,
            "verification_status": "approved",
            "verification_notes": "Approved during seeding.",
            "created_at": now,
        }
        doctor_res = await db.doctors.insert_one(doctor_doc)
        doctor_id = str(doctor_res.inserted_id)

        # Link primary specialization
        if gyn_spec:
            await db.doctor_specializations.insert_one({
                "doctor_id": doctor_id,
                "specialization_id": str(gyn_spec["_id"]),
                "is_primary": True,
                "created_at": now,
            })

        # Create user
        user_res = await db.users.insert_one({
            "email": doc_email,
            "password_hash": hash_password(doc_password),
            "name": "Dr. Farhana Rahman",
            "role": "doctor",
            "doctor_id": doctor_id,
            "created_at": now,
        })
        # Back-link user_id on doctor
        await db.doctors.update_one({"_id": doctor_res.inserted_id}, {"$set": {"user_id": str(user_res.inserted_id)}})

        # Education
        await db.education.insert_many([
            {"doctor_id": doctor_id, "degree": "MBBS", "institution": "Dhaka Medical College", "year": 2008, "created_at": now},
            {"doctor_id": doctor_id, "degree": "FCPS (Gyn & Obs)", "institution": "Bangladesh College of Physicians and Surgeons", "year": 2014, "created_at": now},
        ])
        # Current experience
        await db.current_experience.insert_one({
            "doctor_id": doctor_id,
            "institution": "Square Hospital",
            "designation": "Senior Consultant",
            "department": "Gynecology",
            "since_year": 2018,
            "created_at": now,
        })
        # Chamber
        chamber_res = await db.chambers.insert_one({
            "doctor_id": doctor_id,
            "name": "Square Hospital Chamber",
            "address": "18/F Bir Uttam Qazi Nuruzzaman Sarak",
            "area": "West Panthapath",
            "city": "Dhaka",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Dhanmondi",
            "latitude": 23.7515,
            "longitude": 90.3805,
            "map_url": "https://maps.google.com/?q=23.7515,90.3805",
            "created_at": now,
        })
        # Chamber schedule
        for day in ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]:
            await db.chamber_schedules.insert_one({
                "chamber_id": str(chamber_res.inserted_id),
                "day_of_week": day,
                "start_time": "09:00",
                "end_time": "17:00",
                "created_at": now,
            })
        # Doctor availability (for appointment booking)
        for dow in [0, 1, 2, 3, 4]:  # Sun..Thu
            await db.doctor_availability.insert_one({
                "doctor_id": doctor_id,
                "day_of_week": dow,
                "start_time": "09:00",
                "end_time": "17:00",
                "slot_duration": 30,
                "is_active": True,
                "created_at": now,
            })
        # Expertise
        await db.expertise.insert_many([
            {"doctor_id": doctor_id, "title": "High Risk Pregnancy", "description": "Specialized care for complicated pregnancies.", "created_at": now},
            {"doctor_id": doctor_id, "title": "Laparoscopic Surgery", "description": "Minimally invasive gynecological surgeries.", "created_at": now},
        ])
    else:
        from auth import verify_password
        if not verify_password(doc_password, existing_doc_user["password_hash"]):
            await db.users.update_one(
                {"_id": existing_doc_user["_id"]},
                {"$set": {"password_hash": hash_password(doc_password)}},
            )

    # --- Additional sample doctors for richer demo
    sample_doctors = [
        {
            "name": "Dr. Kamrul Hasan", "title": "MBBS, MD (Cardiology)",
            "spec_slug": "cardiologist", "designation": "Professor",
            "department": "Cardiology", "institution": "National Institute of Cardiovascular Diseases",
            "phone": "+880 1715-111222", "email": "dr.kamrul@example.com",
            "bmdc": "A-22134", "fee": 2000, "exp": 20, "gender": "male",
            "image": "https://images.pexels.com/photos/612608/pexels-photo-612608.jpeg?auto=compress&cs=tinysrgb&w=400",
            "division": "Dhaka",
        },
        {
            "name": "Dr. Sabrina Akter", "title": "MBBS, DCH (Pediatrics)",
            "spec_slug": "pediatrician", "designation": "Associate Professor",
            "department": "Pediatrics", "institution": "Dhaka Shishu Hospital",
            "phone": "+880 1717-333444", "email": "dr.sabrina@example.com",
            "bmdc": "A-33215", "fee": 1200, "exp": 12, "gender": "female",
            "image": "https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=400",
            "division": "Dhaka",
        },
        {
            "name": "Dr. Rafiqul Islam", "title": "MBBS, FCPS (Medicine)",
            "spec_slug": "medicine-specialist", "designation": "Senior Consultant",
            "department": "Internal Medicine", "institution": "Square Hospital",
            "phone": "+880 1719-555666", "email": "dr.rafiqul@example.com",
            "bmdc": "A-44321", "fee": 1500, "exp": 18, "gender": "male",
            "image": "https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=400",
            "division": "Chittagong",
        },
        {
            "name": "Dr. Nadia Sultana", "title": "MBBS, FCPS (Dermatology)",
            "spec_slug": "dermatologist", "designation": "Consultant",
            "department": "Dermatology", "institution": "Ibn Sina Hospital",
            "phone": "+880 1722-777888", "email": "dr.nadia@example.com",
            "bmdc": "A-55432", "fee": 1000, "exp": 8, "gender": "female",
            "image": "https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=400",
            "division": "Dhaka",
        },
    ]
    for s in sample_doctors:
        if await db.doctors.find_one({"email": s["email"]}):
            continue
        spec = await db.specializations.find_one({"slug": s["spec_slug"]})
        doc = {
            "name": s["name"], "title": s["title"],
            "profile_image": s["image"], "overview": f"{s['name']} is a respected {s['department'].lower()} specialist with extensive clinical experience.",
            "years_of_experience": s["exp"], "consultation_fee": s["fee"],
            "fee_new_patient": s["fee"], "fee_old_patient": int(s["fee"] * 0.7),
            "fee_report_checking": int(s["fee"] * 0.3),
            "phone": s["phone"], "email": s["email"],
            "bmdc_number": s["bmdc"], "designation": s["designation"],
            "gender": s["gender"], "rating": 4.5, "total_reviews": 50,
            "is_verified": True, "verification_status": "approved",
            "verification_notes": "Seeded sample doctor.", "created_at": now,
        }
        res = await db.doctors.insert_one(doc)
        did = str(res.inserted_id)
        if spec:
            await db.doctor_specializations.insert_one({
                "doctor_id": did, "specialization_id": str(spec["_id"]),
                "is_primary": True, "created_at": now,
            })
        await db.current_experience.insert_one({
            "doctor_id": did, "institution": s["institution"],
            "designation": s["designation"], "department": s["department"],
            "since_year": 2020, "created_at": now,
        })
        await db.chambers.insert_one({
            "doctor_id": did, "name": f"{s['institution']} Chamber",
            "address": "Chamber Address", "area": "Main Area",
            "city": s["division"], "division": s["division"],
            "district": s["division"], "upazila": "",
            "latitude": None, "longitude": None, "map_url": "",
            "created_at": now,
        })
        for dow in [0, 1, 2, 3, 4]:
            await db.doctor_availability.insert_one({
                "doctor_id": did, "day_of_week": dow,
                "start_time": "10:00", "end_time": "18:00",
                "slot_duration": 30, "is_active": True, "created_at": now,
            })


async def write_test_credentials() -> None:
    """Write test credentials file."""
    path = "/app/memory/test_credentials.md"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    content = f"""# Test Credentials

## Demo Admin
- Email: `{os.environ['DEMO_ADMIN_EMAIL']}`
- Password: `{os.environ['DEMO_ADMIN_PASSWORD']}`
- Role: admin (super_admin)
- Login endpoint: `POST /api/auth/admin/login`

## Demo Doctor (Dr. Farhana Rahman)
- Email: `{os.environ['DEMO_DOCTOR_EMAIL']}`
- Password: `{os.environ['DEMO_DOCTOR_PASSWORD']}`
- Role: doctor (verified)
- Login endpoint: `POST /api/auth/doctor/login`
- Availability: Sun-Thu 9:00 AM - 5:00 PM (30-min slots)

## Auth Endpoints
- POST `/api/auth/doctor/login`
- POST `/api/auth/doctor/register` (creates pending registration request)
- POST `/api/auth/admin/login`
- GET  `/api/auth/me`
- POST `/api/auth/logout`
"""
    with open(path, "w") as f:
        f.write(content)
