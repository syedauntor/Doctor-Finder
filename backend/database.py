"""Database connection and helpers."""
import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_db() -> AsyncIOMotorDatabase:
    global _client, _db
    if _db is None:
        mongo_url = os.environ["MONGO_URL"]
        db_name = os.environ["DB_NAME"]
        _client = AsyncIOMotorClient(mongo_url)
        _db = _client[db_name]
    return _db


async def init_indexes() -> None:
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.doctors.create_index("email")
    await db.doctors.create_index("user_id")
    await db.doctors.create_index("verification_status")
    await db.doctors.create_index("rating")
    await db.specializations.create_index("slug", unique=True)
    await db.doctor_specializations.create_index([("doctor_id", 1), ("specialization_id", 1)], unique=True)
    await db.chambers.create_index("doctor_id")
    await db.chamber_schedules.create_index("chamber_id")
    await db.education.create_index("doctor_id")
    await db.awards.create_index("doctor_id")
    await db.research_publications.create_index("doctor_id")
    await db.expertise.create_index("doctor_id")
    await db.current_experience.create_index("doctor_id")
    await db.previous_experience.create_index("doctor_id")
    await db.patients.create_index("email")
    await db.doctor_availability.create_index("doctor_id")
    await db.appointments.create_index([("doctor_id", 1), ("appointment_date", 1)])
    await db.appointments.create_index("patient_id")
    await db.doctor_registration_requests.create_index("status")
    await db.institutions.create_index("name", unique=True)
    await db.positions.create_index("title", unique=True)
    await db.departments.create_index("slug", unique=True)
    await db.login_attempts.create_index("identifier")
