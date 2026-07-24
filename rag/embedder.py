"""
embedder.py — Embedding + vector store for the Antara RAG pipeline.

Builds two independent Chroma collections from splitter.py output:

    antara_career   fuzzy retrieval, feeds the scripting engine
    antara_legal    citation-exact retrieval, feeds the legal triage engine

They stay separate on purpose. A career query must never surface a statute
fragment as if it were advice, and a legal query must never be answered from
a McKinsey report.

Rate limiting
-------------
The Gemini free tier allows 100 embed requests per minute and counts each
*text* in a batch as one request — not each HTTP call. Pacing is therefore
computed from texts per minute, and a 429 response carries a retry delay the
client obeys rather than guessing at with blind exponential backoff.

Checkpointing
-------------
A full build takes roughly 20 minutes at free-tier rates. Vectors are flushed
to disk as they arrive, so an interrupted run resumes instead of restarting.
Checkpoints are keyed by provider signature and chunk id, so they invalidate
automatically if either changes.

Usage
-----
    python rag/embedder.py --build              # both collections, resumable
    python rag/embedder.py --build --corpus legal
    python rag/embedder.py --build --provider local
    python rag/embedder.py --stats
    python rag/embedder.py --query "can I be fired for reporting harassment"
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Protocol, Sequence

from dotenv import load_dotenv

from splitter import Chunk, build_chunks

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

log = logging.getLogger("antara.embedder")

Corpus = Literal["career", "legal"]

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

CHROMA_DIR = ROOT / "chroma_db"
CACHE_DIR = ROOT / ".embed_cache"

COLLECTIONS: dict[Corpus, str] = {
    "career": "antara_career",
    "legal": "antara_legal",
}

GEMINI_MODEL = "gemini-embedding-001"
GEMINI_DIM = 768              # 768 / 1536 / 3072; 768 is ample for this corpus

# Free tier: 100 texts per minute. Each text in a batch counts separately.
GEMINI_TEXTS_PER_MIN = 100
GEMINI_BATCH = 20             # texts per HTTP call
GEMINI_SAFETY = 0.90          # run at 90% of the ceiling to absorb jitter

LOCAL_MODEL = "BAAI/bge-small-en-v1.5"
LOCAL_DIM = 384

CHECKPOINT_EVERY = 100        # flush vectors to disk this often

TASK_DOCUMENT = "RETRIEVAL_DOCUMENT"
TASK_QUERY = "RETRIEVAL_QUERY"


# --------------------------------------------------------------------------- #
# Rate limiter
# --------------------------------------------------------------------------- #


class RateLimiter:
    """
    Sliding-window limiter over texts, not calls.

    Gemini bills each text in a batched request against the per-minute quota,
    so pacing has to track text volume. The window holds (timestamp, count)
    pairs for the last 60s and blocks until admitting `n` more stays under
    the ceiling.
    """

    def __init__(self, per_minute: int, safety: float = 1.0) -> None:
        self.limit = max(1, int(per_minute * safety))
        self._events: list[tuple[float, int]] = []

    def _prune(self, now: float) -> None:
        cutoff = now - 60.0
        self._events = [(t, n) for t, n in self._events if t > cutoff]

    def acquire(self, n: int) -> None:
        while True:
            now = time.monotonic()
            self._prune(now)
            used = sum(c for _, c in self._events)

            if used + n <= self.limit:
                self._events.append((now, n))
                return

            oldest = self._events[0][0]
            wait = max(0.5, 60.0 - (now - oldest) + 0.5)
            print(
                f"\r  pacing — {wait:4.0f}s until quota window clears        ",
                end="", flush=True,
            )
            time.sleep(wait)

    def penalise(self, seconds: float) -> None:
        """Called after a 429: treat the window as fully consumed, then wait."""
        now = time.monotonic()
        self._events = [(now, self.limit)]
        time.sleep(seconds)


_RETRY_HINT = re.compile(r"retry\s+in\s+(\d+(?:\.\d+)?)\s*s", re.IGNORECASE)


def parse_retry_delay(exc: Exception) -> float | None:
    """
    Extract the server-specified retry delay from a 429 payload.

    Returns None when the error is not a quota problem, so the caller can
    distinguish throttling from auth or network failures.
    """
    text = str(exc)
    m = _RETRY_HINT.search(text)
    if m:
        return float(m.group(1))
    m = re.search(r"'retryDelay':\s*'(\d+)s'", text)
    if m:
        return float(m.group(1))
    if "RESOURCE_EXHAUSTED" in text or "429" in text:
        return 60.0
    return None


# --------------------------------------------------------------------------- #
# Provider abstraction
# --------------------------------------------------------------------------- #


class EmbeddingProvider(Protocol):
    name: str
    dimension: int

    def embed_documents(
        self, texts: Sequence[str], on_batch=None
    ) -> list[list[float]]: ...
    def embed_query(self, text: str) -> list[float]: ...

    @property
    def signature(self) -> str: ...


class GeminiProvider:
    """Google `gemini-embedding-001` via the google-genai SDK."""

    def __init__(self, api_key: str, dimension: int = GEMINI_DIM) -> None:
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "google-genai is not installed. Run: pip install google-genai"
            ) from exc

        self._types = types
        self._client = genai.Client(api_key=api_key)
        self._limiter = RateLimiter(GEMINI_TEXTS_PER_MIN, GEMINI_SAFETY)
        self.name = "gemini"
        self.model = GEMINI_MODEL
        self.dimension = dimension

    @property
    def signature(self) -> str:
        return f"{self.name}:{self.model}:{self.dimension}"

    def _call(self, texts: Sequence[str], task: str) -> list[list[float]]:
        cfg = self._types.EmbedContentConfig(
            task_type=task,
            output_dimensionality=self.dimension,
        )
        resp = self._client.models.embed_content(
            model=self.model, contents=list(texts), config=cfg
        )
        return [list(e.values) for e in resp.embeddings]

    def embed_documents(
        self, texts: Sequence[str], on_batch=None
    ) -> list[list[float]]:
        """
        Embed a document set, pacing against the free-tier quota.

        `on_batch(index, vectors)` fires after each successful batch, where
        `index` is the position of the first vector within `texts`. The caller
        uses it to checkpoint progress.
        """
        out: list[list[float]] = []
        total = len(texts)
        began = time.monotonic()

        for offset in range(0, total, GEMINI_BATCH):
            batch = texts[offset : offset + GEMINI_BATCH]
            attempt = 0

            while True:
                self._limiter.acquire(len(batch))
                try:
                    vectors = self._call(batch, TASK_DOCUMENT)
                    break
                except Exception as exc:
                    attempt += 1
                    delay = parse_retry_delay(exc)

                    if delay is None:
                        # Not quota — network, auth, or malformed input.
                        if attempt >= 4:
                            raise RuntimeError(
                                f"Embedding failed at index {offset}: {exc}"
                            ) from exc
                        wait = 2**attempt
                        log.warning(
                            "Batch at %d failed (%s). Retrying in %ds", offset, exc, wait
                        )
                        time.sleep(wait)
                        continue

                    if attempt >= 8:
                        raise RuntimeError(
                            f"Still throttled at index {offset} after 8 attempts. "
                            f"Progress is checkpointed — rerun the same command "
                            f"to resume."
                        ) from exc

                    print(
                        f"\r  quota reached — pausing {delay + 3:.0f}s "
                        f"(attempt {attempt})            ",
                        end="", flush=True,
                    )
                    self._limiter.penalise(delay + 3.0)

            out.extend(vectors)

            if on_batch is not None:
                on_batch(offset, vectors)

            done = min(offset + GEMINI_BATCH, total)
            elapsed = time.monotonic() - began
            rate = done / elapsed if elapsed > 0 else 0
            eta = (total - done) / rate if rate > 0 else 0
            print(
                f"\r  embedding  {done:>5}/{total}  "
                f"({100 * done / total:5.1f}%)   eta {eta / 60:4.1f}m        ",
                end="", flush=True,
            )

        print()
        return out

    def embed_query(self, text: str) -> list[float]:
        self._limiter.acquire(1)
        try:
            return self._call([text], TASK_QUERY)[0]
        except Exception as exc:
            delay = parse_retry_delay(exc)
            if delay is None:
                raise
            log.warning("Query embedding throttled — waiting %.0fs", delay)
            self._limiter.penalise(delay + 2.0)
            return self._call([text], TASK_QUERY)[0]


class LocalProvider:
    """Offline fallback — sentence-transformers, no network required."""

    def __init__(self, model_name: str = LOCAL_MODEL) -> None:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "sentence-transformers is not installed. Run:\n"
                "    pip install sentence-transformers"
            ) from exc

        log.info("Loading %s (first run downloads ~130MB)…", model_name)
        self._model = SentenceTransformer(model_name)
        self.name = "local"
        self.model = model_name
        self.dimension = LOCAL_DIM

    @property
    def signature(self) -> str:
        return f"{self.name}:{self.model}:{self.dimension}"

    def embed_documents(
        self, texts: Sequence[str], on_batch=None
    ) -> list[list[float]]:
        vecs = self._model.encode(
            list(texts), batch_size=32,
            show_progress_bar=True, normalize_embeddings=True,
        )
        out = [v.tolist() for v in vecs]
        if on_batch is not None:
            on_batch(0, out)
        return out

    def embed_query(self, text: str) -> list[float]:
        # bge models expect this prefix on queries but not on documents.
        prefixed = f"Represent this sentence for searching relevant passages: {text}"
        return self._model.encode(prefixed, normalize_embeddings=True).tolist()


def get_provider(prefer: str = "gemini") -> EmbeddingProvider:
    if prefer == "local":
        return LocalProvider()

    key = os.getenv("GEMINI_API_KEY")
    if not key:
        log.warning(
            "GEMINI_API_KEY not found — using local embeddings. "
            "Add it to Sunya/.env to use Gemini."
        )
        return LocalProvider()

    return GeminiProvider(key)


# --------------------------------------------------------------------------- #
# Checkpointing
# --------------------------------------------------------------------------- #


class Checkpoint:
    """
    Resumable vector cache, keyed by chunk id.

    The filename embeds the provider signature, so switching models or
    dimensions starts a fresh cache rather than mixing incompatible vectors
    into one collection.
    """

    def __init__(self, corpus: Corpus, signature: str) -> None:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        safe = signature.replace(":", "_").replace("/", "_")
        self.path = CACHE_DIR / f"{corpus}__{safe}.jsonl"
        self.signature = signature
        self.vectors: dict[str, list[float]] = {}
        self._handle = None

    def load(self) -> dict[str, list[float]]:
        if not self.path.exists():
            return {}
        recovered = 0
        with self.path.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                    self.vectors[rec["id"]] = rec["v"]
                    recovered += 1
                except (json.JSONDecodeError, KeyError):
                    continue  # truncated final line from an interrupted write
        if recovered:
            print(f"  resuming — {recovered:,} vectors recovered from cache")
        return self.vectors

    def append(self, ids: Sequence[str], vectors: Sequence[list[float]]) -> None:
        if self._handle is None:
            self._handle = self.path.open("a", encoding="utf-8")
        for cid, vec in zip(ids, vectors):
            self._handle.write(json.dumps({"id": cid, "v": vec}) + "\n")
            self.vectors[cid] = vec
        self._handle.flush()
        os.fsync(self._handle.fileno())

    def close(self) -> None:
        if self._handle is not None:
            self._handle.close()
            self._handle = None

    def clear(self) -> None:
        self.close()
        self.path.unlink(missing_ok=True)
        self.vectors.clear()


# --------------------------------------------------------------------------- #
# Chroma store
# --------------------------------------------------------------------------- #


@dataclass(slots=True)
class Hit:
    """One retrieval result."""

    text: str
    score: float                 # cosine similarity, higher is better
    citation: str
    doc_title: str
    source_file: str
    page_number: int
    section_number: str
    section_title: str
    chunk_id: str

    def reference(self) -> str:
        """Human-readable source line for display under an answer."""
        if self.section_number:
            return f"{self.citation} (p. {self.page_number})"
        return f"{self.doc_title}, p. {self.page_number}"


def _client():
    try:
        import chromadb
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "chromadb is not installed. Run: pip install chromadb"
        ) from exc

    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def build_collection(
    corpus: Corpus,
    provider: EmbeddingProvider,
    chunks: list[Chunk] | None = None,
    reset: bool = True,
) -> int:
    """Embed and index one corpus. Resumes from checkpoint if one exists."""
    if chunks is None:
        chunks = build_chunks(corpus)

    chunks = [c for c in chunks if c.corpus == corpus]
    if not chunks:
        log.warning("No chunks for corpus '%s'.", corpus)
        return 0

    print(f"\n{COLLECTIONS[corpus]}  —  {len(chunks):,} chunks  ·  {provider.signature}")

    ckpt = Checkpoint(corpus, provider.signature)
    cached = ckpt.load()

    pending = [c for c in chunks if c.chunk_id not in cached]

    if pending:
        pending_ids = [c.chunk_id for c in pending]
        buffer: list[tuple[str, list[float]]] = []

        def flush() -> None:
            if buffer:
                ckpt.append([b[0] for b in buffer], [b[1] for b in buffer])
                buffer.clear()

        def on_batch(index: int, vectors: list[list[float]]) -> None:
            buffer.extend(zip(pending_ids[index : index + len(vectors)], vectors))
            if len(buffer) >= CHECKPOINT_EVERY:
                flush()

        try:
            provider.embed_documents([c.text for c in pending], on_batch=on_batch)
            flush()
        except BaseException:
            # Persist whatever completed before re-raising, so a rerun resumes.
            flush()
            ckpt.close()
            raise

        cached = ckpt.vectors
    else:
        print("  all vectors cached — writing to Chroma")

    missing = [c.chunk_id for c in chunks if c.chunk_id not in cached]
    if missing:
        ckpt.close()
        raise RuntimeError(
            f"{len(missing)} chunk(s) still missing vectors. Rerun to resume."
        )

    client = _client()
    name = COLLECTIONS[corpus]

    if reset:
        try:
            client.delete_collection(name)
        except Exception:
            pass  # first run, nothing to delete

    collection = client.get_or_create_collection(
        name=name,
        metadata={
            "hnsw:space": "cosine",
            "provider_signature": provider.signature,
            "corpus": corpus,
        },
    )

    # Chroma caps how much it will accept per add() call.
    WRITE_BATCH = 500
    for i in range(0, len(chunks), WRITE_BATCH):
        window = chunks[i : i + WRITE_BATCH]
        collection.add(
            ids=[c.chunk_id for c in window],
            documents=[c.text for c in window],
            embeddings=[cached[c.chunk_id] for c in window],
            metadatas=[c.to_metadata() for c in window],
        )

    ckpt.close()
    print(f"  indexed {collection.count():,} chunks")
    return len(chunks)


def build_all(provider: EmbeddingProvider, reset: bool = True) -> dict[Corpus, int]:
    """Build both collections from a single load+split pass."""
    all_chunks = build_chunks()
    counts: dict[Corpus, int] = {}
    for corpus in ("career", "legal"):
        counts[corpus] = build_collection(  # type: ignore[index]
            corpus, provider, all_chunks, reset  # type: ignore[arg-type]
        )
    return counts


def get_collection(corpus: Corpus, provider: EmbeddingProvider | None = None):
    """
    Open an existing collection, asserting the provider matches what built it.

    A silent provider mismatch is the worst failure mode in this pipeline:
    retrieval returns confident nonsense rather than raising.
    """
    client = _client()
    name = COLLECTIONS[corpus]

    try:
        collection = client.get_collection(name)
    except Exception as exc:
        raise RuntimeError(
            f"Collection '{name}' does not exist. Build it first:\n"
            f"    python rag/embedder.py --build"
        ) from exc

    if provider is not None:
        stored = (collection.metadata or {}).get("provider_signature")
        if stored and stored != provider.signature:
            raise RuntimeError(
                f"Provider mismatch on '{name}'.\n"
                f"  index built with : {stored}\n"
                f"  querying with    : {provider.signature}\n"
                f"Vectors from different models are not comparable. Rebuild "
                f"with: python rag/embedder.py --build"
            )

    return collection


def search(
    query: str,
    corpus: Corpus,
    provider: EmbeddingProvider,
    k: int = 6,
    min_score: float = 0.0,
) -> list[Hit]:
    """
    Retrieve top-k chunks for a query.

    `min_score` matters most on the legal side: below the threshold the caller
    should decline to answer rather than let the model fill the gap with
    plausible-sounding section numbers.
    """
    collection = get_collection(corpus, provider)
    vector = provider.embed_query(query)

    res = collection.query(
        query_embeddings=[vector],
        n_results=k,
        include=["documents", "metadatas", "distances"],
    )

    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    dists = res.get("distances", [[]])[0]
    ids = res.get("ids", [[]])[0]

    hits: list[Hit] = []
    for doc, meta, dist, cid in zip(docs, metas, dists, ids):
        score = 1.0 - float(dist)          # cosine distance -> similarity
        if score < min_score:
            continue
        meta = meta or {}
        hits.append(
            Hit(
                text=doc,
                score=score,
                citation=str(meta.get("citation", "")),
                doc_title=str(meta.get("doc_title", "")),
                source_file=str(meta.get("source_file", "")),
                page_number=int(meta.get("page_number", 0)),
                section_number=str(meta.get("section_number", "")),
                section_title=str(meta.get("section_title", "")),
                chunk_id=str(cid),
            )
        )

    return hits


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def print_stats() -> None:
    client = _client()
    print()
    for corpus, name in COLLECTIONS.items():
        try:
            col = client.get_collection(name)
            meta = col.metadata or {}
            print(
                f"{name:<18} {col.count():>6,} chunks   "
                f"{meta.get('provider_signature', '?')}"
            )
        except Exception:
            print(f"{name:<18} {'—':>6}          not built")
    print(f"\nstore: {CHROMA_DIR}\n")


def print_hits(query: str, corpus: Corpus, hits: list[Hit]) -> None:
    print(f"\n[{corpus}]  {query}")
    print("-" * 92)
    if not hits:
        print("  no results above threshold\n")
        return
    for i, h in enumerate(hits, 1):
        print(f"\n{i}.  {h.score:.3f}   {h.reference()}")
        if h.section_title:
            print(f"    {h.section_title}")
        print(f"    {' '.join(h.text.split())[:300]}…")
    print()


def main() -> None:
    ap = argparse.ArgumentParser(description="Antara RAG embedder")
    ap.add_argument("--build", action="store_true", help="build the index")
    ap.add_argument("--corpus", choices=["career", "legal"])
    ap.add_argument("--stats", action="store_true", help="show index status")
    ap.add_argument("--query", metavar="TEXT", help="run a test retrieval")
    ap.add_argument("-k", type=int, default=5, help="results to return")
    ap.add_argument(
        "--provider", choices=["gemini", "local"], default="gemini",
        help="embedding provider (default: gemini, falls back to local)",
    )
    ap.add_argument("--no-reset", action="store_true",
                    help="append instead of rebuilding from scratch")
    ap.add_argument("--clear-cache", action="store_true",
                    help="discard checkpoints and re-embed from scratch")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)-8s %(message)s",
    )
    # The SDK logs every HTTP call at INFO, which buries the progress line.
    for noisy in ("httpx", "httpcore", "google_genai", "google.genai"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    if args.stats:
        print_stats()
        return

    if not (args.build or args.query or args.clear_cache):
        ap.print_help()
        return

    provider = get_provider(args.provider)

    if args.clear_cache:
        for corpus in ("career", "legal"):
            Checkpoint(corpus, provider.signature).clear()  # type: ignore[arg-type]
        print("checkpoints cleared")
        if not args.build:
            return

    if args.build:
        started = time.time()
        try:
            if args.corpus:
                build_collection(args.corpus, provider, reset=not args.no_reset)  # type: ignore[arg-type]
            else:
                build_all(provider, reset=not args.no_reset)
        except KeyboardInterrupt:
            print("\n\ninterrupted — progress saved, rerun to resume\n", file=sys.stderr)
            sys.exit(130)
        except RuntimeError as exc:
            print(f"\n\n{exc}\n", file=sys.stderr)
            sys.exit(1)

        print(f"\ndone in {(time.time() - started) / 60:.1f}m")
        print_stats()

    if args.query:
        targets: list[Corpus] = [args.corpus] if args.corpus else ["career", "legal"]  # type: ignore[list-item]
        for corpus in targets:
            try:
                print_hits(
                    args.query, corpus, search(args.query, corpus, provider, k=args.k)
                )
            except RuntimeError as exc:
                print(f"\n[{corpus}] {exc}\n", file=sys.stderr)


if __name__ == "__main__":
    main()