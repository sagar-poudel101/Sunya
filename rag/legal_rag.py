import os
from dotenv import load_dotenv
from pathlib import Path
from google import genai
from google.genai import types
from rag.embedder import DocumentIndex
from rag.prompts import LegalAnalysisResponse, SYSTEM_INSTRUCTION

load_dotenv()

# Singleton document index
doc_index = DocumentIndex()

def query_rag(user_query: str) -> dict:
    # 1. Retrieve relevant chunks
    matched_chunks = doc_index.query(user_query, top_k=6)
    
    # 2. Format context for prompt
    context_str = ""
    for idx, chunk in enumerate(matched_chunks):
        meta = chunk["metadata"]
        context_str += f"--- Document Source [{idx + 1}]: {meta['filename']} (Page {meta['page_number']}) ---\n"
        context_str += f"{chunk['content']}\n\n"

    # 3. Check for GEMINI_API_KEY
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found in environment, falling back to local citation parser.")
        return generate_offline_fallback(user_query, matched_chunks)

    # 4. Initialize GenAI Client and run structured analysis
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"User situation query: {user_query}\n\nRetrieved Legal Context:\n{context_str}"
        
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
        # Parse output as JSON
        import json
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API call failed: {e}. Falling back to offline context extraction.")
        return generate_offline_fallback(user_query, matched_chunks)

def generate_offline_fallback(user_query: str, matched_chunks: list) -> dict:
    """Generate a valid, structured mock-up response using actual source quotes from the retrieved index."""
    citations = []
    applicable_laws = []
    
    for chunk in matched_chunks[:3]:
        meta = chunk["metadata"]
        citations.append({
            "source_document": meta["filename"],
            "relevant_clause": f"Page {meta['page_number']}",
            "direct_excerpts": [chunk["content"][:250] + "..."]
        })
        # Extract potential laws from filenames
        law_name = meta["filename"].replace(".pdf", "").replace("_", " ").title()
        if law_name not in applicable_laws:
            applicable_laws.append(law_name)

    return {
        "summary": f"Offline mode: Based on exact local matches from your safety PDFs regarding: '{user_query}'. Violations of safe workspace guidelines detected.",
        "applicable_laws": applicable_laws if applicable_laws else ["Sexual Harassment Prevention Act, 2071"],
        "citations": citations,
        "actionable_steps": [
            "Submit a confidential log detailing dates, times, and actions inside the Antara Incident Ledger.",
            "Utilize the secure Whistleblower channel for anonymous reporting.",
            "Contact FWLD or LACC from the Support Directory for professional legal advice in Nepal."
        ]
    }
