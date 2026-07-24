from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import IncidentReport
from app.schemas import IncidentCreate

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    try:
        db_incident = IncidentReport(
            raw_text=payload.raw_text,
            incident_date_time=payload.incident_date_time,
            location=payload.location,
            witnesses=payload.witnesses,
            impact_tasks=payload.impact_tasks,
            impact_pay=payload.impact_pay,
            impact_evaluation=payload.impact_evaluation
        )
        db.add(db_incident)
        db.commit()
        db.refresh(db_incident)
        return {"success": True, "id": db_incident.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log incident: {str(e)}"
        )
