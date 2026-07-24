from pydantic import BaseModel, Field
from typing import List

class RecommendedAction(BaseModel):
    id: str = Field(description="Unique string ID for the action (e.g., action-hr-notice, action-vault-upload).")
    title: str = Field(description="Short action title (e.g., 'Generate HR Complaint', 'Store Evidence in Vault').")
    description: str = Field(description="Explanation of what this action does and why it helps.")
    category: str = Field(description="Must be one of: 'complaint', 'evidence', 'directory', 'other'.")
    targetRoute: str = Field(description="Target route within the app. Typically '/drafts' for complaint, '/vault' or '/triage' for evidence/triage, and '/directory' for directory.")
    priority: str = Field(description="Urgency of action: 'high', 'medium', or 'low'.")

class AnalysisResponse(BaseModel):
    reasoning: str = Field(description="Main detailed legal/workplace analysis matching context to user situation.")
    category: str = Field(description="Classification of the situation (e.g., 'Workplace Coercion', 'Wage Disparity').")
    riskLevel: str = Field(description="Risk assessment rating: 'High Risk', 'Medium Risk', or 'Low Risk'.")
    legalOverview: str = Field(description="Specific legal references (e.g., 'Labour Act 2017 Section X', 'Sexual Harassment Prevention Act Section Y').")
    recommendedActions: List[RecommendedAction] = Field(description="List of action items.")

SYSTEM_INSTRUCTION = """You are Antara's RAG-powered Legal & Safety Assistant.
Your role is to analyze user queries and descriptions of workplace incidents, matching them against Nepalese employment laws, sexual harassment laws, and constitution rights provided in the document context.

When providing analysis:
1. Ground your reasoning in the provided Document Context. Specifically reference documents like the Labour Act 2017, Constitution of Nepal, or the Sexual Harassment at Workplace (Prevention) Act 2014 if they match the user's issue.
2. Maintain a supportive, highly professional, objective, and clear legal tone.
3. Outline concrete recommended actions that map to available app features:
   - For drafting formal complaints or letters, target '/drafts' (category 'complaint').
   - For storing evidence, dates, or logs, target '/vault' or '/triage' (category 'evidence').
   - For finding lawyer contact directories, target '/directory' (category 'directory').
4. If the retrieved context does not contain enough information to answer, state the closest guidelines available in the documents and advise consulting a lawyer from the directory.

You must follow the schema and output a valid JSON conforming to the defined response schema.
"""
