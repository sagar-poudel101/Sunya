from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserLogin, UserRegister


router = APIRouter(prefix="/api/auth", tags=["authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def user_response(user: User) -> dict:
    """Return only safe, client-facing user fields."""
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "isAnonymous": False,
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=pwd_context.hash(payload.password),
        phone=payload.phone.strip(),
        age=payload.age,
        gender=payload.gender,
        birthday=payload.birthday,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"success": True, "user": user_response(user)}


@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {"success": True, "user": user_response(user)}
