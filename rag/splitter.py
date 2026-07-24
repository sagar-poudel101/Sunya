class TextSplitter:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> list:
        """Split a single string into overlapping chunks."""
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            chunks.append(text[start:end])
            if end == text_len:
                break
            start += self.chunk_size - self.chunk_overlap
        return chunks

    def split_documents(self, documents: list) -> list:
        """Split pages of loaded documents into chunks with metadata."""
        all_chunks = []
        for doc in documents:
            for page in doc["pages"]:
                page_text = page["text"]
                page_chunks = self.split_text(page_text)
                for chunk_idx, chunk in enumerate(page_chunks):
                    all_chunks.append({
                        "content": chunk,
                        "metadata": {
                            "filename": doc["filename"],
                            "filepath": doc["filepath"],
                            "doc_type": doc["doc_type"],
                            "page_number": page["page_number"],
                            "chunk_index": chunk_idx
                        }
                    })
        return all_chunks
