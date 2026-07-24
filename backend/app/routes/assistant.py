import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

router = APIRouter(prefix="/api/analyze", tags=["assistant"])

class AnalysisRequest(BaseModel):
    user_input: str

# Define structured schemas directly here to avoid external imports
class Citation(BaseModel):
    source_document: str = Field(description="The exact title/filename of the law/guideline PDF cited.")
    relevant_clause: str = Field(description="The exact clause number, section name, or page reference.")
    direct_excerpts: List[str] = Field(description="A list of verbatim direct quotes extracted from the reference text.")

class LegalAnalysisResponse(BaseModel):
    summary: str = Field(description="A concise summary of the legal status, violations, and rights regarding the incident.")
    applicable_laws: List[str] = Field(description="List of official laws, acts, or sections that apply (e.g. 'National Penal Code Section 224').")
    citations: List[Citation] = Field(description="Exact page references and direct quotes grounded only in the reference context.")
    actionable_steps: List[str] = Field(description="Detailed, concrete next steps the individual can take (e.g., filing a complaint, gathering logs, contacts).")

SYSTEM_INSTRUCTION = """
You are Antara's senior legal analysis engine, specializing in women's labor rights, workplace safety, and anti-harassment laws in Nepal.

Your job is to analyze the user's situation and provide legal analysis:
1. **Summary**: Provide an objective overview of the legal implications of the user's issue.
2. **Applicable Laws**: List the specific Nepalese acts, regulations, or codes that apply (e.g., Sexual Harassment at Workplace Prevention Act 2071, National Penal Code 2074).
3. **Citations**: Identify the source name, relevant clauses/sections, and verbatim direct quotes.
4. **Actionable Steps**: Outline practical next steps in the context of Nepalese laws.
"""

def generate_offline_fallback(user_query: str) -> dict:
    """Generate a valid, structured mock-up response for local testing when no API key is present."""
    return {
        "summary": f"Offline mode: Analysis generated locally for query: '{user_query}'. Safety guidelines and labor protection matches found.",
        "applicable_laws": [
            "Sexual Harassment at Workplace Prevention Act, 2071",
            "Nepal Labor Act, 2074"
        ],
        "citations": [
            {
                "source_document": "Sexual Harassment at Workplace (Prevention) Act, 2071",
                "relevant_clause": "Section 4 & 5",
                "direct_excerpts": ["No one shall commit sexual harassment in the workplace or during work-related activities..."]
            }
        ],
        "actionable_steps": [
            "Submit a confidential log detailing dates, times, and actions inside the Antara Incident Ledger.",
            "Utilize the secure Whistleblower channel for anonymous reporting.",
            "Contact FWLD or LACC from the Support Directory for professional legal advice in Nepal."
        ]
    }

@router.post("")
def analyze_workplace_incident(payload: AnalysisRequest):
    if not payload.user_input.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User input cannot be empty."
        )

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found. Returning offline legal analysis fallback.")
        return generate_offline_fallback(payload.user_input)

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"User situation query: {payload.user_input}"
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=LegalAnalysisResponse,
                temperature=0.1
            ),
        )
        import json
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API call failed: {e}. Falling back to offline context extraction.")
        return generate_offline_fallback(payload.user_input)
