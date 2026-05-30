"""Pydantic models for API requests/responses."""
from datetime import date, datetime
from typing import Optional, Literal, List

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class DoctorLoginIn(BaseModel):
    email: EmailStr
    password: str


class AdminLoginIn(BaseModel):
    email: EmailStr
    password: str


class DoctorRegisterIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    specialty: str
    bmdc_number: str
    experience: str
    message: str = ""
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    doctor_id: Optional[str] = None
    admin_role: Optional[str] = None


# ---------- Doctor profile ----------
class DoctorProfileUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    profile_image: Optional[str] = None
    overview: Optional[str] = None
    years_of_experience: Optional[int] = None
    consultation_fee: Optional[int] = None
    fee_new_patient: Optional[int] = None
    fee_old_patient: Optional[int] = None
    fee_report_checking: Optional[int] = None
    phone: Optional[str] = None
    bmdc_number: Optional[str] = None
    designation: Optional[str] = None
    gender: Optional[str] = None


class EducationIn(BaseModel):
    degree: str
    institution: str
    year: int


class AwardIn(BaseModel):
    title: str
    organization: str
    year: int


class ResearchIn(BaseModel):
    title: str
    journal: str = ""
    year: int = 0
    authors: str = ""
    link: str = ""


class ExpertiseIn(BaseModel):
    title: str
    description: str = ""


class CurrentExperienceIn(BaseModel):
    institution: str
    designation: str = ""
    department: str = ""
    since_year: int = 0


class PreviousExperienceIn(BaseModel):
    institution: str
    position: str = ""
    department: str = ""
    start_year: int = 0
    end_year: int = 0


class ChamberIn(BaseModel):
    name: str
    address: str = ""
    area: str = ""
    city: str = ""
    division: str = ""
    district: str = ""
    upazila: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    map_url: str = ""


class ChamberScheduleIn(BaseModel):
    chamber_id: str
    day_of_week: str
    start_time: str
    end_time: str


# ---------- Appointment ----------
class AppointmentCreateIn(BaseModel):
    doctor_id: str
    patient_name: str
    patient_email: EmailStr
    patient_phone: str
    date_of_birth: Optional[date] = None
    gender: Optional[Literal["male", "female", "other"]] = None
    address: Optional[str] = None
    appointment_date: date
    appointment_time: str
    consultation_type: Literal["in-person", "online"] = "in-person"
    notes: str = ""


class AppointmentStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "cancelled", "completed"]
    doctor_notes: Optional[str] = None


# ---------- Availability ----------
class AvailabilityIn(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: str
    end_time: str
    slot_duration: int = 30
    is_active: bool = True


# ---------- Admin ----------
class RegistrationActionIn(BaseModel):
    notes: str = ""


class VerifyDoctorIn(BaseModel):
    is_verified: bool
    notes: str = ""


# ---------- Specializations / Suggestions ----------
class SpecializationLinkIn(BaseModel):
    specialization_id: str
    is_primary: bool = False


class SuggestionIn(BaseModel):
    name: str
