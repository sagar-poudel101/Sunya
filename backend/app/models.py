# app/models.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    birthday = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(Integer, primary_key=True, index=True)
    raw_text = Column(Text, nullable=True)
    incident_date_time = Column(String, nullable=True)
    location = Column(String, nullable=True)
    witnesses = Column(String, nullable=True)
    impact_tasks = Column(Boolean, default=False)
    impact_pay = Column(Boolean, default=False)
    impact_evaluation = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class WhistleblowerReport(Base):
    __tablename__ = "whistleblower_reports"

    id = Column(Integer, primary_key=True, index=True)
    target_authority = Column(String, nullable=False)
    report_details = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)