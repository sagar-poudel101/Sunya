# seed.py
from app.database import SessionLocal, engine, Base
from app.models import User, IncidentReport, WhistleblowerReport
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()

    # Clear existing dummy data (optional)
    db.query(User).delete()
    db.query(IncidentReport).delete()
    db.query(WhistleblowerReport).delete()
    db.commit()

    print("🌱 Seeding database...")

    # 1. Create Dummy Users
    dummy_users = [
        User(
            name="Maya Sharma",
            email="maya@example.com",
            password_hash=pwd_context.hash("Password123!"),
            phone="+977 9800000001",
            age=26,
            gender="Female",
            birthday="1998-05-14"
        ),
        User(
            name="Aarav Patel",
            email="aarav@example.com",
            password_hash=pwd_context.hash("Password123!"),
            phone="+977 9800000002",
            age=30,
            gender="Male",
            birthday="1994-11-22"
        )
    ]

    # 2. Create Dummy Incident Reports
    dummy_incidents = [
        IncidentReport(
            raw_text="Manager made inappropriate comments during late evening performance review.",
            incident_date_time="2026-07-20T18:30",
            location="Executive Conference Room B",
            witnesses="Senior Associate Rahul",
            impact_tasks=True,
            impact_pay=False,
            impact_evaluation=True
        )
    ]

    # 3. Create Dummy Whistleblower Reports
    dummy_whistleblows = [
        WhistleblowerReport(
            target_authority="National Human Rights Commission (NHRC)",
            report_details="Systemic withholding of overtime compensation across ground staff operations.",
            is_anonymous=True
        )
    ]

    db.add_all(dummy_users)
    db.add_all(dummy_incidents)
    db.add_all(dummy_whistleblows)

    db.commit()
    db.close()

    print("✅ Database successfully seeded!")
    print("👉 Login credentials: Email: maya@example.com | Password: Password123!")

if __name__ == "__main__":
    seed_database()
