from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from rag.legal_rag import ask

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
        # Call the user's local sentence-transformer RAG ask function
        result = ask(payload.user_input)
        
        # Rule-based category and risk assignment
        category = "Legal Information"
        risk_level = "Medium Risk"
        
        lower_query = payload.user_input.lower()
        if any(w in lower_query for w in ["fire", "fired", "layoff", "harass", "abuse", "threat"]):
            risk_level = "High Risk"
            category = "Workplace Protection"
        elif any(w in lower_query for w in ["salary", "wage", "contract", "pay"]):
            category = "Employment Rights"
            
        legal_overview = ""
        recommended_actions = []
        
        if result.answered:
            # Build list of references from sources
            refs = list(set(s.get("reference", "") for s in result.sources if s.get("reference")))
            legal_overview = f"Applicable provisions: {', '.join(refs)}" if refs else "Nepali legal standard matches found."
            
            recommended_actions = [
                {
                    "id": "act-1",
                    "title": "Generate Formal HR Complaint",
                    "description": "Convert this situation into an HR-ready notice.",
                    "category": "complaint",
                    "targetRoute": "/drafts",
                    "priority": "high"
                },
                {
                    "id": "act-2",
                    "title": "Store Evidence in Triage Vault",
                    "description": "Privately record incident details.",
                    "category": "evidence",
                    "targetRoute": "/vault",
                    "priority": "high"
                }
            ]
        else:
            legal_overview = "No direct statutory matches found in our local legal index."
            recommended_actions = [
                {
                    "id": "act-3",
                    "title": "Support Directory",
                    "description": "Connect with verified Nepalese lawyers & counselors.",
                    "category": "directory",
                    "targetRoute": "/directory",
                    "priority": "high"
                }
            ]
            
        return {
            "reasoning": result.text,
            "category": category,
            "riskLevel": risk_level,
            "legalOverview": legal_overview,
            "recommendedActions": recommended_actions
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during analysis: {str(e)}"
        )
