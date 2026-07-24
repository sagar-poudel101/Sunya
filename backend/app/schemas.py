# app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    age: Optional[int] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class IncidentCreate(BaseModel):
    raw_text: Optional[str] = None
    incident_date_time: Optional[str] = None
    location: Optional[str] = None
    witnesses: Optional[str] = None
    impact_tasks: bool = False
    impact_pay: bool = False
    impact_evaluation: bool = False

class WhistleblowCreate(BaseModel):
    authority_target: str
    whistleblow_message: str
    is_anonymous: bool = True

# ➕ NEW DIRECTORY RESPONSE SCHEMA
class SupportSpecialistResponse(BaseModel):
    id: int
    name: str
    specialty: str
    title: str
    organization: str
    experience_years: int
    location: str
    contact_phone: str
    contact_email: str
    rating: str
    bio: str
    is_verified: bool

    class Config:
        from_attributes = True