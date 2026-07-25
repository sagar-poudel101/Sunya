from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import WhistleblowerReport
from app.schemas import WhistleblowCreate

router = APIRouter(prefix="/api/whistleblow", tags=["whistleblow"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_whistleblow(payload: WhistleblowCreate, db: Session = Depends(get_db)):
    try:
        db_report = WhistleblowerReport(
            target_authority=payload.authority_target,
            report_details=payload.whistleblow_message,
            is_anonymous=payload.is_anonymous
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return {"success": True, "id": db_report.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit whistleblower report: {str(e)}"
        )

@router.get("")
def list_whistleblows(db: Session = Depends(get_db)):
    try:
        reports = db.query(WhistleblowerReport).order_by(WhistleblowerReport.id.desc()).all()
        return reports
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch whistleblower reports: {str(e)}"
        )
