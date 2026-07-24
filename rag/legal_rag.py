import os
import json
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

from rag.embedder import DocumentIndex
from rag.prompts import AnalysisResponse, SYSTEM_INSTRUCTION

# Load environment variables
load_dotenv()

# Initialize Document Index
document_index = DocumentIndex()

def query_rag(user_input: str) -> dict:
    # 1. Retrieve relevant chunks
    retrieved_chunks = document_index.query(user_input, top_k=4)
    
    # 2. Build context string
    context_parts = []
    for chunk in retrieved_chunks:
        filename = chunk["metadata"]["filename"]
        page_num = chunk["metadata"]["page_number"]
        content = chunk["content"]
        context_parts.append(f"Source: {filename} (Page {page_num})\nContent: {content}\n---")
    context_str = "\n".join(context_parts)
    
    # 3. Check for GEMINI_API_KEY
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if api_key:
        print("Using Gemini API for legal RAG generation...")
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"User Input: {user_input}\n\nDocument Context (retrieved excerpts):\n{context_str}"
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AnalysisResponse,
                    system_instruction=SYSTEM_INSTRUCTION
                )
            )
            
            # The response.text is guaranteed to be a valid JSON matching AnalysisResponse
            return json.loads(response.text)
            
        except Exception as e:
            print(f"Error calling Gemini API: {e}. Falling back to offline response.")
            # Fall through to offline response
    
    # Offline Fallback Response
    print("GEMINI_API_KEY not found or error occurred. Generating offline/local response.")
    
    # Formulate helper citation list
    citations = []
    category = "General Inquiry"
    risk_level = "Medium Risk"
    
    for chunk in retrieved_chunks:
        fn = chunk["metadata"]["filename"]
        pg = chunk["metadata"]["page_number"]
        citations.append(f"- {fn} (Page {pg})")
        
        # Simple heuristic mapping for classification
        low_content = chunk["content"].lower()
        if "harassment" in low_content or "sexual" in low_content:
            category = "Workplace Harassment"
            risk_level = "High Risk"
        elif "wage" in low_content or "pay" in low_content or "salary" in low_content or "compensation" in low_content:
            category = "Compensation / Wage Issue"
        elif "labor" in low_content or "labour" in low_content or "overtime" in low_content:
            category = "Labor Rights Dispute"

    citation_str = "\n".join(citations) if citations else "No matching legal document chunks found."
    
    # Construct fallback text with exact retrieved text excerpts
    excerpt_str = ""
    for i, chunk in enumerate(retrieved_chunks[:2]):
        fn = chunk["metadata"]["filename"]
        pg = chunk["metadata"]["page_number"]
        excerpt_str += f"\nExcerpts from {fn} (Page {pg}):\n> {chunk['content'][:300]}...\n"

    reasoning = (
        "⚠️ [LOCAL MODE] The AI Assistant is running in offline fallback mode because "
        "GEMINI_API_KEY is not configured in your backend .env file. However, our local "
        "search index queried your documents and retrieved relevant sources."
        f"\n\nRetrieved sources for your inquiry:\n{citation_str}"
        f"\n{excerpt_str}"
        "\nTo enable smart AI legal analysis and automated notices, please add 'GEMINI_API_KEY=your_key' to your backend/.env file."
    )
    
    legal_overview = "Retrieved document references: " + (", ".join([c["metadata"]["filename"] for c in retrieved_chunks[:2]]) if retrieved_chunks else "None")
    
    return {
        "reasoning": reasoning,
        "category": category,
        "riskLevel": risk_level,
        "legalOverview": legal_overview,
        "recommendedActions": [
            {
                "id": "act-configure-env",
                "title": "Configure GEMINI_API_KEY",
                "description": "Add GEMINI_API_KEY to your backend/.env file to activate full AI features.",
                "category": "other",
                "targetRoute": "/",
                "priority": "high"
            },
            {
                "id": "act-view-directory",
                "title": "Consult Legal Experts",
                "description": "Connect with certified legal professionals in our verified directory.",
                "category": "directory",
                "targetRoute": "/directory",
                "priority": "medium"
            }
        ]
    }
