"""
loader.py — Document ingestion for the Antara RAG pipeline.

Walks data/career/ and data/legal/, extracts text page by page, and returns
LoadedPage objects carrying enough provenance for downstream citation.

Design notes
------------
1. Extraction is per page, never per document. Legal answers must cite a page;
   if page boundaries are lost here they cannot be recovered later.

2. Corpus ("career" | "legal") is assigned at load time from the directory.
   Splitter, embedder, and retriever all branch on this field.

3. Scanned pages are detected and reported rather than silently yielding empty
   text. A statute that loads as 0 chars will otherwise produce an index that
   returns nothing and an LLM that invents section numbers to fill the gap.

Usage
-----
    python loader.py --scan          # report only, no extraction
    python loader.py                 # extract and summarise
"""

from __future__ import annotations

import argparse
import logging
import re
import unicodedata
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Iterator, Literal

import pypdf

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

Corpus = Literal["career", "legal"]

CORPUS_DIRS: dict[Corpus, Path] = {
    "career": DATA_DIR / "career",
    "legal": DATA_DIR / "legal",
}

# A page yielding fewer than this many characters is treated as image-only.
# Tuned low deliberately: statute pages with a single heading are legitimate,
# and a false OCR flag is cheaper than a missed one.
MIN_CHARS_FOR_TEXT_LAYER = 80

# Fraction of pages that must lack a text layer before the whole document is
# classified as scanned.
SCANNED_DOC_THRESHOLD = 0.60

log = logging.getLogger("antara.loader")


# --------------------------------------------------------------------------- #
# Data model
# --------------------------------------------------------------------------- #


@dataclass(slots=True)
class LoadedPage:
    """A single extracted page with the provenance needed for citation."""

    text: str
    corpus: Corpus
    source_file: str          # "The-Labour-Act-2074.pdf"
    source_path: str          # absolute path, for re-reading if needed
    page_number: int          # 1-indexed, matches what a reader sees
    total_pages: int
    doc_title: str            # cleaned, human-readable
    char_count: int = field(init=False)

    def __post_init__(self) -> None:
        self.char_count = len(self.text)

    def to_metadata(self) -> dict[str, str | int]:
        """Flat metadata dict — Chroma rejects nested values."""
        return {
            "corpus": self.corpus,
            "source_file": self.source_file,
            "page_number": self.page_number,
            "total_pages": self.total_pages,
            "doc_title": self.doc_title,
        }


@dataclass(slots=True)
class DocumentReport:
    """Per-document diagnostic emitted during loading."""

    source_file: str
    corpus: Corpus
    total_pages: int
    pages_with_text: int
    total_chars: int
    is_scanned: bool
    error: str | None = None

    @property
    def status(self) -> str:
        if self.error:
            return "ERROR"
        if self.is_scanned:
            return "SCANNED — needs OCR"
        if self.pages_with_text < self.total_pages:
            missing = self.total_pages - self.pages_with_text
            return f"OK ({missing} image page{'s' if missing != 1 else ''})"
        return "OK"


# --------------------------------------------------------------------------- #
# Text normalisation
# --------------------------------------------------------------------------- #

_LIGATURES = {
    "\ufb00": "ff", "\ufb01": "fi", "\ufb02": "fl",
    "\ufb03": "ffi", "\ufb04": "ffl",
}

# Hyphen at end of line splitting a word across lines: "harass-\nment"
_HYPHEN_BREAK = re.compile(r"(\w)-\s*\n\s*(\w)")

# Single newline inside a sentence — PDF hard-wraps that are not paragraph breaks
_SOFT_WRAP = re.compile(r"(?<![\n\.\:\;])\n(?!\n)")

_MULTI_BLANK = re.compile(r"\n{3,}")
_MULTI_SPACE = re.compile(r"[ \t]{2,}")

# Page furniture: bare page numbers, "Page 4 of 92"
_PAGE_FURNITURE = re.compile(
    r"^\s*(?:page\s+)?\d+\s*(?:of\s+\d+)?\s*$",
    re.IGNORECASE | re.MULTILINE,
)


def normalise(raw: str) -> str:
    """
    Clean extracted PDF text without destroying legal structure.

    Deliberately conservative: section numbers, clause letters, and indentation
    patterns carry meaning in statutes, so this fixes only extraction artefacts
    (ligatures, hyphen breaks, hard wraps) and leaves layout alone.
    """
    if not raw:
        return ""

    text = unicodedata.normalize("NFKC", raw)

    for lig, repl in _LIGATURES.items():
        text = text.replace(lig, repl)

    # Normalise line endings before any newline-sensitive regex runs
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    text = _PAGE_FURNITURE.sub("", text)
    text = _HYPHEN_BREAK.sub(r"\1\2", text)
    text = _SOFT_WRAP.sub(" ", text)
    text = _MULTI_SPACE.sub(" ", text)
    text = _MULTI_BLANK.sub("\n\n", text)

    return text.strip()


def derive_title(filename: str) -> str:
    """
    'The-Labour-Act-2074.pdf'          -> 'The Labour Act 2074'
    'nepal-the-sexual-harassment.pdf'  -> 'Nepal The Sexual Harassment'
    'wcms_578773.pdf'                  -> 'wcms_578773'   (opaque, left alone)
    """
    stem = Path(filename).stem
    if re.fullmatch(r"[a-z]+[_-]?\d+", stem, re.IGNORECASE):
        return stem
    cleaned = re.sub(r"[-_]+", " ", stem).strip()
    return " ".join(w if w.isupper() else w.capitalize() for w in cleaned.split())


# --------------------------------------------------------------------------- #
# Extraction
# --------------------------------------------------------------------------- #


def _iter_pdf_paths(corpus: Corpus) -> Iterator[Path]:
    directory = CORPUS_DIRS[corpus]
    if not directory.is_dir():
        log.warning("Missing corpus directory: %s", directory)
        return
    yield from sorted(directory.rglob("*.pdf"))


def load_pdf(path: Path, corpus: Corpus) -> tuple[list[LoadedPage], DocumentReport]:
    """Extract one PDF into pages plus a diagnostic report."""
    title = derive_title(path.name)

    try:
        reader = pypdf.PdfReader(str(path))
        if reader.is_encrypted:
            # Many public statute PDFs carry an empty owner password
            try:
                reader.decrypt("")
            except Exception:
                raise RuntimeError("encrypted, no password")
        total = len(reader.pages)
    except Exception as exc:
        report = DocumentReport(
            source_file=path.name, corpus=corpus, total_pages=0,
            pages_with_text=0, total_chars=0, is_scanned=False, error=str(exc),
        )
        log.error("Failed to open %s: %s", path.name, exc)
        return [], report

    pages: list[LoadedPage] = []
    pages_with_text = 0
    total_chars = 0

    for idx, page in enumerate(reader.pages, start=1):
        try:
            raw = page.extract_text() or ""
        except Exception as exc:
            log.warning("%s p%d: extraction failed (%s)", path.name, idx, exc)
            raw = ""

        text = normalise(raw)
        total_chars += len(text)

        if len(text) < MIN_CHARS_FOR_TEXT_LAYER:
            continue  # image-only or near-blank; nothing indexable

        pages_with_text += 1
        pages.append(
            LoadedPage(
                text=text,
                corpus=corpus,
                source_file=path.name,
                source_path=str(path),
                page_number=idx,
                total_pages=total,
                doc_title=title,
            )
        )

    is_scanned = total > 0 and (pages_with_text / total) < (1 - SCANNED_DOC_THRESHOLD)

    report = DocumentReport(
        source_file=path.name,
        corpus=corpus,
        total_pages=total,
        pages_with_text=pages_with_text,
        total_chars=total_chars,
        is_scanned=is_scanned,
    )
    return pages, report


def load_corpus(corpus: Corpus) -> tuple[list[LoadedPage], list[DocumentReport]]:
    """Load every PDF in one corpus directory."""
    all_pages: list[LoadedPage] = []
    reports: list[DocumentReport] = []

    for path in _iter_pdf_paths(corpus):
        pages, report = load_pdf(path, corpus)
        all_pages.extend(pages)
        reports.append(report)

    return all_pages, reports


def load_all() -> tuple[list[LoadedPage], list[DocumentReport]]:
    """Load both corpora. This is the entry point splitter.py calls."""
    pages: list[LoadedPage] = []
    reports: list[DocumentReport] = []

    for corpus in ("career", "legal"):
        p, r = load_corpus(corpus)  # type: ignore[arg-type]
        pages.extend(p)
        reports.extend(r)

    return pages, reports


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def print_report(reports: list[DocumentReport]) -> None:
    if not reports:
        print("\nNo PDFs found. Expected files under data/career/ and data/legal/.\n")
        return

    print()
    print(f"{'DOCUMENT':<42} {'CORPUS':<8} {'PAGES':>6} {'TEXT':>6} {'CHARS':>9}  STATUS")
    print("-" * 96)

    for r in sorted(reports, key=lambda x: (x.corpus, x.source_file)):
        name = r.source_file if len(r.source_file) <= 40 else r.source_file[:37] + "..."
        print(
            f"{name:<42} {r.corpus:<8} {r.total_pages:>6} "
            f"{r.pages_with_text:>6} {r.total_chars:>9,}  {r.status}"
        )

    scanned = [r for r in reports if r.is_scanned]
    errored = [r for r in reports if r.error]

    print("-" * 96)
    print(
        f"{len(reports)} document(s)  ·  "
        f"{sum(r.pages_with_text for r in reports):,} indexable pages  ·  "
        f"{sum(r.total_chars for r in reports):,} chars"
    )

    if errored:
        print(f"\n  {len(errored)} file(s) failed to open:")
        for r in errored:
            print(f"    - {r.source_file}: {r.error}")

    if scanned:
        print(f"\n  {len(scanned)} file(s) have no usable text layer and need OCR:")
        for r in scanned:
            print(f"    - {r.source_file} ({r.corpus})")
        print(
            "\n  These will be missing from the index until OCR'd. For the legal\n"
            "  corpus that is not acceptable — a missing statute means the retriever\n"
            "  returns nothing and the model has room to invent section numbers.\n"
            "\n  Fix with ocrmypdf:\n"
            "      brew install ocrmypdf        # macOS\n"
            "      sudo apt install ocrmypdf    # Debian/Ubuntu\n"
            "      ocrmypdf --skip-text in.pdf out.pdf\n"
        )
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Antara RAG document loader")
    parser.add_argument(
        "--scan", action="store_true",
        help="report document status only; do not keep extracted text",
    )
    parser.add_argument(
        "--corpus", choices=["career", "legal"],
        help="restrict to a single corpus",
    )
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)-8s %(message)s",
    )

    if args.corpus:
        pages, reports = load_corpus(args.corpus)  # type: ignore[arg-type]
    else:
        pages, reports = load_all()

    print_report(reports)

    if not args.scan and pages:
        sample = pages[0]
        preview = sample.text[:400].replace("\n", " ")
        print(f"Sample — {sample.doc_title}, page {sample.page_number}:")
        print(f"  {preview}...\n")


if __name__ == "__main__":
    main()