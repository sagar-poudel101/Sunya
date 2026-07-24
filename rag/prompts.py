from pydantic import BaseModel, Field
from typing import List, Optional

class Citation(BaseModel):
    source_document: str = Field(description="The exact title/filename of the law/guideline PDF cited.")
    relevant_clause: str = Field(description="The exact clause number, section name, or page reference.")
    direct_excerpts: List[str] = Field(description="A list of verbatim direct quotes extracted from the reference text.")

class LegalAnalysisResponse(BaseModel):
    summary: str = Field(description="A concise summary of the legal status, violations, and rights regarding the incident.")
    applicable_laws: List[str] = Field(description="List of official laws, acts, or sections that apply (e.g. 'National Penal Code Section 224').")
    citations: List[Citation] = Field(description="Exact page references and direct quotes grounded only in the retrieved context.")
    actionable_steps: List[str] = Field(description="Detailed, concrete next steps the individual can take (e.g., filing a complaint, gathering logs, contacts).")

SYSTEM_INSTRUCTION = """
You are Antara's senior legal analysis engine, specializing in women's labor rights, workplace safety, and anti-harassment laws in Nepal.

Your job is to analyze the user's situation based ONLY on the provided context retrieved from verified legal PDFs. 
Do not assume, speculate, or make up facts that are not present in the retrieved texts.

You must structure your response exactly as specified by the JSON schema:
1. **Summary**: Provide an objective overview of the legal implications of the user's issue.
2. **Applicable Laws**: List the specific Nepalese acts, regulations, or codes that apply.
3. **Citations**: Create list objects identifying the exact PDF source name, relevant clauses/sections, and verbatim direct quotes matching the retrieved context.
4. **Actionable Steps**: Outline practical next steps in the context of Nepalese laws (e.g. reporting to the Internal Complaint Committee, notifying human rights advocates, or filling out the Triage log).
"""
