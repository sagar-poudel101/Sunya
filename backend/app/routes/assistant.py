from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from rag.legal_rag import query_rag

router = APIRouter(prefix="/api/analyze", tags=["assistant"])

class AnalysisRequest(BaseModel):
    user_input: str

@router.post("")
def analyze_workplace_incident(payload: AnalysisRequest):
    if not payload.user_input.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User input cannot be empty."
        )
    try:
        result = query_rag(payload.user_input)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during analysis: {str(e)}"
        )
