import os
from pathlib import Path
from pypdf import PdfReader

class PDFLoader:
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)

    def load_pdf_text(self, pdf_path: Path) -> list:
        """Extract text page by page from a single PDF."""
        try:
            reader = PdfReader(pdf_path)
            pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    pages.append({
                        "page_number": i + 1,
                        "text": text
                    })
            return pages
        except Exception as e:
            print(f"Error reading PDF {pdf_path}: {e}")
            return []

    def load_all_documents(self) -> list:
        """Walk data_dir and load all PDF documents."""
        documents = []
        for root, _, files in os.walk(self.data_dir):
            for file in files:
                if file.endswith(".pdf"):
                    pdf_path = Path(root) / file
                    doc_type = "legal" if "legal" in str(pdf_path).lower() else "career"
                    print(f"Loading {file} ({doc_type})...")
                    pages = self.load_pdf_text(pdf_path)
                    documents.append({
                        "filename": file,
                        "filepath": str(pdf_path),
                        "doc_type": doc_type,
                        "pages": pages
                    })
        return documents
