from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from rag.legal_rag import ask
from rag.career_rag import generate_script

router = APIRouter(prefix="/api/analyze", tags=["assistant"])

class AnalysisRequest(BaseModel):
    user_input: str

CAREER_KEYWORDS = [
    "scope", "salary", "raise", "review", "interrupted", 
    "manager", "boss", "promotion", "credit", "career", "carrier",
    "coaching", "creep", "leadership", "negotiate", 
    "negotiation", "talked over", "spoke over", "meeting"
]

@router.post("")
def analyze_workplace_incident(payload: AnalysisRequest):
    if not payload.user_input.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User input cannot be empty."
        )
    
    lower_query = payload.user_input.lower()
    
    # -----------------------------------------------------------------------
    # INTENT ROUTER: Check if query contains career/coaching keywords
    # -----------------------------------------------------------------------
    if any(keyword in lower_query for keyword in CAREER_KEYWORDS):
        try:
            # Determine correct scenario
            scenario = "custom"
            if any(w in lower_query for w in ["salary", "pay", "raise", "negotiate"]):
                scenario = "salary-negotiation"
            elif any(w in lower_query for w in ["interrupt", "talk", "spoke", "meeting"]):
                scenario = "meeting-interjection"
            elif any(w in lower_query for w in ["p&l", "budget", "authority"]):
                scenario = "pl-authority"
            elif any(w in lower_query for w in ["review", "evaluate", "appraisal"]):
                scenario = "performance-review"
            elif any(w in lower_query for w in ["scope", "creep", "expansion"]):
                scenario = "scope-expansion"

            # Call the user's career coaching scripting model
            result = generate_script(scenario=scenario, tone="assertive", user_context=payload.user_input)

            if result.error:
                # Fallback to general explanation if LLM generation throws an error
                response_text = f"Coaching mode activated for query: '{payload.user_input}'.\n\nError in generator: {result.error}."
            else:
                # Format script lines and breakdown into beautiful markdown text
                response_text = "Here is a verbal script you can use:\n\n"
                response_text += "\n".join(f"> **\"{line}\"**" for line in result.script)
                
                if result.framework:
                    response_text += f"\n\n### Tactical Framework:\n{result.framework}"
                
                if result.breakdown:
                    response_text += "\n\n### Tactical Breakdown:\n"
                    for step in result.breakdown:
                        label = step.get("label", "Tactic")
                        detail = step.get("text", "")
                        response_text += f"- **{label}**: {detail}\n"

            legal_overview = "Retrieved career framework coaching guides."
            if result.evidence:
                legal_overview = f"Grounded Context: {result.evidence}"

            return {
                "reasoning": response_text,
                "category": "Career & Leadership",
                "riskLevel": "Professional Development",
                "legalOverview": legal_overview,
                "recommendedActions": [
                    {
                        "id": "act-1",
                        "title": "Use Coach Script",
                        "description": "Copy or adapt this script for your conversation.",
                        "category": "complaint",
                        "targetRoute": "/drafts",
                        "priority": "medium"
                    }
                ]
            }
        except Exception as e:
            print(f"Career engine failed, falling back to legal RAG: {e}")
            # fall through to legal RAG if career engine fails structurally

    # -----------------------------------------------------------------------
    # LEGAL RAG ROUTER: Statutory questions
    # -----------------------------------------------------------------------
    try:
        # Call the user's local sentence-transformer RAG ask function
        result = ask(payload.user_input)
        
        # Rule-based category and risk assignment
        category = "Legal Information"
        risk_level = "Medium Risk"
        
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
