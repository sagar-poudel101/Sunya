# app/routes/auth.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
def register_user(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        return {"success": False, "message": "Email already registered."}

    hashed_pwd = pwd_context.hash(payload.password)
    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=hashed_pwd,
        phone=payload.phone,
        age=payload.age,
        gender=payload.gender,
        birthday=payload.birthday
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"success": True, "message": "Registration successful."}

@router.post("/login")
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        return {"success": False, "message": "Invalid email or password."}

    return {
        "success": True,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "is_anonymous": False
        }
    }