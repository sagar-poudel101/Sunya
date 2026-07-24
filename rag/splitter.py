"""
splitter.py — Corpus-aware chunking for the Antara RAG pipeline.

Two independent strategies, chosen by the `corpus` field stamped in loader.py:

  legal   Split on statutory boundaries (sections / articles). Chunk text is
          kept verbatim and carries a citation string. A statute cut mid-section
          produces answers that are structurally wrong about the law, so token
          count never overrides a section boundary.

  career  Recursive character splitting with overlap. Retrieval here is fuzzy
          and generative; paragraph continuity matters more than exact spans.

Both paths emit the same Chunk type so embedder.py stays agnostic.

Usage
-----
    python rag/splitter.py                  # split everything, print summary
    python rag/splitter.py --corpus legal   # one corpus
    python rag/splitter.py --inspect 3      # show N sample chunks per document
"""

from __future__ import annotations

import argparse
import logging
import re
from dataclasses import dataclass, field
from typing import Iterable, Literal

from loader import LoadedPage, load_all, load_corpus

log = logging.getLogger("antara.splitter")

Corpus = Literal["career", "legal"]

# --------------------------------------------------------------------------- #
# Tuning
# --------------------------------------------------------------------------- #

# Career corpus: recursive character splitting.
CAREER_CHUNK_CHARS = 1400          # ~350 tokens
CAREER_OVERLAP_CHARS = 200         # ~15%

# Legal corpus: sections are kept whole where possible. A section longer than
# this is subdivided at subsection boundaries, never mid-sentence.
LEGAL_MAX_CHARS = 2600
LEGAL_MIN_CHARS = 120              # shorter than this is a stray fragment

# Below this, a chunk carries no retrievable meaning and is dropped.
MIN_VIABLE_CHARS = 80


# --------------------------------------------------------------------------- #
# Data model
# --------------------------------------------------------------------------- #


@dataclass(slots=True)
class Chunk:
    """One indexable unit. Metadata must stay flat — Chroma rejects nesting."""

    text: str
    corpus: Corpus
    source_file: str
    doc_title: str
    page_number: int
    chunk_index: int                       # position within its source document

    # Legal only — empty string for career chunks
    section_number: str = ""               # "7"  |  "Article 18"
    section_title: str = ""                # "Complain may be filed"
    citation: str = ""                     # "Sexual Harassment Act 2071, s. 7"

    chunk_id: str = field(init=False)
    char_count: int = field(init=False)

    def __post_init__(self) -> None:
        self.char_count = len(self.text)
        stem = self.source_file.replace(".pdf", "")
        self.chunk_id = f"{self.corpus}::{stem}::{self.chunk_index:04d}"

    def to_metadata(self) -> dict[str, str | int]:
        return {
            "corpus": self.corpus,
            "source_file": self.source_file,
            "doc_title": self.doc_title,
            "page_number": self.page_number,
            "chunk_index": self.chunk_index,
            "section_number": self.section_number,
            "section_title": self.section_title,
            "citation": self.citation,
        }


# --------------------------------------------------------------------------- #
# Text repair
# --------------------------------------------------------------------------- #
# The extracted statutes carry mid-word spaces from PDF character positioning:
# "sup plying", "imprison ment", "emp loyed", "collectiv ely". Left in place
# these degrade embedding quality and break verbatim quoting.

_RUNNING_HEADERS = re.compile(
    r"^\s*(?:www\.lawcommission\.gov\.np|Unofficial translation)\s*$",
    re.IGNORECASE | re.MULTILINE,
)

_INLINE_HEADERS = re.compile(
    r"\s*(?:www\.lawcommission\.gov\.np|Unofficial translation)\s*",
    re.IGNORECASE,
)

# A short lowercase fragment followed by a space and a lowercase continuation,
# where joining them yields a plausible word. Conservative by design: only
# fires when the left fragment is 2-6 chars and both sides are lowercase.
_SPLIT_WORD = re.compile(r"\b([a-z]{2,6}) ([a-z]{2,})\b")

# Words the repair must never fuse — common two-word sequences that would
# otherwise be joined into nonsense.
_COMMON_WORDS = {
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "by", "for",
    "is", "are", "was", "were", "be", "been", "as", "it", "its", "this",
    "that", "any", "all", "no", "not", "if", "may", "shall", "such", "with",
    "from", "who", "has", "have", "had", "so", "than", "then", "but", "he",
    "she", "his", "her", "him", "they", "them", "we", "us", "our", "you",
    "do", "does", "did", "can", "will", "would", "must", "made", "make",
    "one", "two", "per", "out", "up", "off", "own", "same", "other", "each",
    "more", "most", "less", "least", "also", "only", "very", "well", "new",
    "law", "act", "case", "time", "work", "job", "pay", "day", "year",
}

# A curated set of terms this corpus splits on repeatedly. Applied first and
# exactly, so the heuristic never has to guess at them.
_KNOWN_REPAIRS = {
    "sup plying": "supplying",
    "imprison ment": "imprisonment",
    "emp loyed": "employed",
    "collectiv ely": "collectively",
    "instruc tions": "instructions",
    "Technolo gy": "Technology",
    "statem ent": "statement",
    "geog raphical": "geographical",
    "solidari ty": "solidarity",
    "recogniz ing": "recognizing",
    "remunerati on": "remuneration",
    "contraven tion": "contravention",
    "informa tion": "information",
    "applica tion": "application",
    "compensa tion": "compensation",
    "investiga tion": "investigation",
    "discrimina tion": "discrimination",
    "harass ment": "harassment",
    "employ ment": "employment",
    "govern ment": "government",
    "depart ment": "department",
    "agree ment": "agreement",
    "punish ment": "punishment",
    "settle ment": "settlement",
    "manage ment": "management",
    "estab lished": "established",
    "provi ded": "provided",
    "accord ance": "accordance",
    "pursu ant": "pursuant",
    "author ity": "authority",
    "certifi cate": "certificate",
    "electron ic": "electronic",
    "com puter": "computer",
    "in to": "into",
    "la bours": "labours",
    "th is": "this",
    "co urt": "court",
    "r ecognizing": "recognizing",
}


def _repair_split_words(text: str) -> str:
    """
    Rejoin words broken by stray spaces during PDF extraction.

    Known repairs run first (exact, safe). The heuristic then handles the long
    tail, guarded so it never fuses two legitimate words.
    """
    for broken, fixed in _KNOWN_REPAIRS.items():
        text = text.replace(broken, fixed)
        text = text.replace(broken.capitalize(), fixed.capitalize())

    def _join(m: re.Match[str]) -> str:
        left, right = m.group(1), m.group(2)
        if left in _COMMON_WORDS or right in _COMMON_WORDS:
            return m.group(0)
        # Only join when the left fragment is not itself a plausible word
        # ending — suffix-like continuations are the real signal.
        if right[:3] in ("ing", "ion", "ies", "ent", "ment", "ity", "ted", "ded"):
            return left + right
        return m.group(0)

    return _SPLIT_WORD.sub(_join, text)


def clean_legal_text(text: str) -> str:
    """Strip running headers and repair extraction damage."""
    text = _RUNNING_HEADERS.sub("", text)
    text = _INLINE_HEADERS.sub(" ", text)
    text = _repair_split_words(text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def clean_career_text(text: str) -> str:
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# --------------------------------------------------------------------------- #
# Citation labels
# --------------------------------------------------------------------------- #

_SHORT_TITLES = {
    "criminal-code-nepal.pdf": "Criminal Code 2074",
    "Electronic-Transaction-Act-2063.pdf": "Electronic Transactions Act 2063",
    "The-Labour-Act-2017.pdf": "Labour Act 2074",
    "nepal-constitution.pdf.pdf": "Constitution of Nepal 2072",
    "nepal-the-sexual-harassment-at-workplace-prevention-act-2014-2071-english.pdf":
        "Sexual Harassment at Workplace (Prevention) Act 2071",
}


def short_title(source_file: str, fallback: str) -> str:
    return _SHORT_TITLES.get(source_file, fallback)


def build_citation(source_file: str, doc_title: str, section: str) -> str:
    name = short_title(source_file, doc_title)
    if not section:
        return name
    if section.lower().startswith("article"):
        return f"{name}, {section}"
    return f"{name}, s. {section}"


# --------------------------------------------------------------------------- #
# Legal splitting
# --------------------------------------------------------------------------- #

# Section headers run inline after normalisation, e.g.
#   "... shall be deemed void. 7. Complain may be filed: (1) Notwithstanding ..."
# Match a number + period + Title Case heading, ending at ':' or before '(1)'.
_SECTION_RE = re.compile(
    r"(?:(?<=^)|(?<=[.\:\;\n]\s)|(?<=[.\:\;]\s\s))"     # sentence boundary
    r"(\d{1,3})\.\s+"                                    # "7. "
    r"([A-Z][^:\n]{2,90}?)"                              # "Complain may be filed"
    r"\s*:",                                             # terminating colon
)

# Constitution: "Article 18. Right to equality:" or bare "18. Right to equality:"
#
# The extra lookbehind alternatives matter for Article 1, which follows the
# part heading "PART 1 Preliminary" with no terminating punctuation. Without
# them the first Article of each Part gets absorbed into the preceding block.
_ARTICLE_RE = re.compile(
    r"(?:(?<=^)|(?<=[.\:\;\n]\s)|(?<=[a-z]\s\s)|(?<=Preliminary\s))"
    r"(?:Article\s+)?(\d{1,3})\.\s+"
    r"([A-Z][^:\n]{2,90}?)\s*:",
)

# Chapter markers — captured as context, not as split points
_CHAPTER_RE = re.compile(r"Chapter\s*-?\s*(\d{1,2})\b", re.IGNORECASE)

# Table-of-contents leaders: "PREAMBLE ________ I", "Part 2 Citizenship ____ 12".
# TOC pages carry every heading in the document with none of the content, so
# they match broadly against almost any query while answering none of them.
_TOC_LEADER = re.compile(r"[_.]{4,}\s*[ivxlIVXL\d]+")


def _is_toc(text: str) -> bool:
    """True when leader lines dominate the block rather than merely appearing."""
    hits = len(_TOC_LEADER.findall(text))
    if hits < 5:
        return False
    # Rough proportion test: ~40 chars of surrounding heading per leader.
    return hits * 40 > len(text) * 0.25


# Endnote and survey-methodology back-matter in the research reports. This text
# is a dense soup of question wording, percentages, and source citations, so it
# embeds close to almost any career query while answering none of them. Left in
# the index it crowds out the prescriptive material entirely.
_ENDNOTE_MARKERS = (
    "full question:",
    "respondents selected:",
    "respondents who selected",
    "due to rounding",
    "select all that apply",
    "https://doi.org/",
    "journal of applied psychology",
)

_NUMBERED_NOTE = re.compile(
    r"\b\d{1,3}\.\s*(?:Full question|Respondents|Based on|For company|The five)",
    re.IGNORECASE,
)

def _is_endnote(text: str) -> bool:
    """
    True for survey-appendix chunks.

    Any single signal is sufficient. Phrases like "Full question:" or
    "Respondents who selected" appear only in back-matter, so requiring two
    of them let most endnotes through.

    Note on what is deliberately *not* a signal: percentage density. Endnotes
    are dense with percentages, but so are the report findings the career
    engine needs to cite ("24% of women leaders have had a formal mentor
    compared to 30% of men"). Filtering on percentages drops the evidence
    along with the noise, so detection stays on methodology phrasing only.
    """
    low = text.lower()

    if any(m in low for m in _ENDNOTE_MARKERS):
        return True

    return bool(_NUMBERED_NOTE.search(text))

# Subsection boundary, used when one section exceeds LEGAL_MAX_CHARS
_SUBSECTION_RE = re.compile(r"(?<=[.\:\;]\s)\((\d{1,2})\)\s+(?=[A-Z\"'])")


def _is_constitution(source_file: str) -> bool:
    return "constitution" in source_file.lower()


def _subdivide(text: str, limit: int) -> list[str]:
    """
    Break an oversized section at subsection boundaries. Falls back to sentence
    boundaries, then to a hard character cut — but only after both fail.
    """
    if len(text) <= limit:
        return [text]

    marks = [m.start() for m in _SUBSECTION_RE.finditer(text)]
    if marks:
        parts: list[str] = []
        buf_start = 0
        for pos in marks:
            if pos - buf_start >= limit * 0.6:
                parts.append(text[buf_start:pos].strip())
                buf_start = pos
        parts.append(text[buf_start:].strip())
        parts = [p for p in parts if len(p) >= LEGAL_MIN_CHARS]
        if parts and all(len(p) <= limit * 1.5 for p in parts):
            return parts

    # Sentence-boundary fallback
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z(])", text)
    parts, buf = [], ""
    for s in sentences:
        if buf and len(buf) + len(s) + 1 > limit:
            parts.append(buf.strip())
            buf = s
        else:
            buf = f"{buf} {s}".strip() if buf else s
    if buf:
        parts.append(buf.strip())

    return [p for p in parts if len(p) >= MIN_VIABLE_CHARS] or [text[:limit]]


def split_legal_document(pages: list[LoadedPage]) -> list[Chunk]:
    """
    Reassemble a statute's pages, then split on section boundaries.

    Pages are joined before splitting because sections routinely straddle page
    breaks — splitting page by page would truncate roughly one section in three.
    Each chunk keeps the page number where its section *began*, which is what a
    citation needs.
    """
    if not pages:
        return []

    first = pages[0]
    is_const = _is_constitution(first.source_file)
    pattern = _ARTICLE_RE if is_const else _SECTION_RE

    # Join pages, recording where each page starts in the combined string so
    # a chunk offset can be mapped back to a page number.
    segments: list[str] = []
    page_offsets: list[tuple[int, int]] = []   # (char_offset, page_number)
    cursor = 0
    for p in pages:
        cleaned = clean_legal_text(p.text)
        if not cleaned:
            continue
        page_offsets.append((cursor, p.page_number))
        segments.append(cleaned)
        cursor += len(cleaned) + 1
    full = "\n".join(segments)

    def page_at(offset: int) -> int:
        page = page_offsets[0][1] if page_offsets else 1
        for start, num in page_offsets:
            if start <= offset:
                page = num
            else:
                break
        return page

    matches = list(pattern.finditer(full))

    if len(matches) < 3:
        log.warning(
            "%s: only %d section header(s) matched — falling back to recursive "
            "splitting. Citations for this document will lack section numbers.",
            first.source_file, len(matches),
        )
        return _split_recursive_pages(pages, clean_legal_text)

    chunks: list[Chunk] = []
    idx = 0

    # Preamble — text before the first matched section
    head = full[: matches[0].start()].strip()
    if len(head) >= LEGAL_MIN_CHARS and not _is_toc(head):
        for part in _subdivide(head, LEGAL_MAX_CHARS):
            if _is_toc(part):
                continue
            chunks.append(
                Chunk(
                    text=part,
                    corpus="legal",
                    source_file=first.source_file,
                    doc_title=first.doc_title,
                    page_number=page_at(0),
                    chunk_index=idx,
                    section_number="",
                    section_title="Preamble",
                    citation=build_citation(first.source_file, first.doc_title, ""),
                )
            )
            idx += 1

    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full)
        body = full[start:end].strip()
        if len(body) < LEGAL_MIN_CHARS:
            continue

        num = m.group(1)
        title = re.sub(r"\s+", " ", m.group(2)).strip()
        label = f"Article {num}" if is_const else num

        chapter = ""
        window = full[max(0, start - 600) : start]
        cm = list(_CHAPTER_RE.finditer(window))
        if cm:
            chapter = f"Chapter {cm[-1].group(1)}"

        page = page_at(start)
        citation = build_citation(first.source_file, first.doc_title, label)

        for part in _subdivide(body, LEGAL_MAX_CHARS):
            # Prefix the section heading onto continuation chunks so an
            # embedded fragment still carries what it belongs to.
            text = part
            if not part.startswith(f"{num}."):
                text = f"[{citation} — {title}]\n{part}"

            chunks.append(
                Chunk(
                    text=text,
                    corpus="legal",
                    source_file=first.source_file,
                    doc_title=first.doc_title,
                    page_number=page,
                    chunk_index=idx,
                    section_number=label,
                    section_title=f"{chapter} · {title}" if chapter else title,
                    citation=citation,
                )
            )
            idx += 1

    return chunks


# --------------------------------------------------------------------------- #
# Career splitting
# --------------------------------------------------------------------------- #

_SEPARATORS = ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " "]


def _recursive_split(text: str, limit: int, overlap: int) -> list[str]:
    """Standard recursive character splitting with overlap."""
    if len(text) <= limit:
        return [text] if len(text) >= MIN_VIABLE_CHARS else []

    def _split(t: str, seps: list[str]) -> list[str]:
        if len(t) <= limit:
            return [t]
        if not seps:
            return [t[i : i + limit] for i in range(0, len(t), limit)]

        sep, rest = seps[0], seps[1:]
        pieces = t.split(sep)
        out, buf = [], ""
        for piece in pieces:
            candidate = f"{buf}{sep}{piece}" if buf else piece
            if len(candidate) > limit:
                if buf:
                    out.append(buf)
                out.extend(_split(piece, rest) if len(piece) > limit else [piece])
                buf = ""
            else:
                buf = candidate
        if buf:
            out.append(buf)
        return out

    raw = [p.strip() for p in _split(text, _SEPARATORS) if p.strip()]

    # Apply overlap by prefixing the tail of the previous piece
    merged: list[str] = []
    for i, piece in enumerate(raw):
        if i > 0 and overlap > 0:
            tail = raw[i - 1][-overlap:]
            cut = tail.find(" ")
            if cut > 0:
                tail = tail[cut + 1 :]
            piece = f"{tail} {piece}".strip()
        merged.append(piece)

    return [m for m in merged if len(m) >= MIN_VIABLE_CHARS]


def _split_recursive_pages(pages: list[LoadedPage], cleaner) -> list[Chunk]:
    """Shared recursive path — used for career docs and as the legal fallback."""
    if not pages:
        return []

    first = pages[0]
    chunks: list[Chunk] = []
    dropped: list[str] = []
    idx = 0

    for page in pages:
        text = cleaner(page.text)
        if len(text) < MIN_VIABLE_CHARS:
            continue

        for part in _recursive_split(text, CAREER_CHUNK_CHARS, CAREER_OVERLAP_CHARS):
            # Only applied to career docs: the legal fallback path must keep
            # everything, since a dropped statute chunk is unrecoverable.
            if page.corpus == "career" and _is_endnote(part):
                dropped.append(part)
                continue

            chunks.append(
                Chunk(
                    text=part,
                    corpus=page.corpus,
                    source_file=page.source_file,
                    doc_title=page.doc_title,
                    page_number=page.page_number,
                    chunk_index=idx,
                    citation=f"{first.doc_title}, p. {page.page_number}",
                )
            )
            idx += 1

    if dropped:
        log.info(
            "%s: dropped %d endnote/appendix chunk(s)",
            first.source_file, len(dropped),
        )

    return chunks


def split_career_document(pages: list[LoadedPage]) -> list[Chunk]:
    return _split_recursive_pages(pages, clean_career_text)


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #


def _group_by_document(pages: Iterable[LoadedPage]) -> dict[str, list[LoadedPage]]:
    grouped: dict[str, list[LoadedPage]] = {}
    for p in pages:
        grouped.setdefault(p.source_file, []).append(p)
    for docs in grouped.values():
        docs.sort(key=lambda x: x.page_number)
    return grouped


def split_pages(pages: list[LoadedPage]) -> list[Chunk]:
    """Split a mixed list of pages, routing each document by its corpus."""
    chunks: list[Chunk] = []
    for _, doc_pages in sorted(_group_by_document(pages).items()):
        corpus = doc_pages[0].corpus
        if corpus == "legal":
            chunks.extend(split_legal_document(doc_pages))
        else:
            chunks.extend(split_career_document(doc_pages))
    return chunks


def build_chunks(corpus: Corpus | None = None) -> list[Chunk]:
    """Load and split. This is the entry point embedder.py calls."""
    pages, _ = load_corpus(corpus) if corpus else load_all()
    return split_pages(pages)


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def print_summary(chunks: list[Chunk]) -> None:
    if not chunks:
        print("\nNo chunks produced.\n")
        return

    by_doc: dict[str, list[Chunk]] = {}
    for c in chunks:
        by_doc.setdefault(c.source_file, []).append(c)

    print()
    print(f"{'DOCUMENT':<44} {'CORPUS':<8} {'CHUNKS':>7} {'AVG':>6} {'MAX':>6}  SECTIONS")
    print("-" * 96)

    for name in sorted(by_doc):
        cs = by_doc[name]
        sizes = [c.char_count for c in cs]
        sections = len({c.section_number for c in cs if c.section_number})
        display = name if len(name) <= 42 else name[:39] + "..."
        print(
            f"{display:<44} {cs[0].corpus:<8} {len(cs):>7} "
            f"{sum(sizes) // len(sizes):>6} {max(sizes):>6}  "
            f"{sections if sections else '—'}"
        )

    legal = [c for c in chunks if c.corpus == "legal"]
    career = [c for c in chunks if c.corpus == "career"]
    cited = [c for c in legal if c.section_number]

    print("-" * 96)
    print(f"{len(chunks):,} chunks  ·  {len(legal):,} legal  ·  {len(career):,} career")
    if legal:
        pct = 100 * len(cited) / len(legal)
        print(f"Legal chunks carrying a section citation: {len(cited):,}/{len(legal):,} ({pct:.0f}%)")
        if pct < 80:
            print("  Section detection is underperforming — inspect samples before indexing.")
    print()


def print_samples(chunks: list[Chunk], n: int) -> None:
    by_doc: dict[str, list[Chunk]] = {}
    for c in chunks:
        by_doc.setdefault(c.source_file, []).append(c)

    for name in sorted(by_doc):
        print("=" * 96)
        print(name)
        print("=" * 96)
        for c in by_doc[name][:n]:
            head = c.citation or c.doc_title
            if c.section_title:
                head += f"  —  {c.section_title}"
            print(f"\n[{c.chunk_id}]  p.{c.page_number}  {c.char_count} chars")
            print(f"  {head}")
            print(f"  {c.text[:320].strip()}...")
        print()


def main() -> None:
    ap = argparse.ArgumentParser(description="Antara RAG splitter")
    ap.add_argument("--corpus", choices=["career", "legal"])
    ap.add_argument("--inspect", type=int, metavar="N",
                    help="print N sample chunks per document")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)-8s %(message)s",
    )

    chunks = build_chunks(args.corpus)  # type: ignore[arg-type]
    print_summary(chunks)

    if args.inspect:
        print_samples(chunks, args.inspect)


if __name__ == "__main__":
    main()