import json
import os
import math
import re
from pathlib import Path
from typing import List, Dict
from rag.loader import PDFLoader
from rag.splitter import TextSplitter

# Determine directories
RAG_DIR = Path(__file__).resolve().parent
PROJECT_DIR = RAG_DIR.parent
DATA_DIR = PROJECT_DIR / "data"
CACHE_FILE = DATA_DIR / "index_cache.json"

class BM25Retriever:
    def __init__(self, chunks: List[Dict], k1: float = 1.5, b: float = 0.75):
        self.chunks = chunks
        self.k1 = k1
        self.b = b
        self.doc_len = []
        self.avg_doc_len = 0.0
        self.doc_freqs = []
        self.idf = {}
        self.initialize()

    def tokenize(self, text: str) -> List[str]:
        # Simple lowercase tokenization of words
        return re.findall(r'\b\w+\b', text.lower())

    def initialize(self):
        ndocs = len(self.chunks)
        if ndocs == 0:
            return

        total_len = 0
        df = {}

        for chunk in self.chunks:
            tokens = self.tokenize(chunk["content"])
            self.doc_len.append(len(tokens))
            total_len += len(tokens)

            # Count term frequencies
            frequencies = {}
            for token in tokens:
                frequencies[token] = frequencies.get(token, 0) + 1
            self.doc_freqs.append(frequencies)

            # Unique terms in doc to calculate DF
            unique_tokens = set(tokens)
            for token in unique_tokens:
                df[token] = df.get(token, 0) + 1

        self.avg_doc_len = total_len / ndocs

        # Calculate IDF
        for term, freq in df.items():
            self.idf[term] = math.log((ndocs - freq + 0.5) / (freq + 0.5) + 1.0)

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        query_tokens = self.tokenize(query)
        scores = []

        for i, doc_freq in enumerate(self.doc_freqs):
            score = 0.0
            doc_length = self.doc_len[i]
            
            for token in query_tokens:
                if token not in doc_freq:
                    continue
                
                tf = doc_freq[token]
                idf = self.idf.get(token, 0.0)
                
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * (doc_length / self.avg_doc_len))
                score += idf * (numerator / denominator)

            scores.append((score, self.chunks[i]))

        # Sort descending
        scores.sort(key=lambda x: x[0], reverse=True)
        # Fallback: if no scores > 0, return top matching anyway to be robust, or return empty
        results = [doc for score, doc in scores if score > 0.0]
        
        # If query is completely un-matched but we want fallback, return first few docs
        if not results:
            results = [doc for score, doc in scores[:top_k]]
            
        return results[:top_k]

class DocumentIndex:
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(DocumentIndex, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
            
        self.chunks = []
        self.retriever = None
        self.load_or_build_index()
        self.initialized = True

    def load_or_build_index(self):
        # Create data directory if it doesn't exist
        os.makedirs(DATA_DIR, exist_ok=True)
        
        if CACHE_FILE.exists():
            print(f"Loading document chunks from cache: {CACHE_FILE}")
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
            except Exception as e:
                print(f"Error loading cache, rebuilding: {e}")
                self.build_index()
        else:
            print("No cache found, building index...")
            self.build_index()

        self.retriever = BM25Retriever(self.chunks)
        print(f"Retriever initialized with {len(self.chunks)} chunks.")

    def build_index(self):
        loader = PDFLoader(DATA_DIR)
        documents = loader.load_all_documents()
        splitter = TextSplitter()
        self.chunks = splitter.split_documents(documents)
        
        # Save cache
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self.chunks, f, ensure_ascii=False, indent=2)
            print(f"Successfully cached index to {CACHE_FILE}")
        except Exception as e:
            print(f"Failed to cache index: {e}")

    def query(self, user_query: str, top_k: int = 5) -> list:
        return self.retriever.retrieve(user_query, top_k)
