"""
legal_rag.py — Grounded statutory question answering for Antara.

Answers questions about Nepali law using only retrieved statute text, and
refuses when retrieval is too weak to support an answer.

Why refusal is a code path
--------------------------
An LLM asked about Nepali employment law without grounding produces section
numbers that sound entirely correct and do not exist. A woman deciding whether
she has 15 days or 90 days to file cannot afford that.

So the gate runs *before* generation. Below threshold, this module returns a
refusal and never calls the model. There is no instruction the model could
disregard, because the model is never invoked.

Citations are attached from chunk metadata after generation, never parsed out
of model output. The model writes prose; section references come from the index.

The threshold
-------------
Set from measurement on this corpus, not from a default. Genuine queries top
0.744-0.788; the off-corpus probe "capital gains tax rate in Nepal" topped
0.700. MIN_SCORE sits at 0.72, just under the genuine floor.

A source-diversity condition was tried first and removed. It assumed breadth
implied coverage, but the tax query retrieved 12 distinct provisions across 2
documents — Article 288 "Capital" matched the word capital, Article 308
"Repeal" matched fiscal adjacency. Breadth signals a diffuse query as readily
as real coverage.

Usage
-----
    python rag/legal_rag.py "can my employer fire me for filing a complaint"
    python rag/legal_rag.py --gen groq "what counts as sexual harassment"
    python rag/legal_rag.py --retrieval-only "capital gains tax rate"
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Protocol, Sequence

from dotenv import load_dotenv

from embedder import Hit, get_provider, search
from prompts import (
    DISCLAIMER_LEGAL,
    REFUSAL_LEGAL,
    build_legal_prompt,
    build_rewrite_prompt,
)

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

log = logging.getLogger("antara.legal")

# --------------------------------------------------------------------------- #
# Threshold tuning
# --------------------------------------------------------------------------- #
# Every number here is set from measured retrieval on this corpus, not guessed.

MIN_SCORE = 0.72          # genuine queries top 0.744-0.788; the measured
                          # off-corpus false positive topped 0.700
SUPPORT_SCORE = 0.68      # a corroborating passage must be near-top quality
MIN_SUPPORTING = 3

RETRIEVE_K = 8
CONTEXT_K = 5

GEN_TEMPERATURE = 0.2     # explanation, not composition
GEN_MAX_TOKENS = 1400

REWRITE_ENABLED = True
REWRITE_MAX_TOKENS = 60

# Provider defaults. Groq first: free tier, fast, and Gemini's free generation
# tier is limit: 0 on new projects.
DEFAULT_GEN = "groq"
GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_GEN_MODEL = "gemini-2.0-flash"
ANTHROPIC_MODEL = "claude-haiku-4-5"


# --------------------------------------------------------------------------- #
# Result type
# --------------------------------------------------------------------------- #


@dataclass(slots=True)
class LegalAnswer:
    question: str
    answered: bool
    text: str
    sources: list[dict] = field(default_factory=list)
    disclaimer: str = DISCLAIMER_LEGAL
    top_score: float = 0.0
    rewritten_query: str = ""
    elapsed_ms: int = 0
    refusal_reason: str = ""
    generator: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json(self, indent: int | None = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)


# --------------------------------------------------------------------------- #
# Generation providers
# --------------------------------------------------------------------------- #


class QuotaExhausted(RuntimeError):
    """A structurally zero quota. Retrying will not help."""


class Generator(Protocol):
    name: str

    def generate(
        self, system: str, user: str, temperature: float, max_tokens: int
    ) -> str: ...


def _is_hard_quota(message: str) -> bool:
    """
    True when the quota is structurally zero rather than temporarily consumed.

    Gemini reports `limit: 0` for projects with no free generation tier. Backing
    off against that burns four minutes to reach the same failure.
    """
    return "limit: 0" in message or "'quotaValue': '0'" in message


class GroqGenerator:
    """Groq — free tier, fast inference. Default provider."""

    def __init__(self, api_key: str, model: str = GROQ_MODEL) -> None:
        try:
            from groq import Groq
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError("groq is not installed. Run: pip install groq") from exc

        self._client = Groq(api_key=api_key)
        self.model = model
        self.name = f"groq:{model}"

    def generate(
        self, system: str, user: str,
        temperature: float = GEN_TEMPERATURE, max_tokens: int = GEN_MAX_TOKENS,
    ) -> str:
        last: Exception | None = None
        for attempt in range(3):
            try:
                resp = self._client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                text = (resp.choices[0].message.content or "").strip()
                if text:
                    return text
                last = RuntimeError("empty response")
            except Exception as exc:
                last = exc
                msg = str(exc)
                if _is_hard_quota(msg):
                    raise QuotaExhausted(f"{self.name}: no quota available") from exc
                if "429" in msg or "rate_limit" in msg.lower():
                    wait = 8 * (attempt + 1)
                    log.warning("Groq throttled — waiting %ds", wait)
                    time.sleep(wait)
                    continue
                if attempt == 2:
                    break
                time.sleep(2**attempt)

        raise RuntimeError(f"{self.name} failed: {last}")


class GeminiGenerator:
    """Google Gemini. Free generation tier is limit: 0 on newer projects."""

    def __init__(self, api_key: str, model: str = GEMINI_GEN_MODEL) -> None:
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "google-genai is not installed. Run: pip install google-genai"
            ) from exc

        self._types = types
        self._client = genai.Client(api_key=api_key)
        self.model = model
        self.name = f"gemini:{model}"

    def generate(
        self, system: str, user: str,
        temperature: float = GEN_TEMPERATURE, max_tokens: int = GEN_MAX_TOKENS,
    ) -> str:
        cfg = self._types.GenerateContentConfig(
            system_instruction=system,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        last: Exception | None = None
        for attempt in range(3):
            try:
                resp = self._client.models.generate_content(
                    model=self.model, contents=user, config=cfg
                )
                text = (resp.text or "").strip()
                if text:
                    return text
                last = RuntimeError("empty response")
            except Exception as exc:
                last = exc
                msg = str(exc)
                if _is_hard_quota(msg):
                    raise QuotaExhausted(
                        f"{self.name}: free generation quota is zero on this project"
                    ) from exc
                if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
                    wait = 15 * (attempt + 1)
                    log.warning("Gemini throttled — waiting %ds", wait)
                    time.sleep(wait)
                    continue
                if attempt == 2:
                    break
                time.sleep(2**attempt)

        raise RuntimeError(f"{self.name} failed: {last}")


class AnthropicGenerator:
    """Anthropic. Paid only, but strongest instruction-following."""

    def __init__(self, api_key: str, model: str = ANTHROPIC_MODEL) -> None:
        try:
            import anthropic
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "anthropic is not installed. Run: pip install anthropic"
            ) from exc

        self._client = anthropic.Anthropic(api_key=api_key)
        self.model = model
        self.name = f"anthropic:{model}"

    def generate(
        self, system: str, user: str,
        temperature: float = GEN_TEMPERATURE, max_tokens: int = GEN_MAX_TOKENS,
    ) -> str:
        resp = self._client.messages.create(
            model=self.model,
            system=system,
            messages=[{"role": "user", "content": user}],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return "".join(b.text for b in resp.content if b.type == "text").strip()


def get_generator(prefer: str = DEFAULT_GEN) -> Generator | None:
    """
    Resolve a generator, falling through to whatever key is present.

    Returns None when nothing is configured — callers degrade to raw statute
    text rather than failing, so a dead quota never blanks the demo.
    """
    order = [prefer] + [p for p in ("groq", "anthropic", "gemini") if p != prefer]

    for name in order:
        try:
            if name == "groq":
                key = os.getenv("GROQ_API_KEY")
                if key:
                    return GroqGenerator(key)
            elif name == "anthropic":
                key = os.getenv("ANTHROPIC_API_KEY")
                if key:
                    return AnthropicGenerator(key)
            elif name == "gemini":
                key = os.getenv("GEMINI_API_KEY")
                if key:
                    return GeminiGenerator(key)
        except RuntimeError as exc:
            log.debug("Provider %s unavailable: %s", name, exc)

    log.warning(
        "No generation provider configured. Add GROQ_API_KEY to Sunya/.env — "
        "answers will fall back to raw statute text."
    )
    return None


# --------------------------------------------------------------------------- #
# Retrieval
# --------------------------------------------------------------------------- #


def rewrite_query(question: str, generator: Generator) -> str:
    """
    Convert plain language into statutory search terms.

    "They fired me for complaining" retrieves poorly; "termination of
    employment, protection of complainant, retaliation" retrieves well. Any
    failure falls back to the original — a rewrite is an optimisation, never a
    dependency.
    """
    try:
        prompt = build_rewrite_prompt(question)
        out = generator.generate(
            prompt.system, prompt.user, temperature=0.0, max_tokens=REWRITE_MAX_TOKENS
        )
        cleaned = " ".join(out.replace("\n", " ").split()).strip(" .\"'")
        return cleaned if 3 <= len(cleaned) <= 200 else question
    except Exception as exc:
        log.debug("Rewrite failed (%s) — using original", exc)
        return question


def retrieve(
    question: str,
    provider,
    k: int = RETRIEVE_K,
    generator: Generator | None = None,
) -> tuple[list[Hit], str]:
    """
    Retrieve statutory passages.

    Runs the original question and its statutory rewrite, merging by chunk id
    and keeping the better score. The two phrasings surface different passages
    often enough to justify the extra call.
    """
    hits = search(question, "legal", provider, k=k)
    rewritten = ""

    if generator is not None and REWRITE_ENABLED:
        rewritten = rewrite_query(question, generator)
        if rewritten and rewritten.lower() != question.lower():
            merged: dict[str, Hit] = {h.chunk_id: h for h in hits}
            for h in search(rewritten, "legal", provider, k=k):
                prev = merged.get(h.chunk_id)
                if prev is None or h.score > prev.score:
                    merged[h.chunk_id] = h
            hits = sorted(merged.values(), key=lambda h: h.score, reverse=True)

    return hits, rewritten


def passes_threshold(hits: Sequence[Hit]) -> tuple[bool, str]:
    """
    Decide whether retrieval is strong enough to answer from.

    Score, not shape.

    An earlier version gated on source diversity, on the reasoning that real
    coverage draws from several statutes while a coincidence clusters in one.
    Measurement killed it. The off-corpus query "capital gains tax rate in
    Nepal" retrieved 12 distinct provisions across 2 documents — Article 288
    "Capital" matching on the word capital, Article 308 "Repeal" on fiscal
    adjacency, Votes on Account, Certification of Bills. Breadth signals that a
    query is diffuse as often as it signals the corpus covers it.

    What does separate the cases is absolute score. On this corpus and this
    embedding model:

        harassment query    top 0.754    (genuine)
        definitional query  top 0.788    (genuine)
        capital gains tax   top 0.700    (absent from corpus)

    The band is narrow, so the threshold sits just under the genuine floor.
    That is tight, and some loosely phrased legitimate questions will refuse.
    Correct direction of error: a false refusal costs a rephrase, a false
    answer about a filing deadline costs someone their claim.
    """
    if not hits:
        return False, "no passages retrieved"

    top = hits[0].score
    if top < MIN_SCORE:
        return False, f"top score {top:.3f} below {MIN_SCORE}"

    supporting = [h for h in hits if h.score >= SUPPORT_SCORE]
    if len(supporting) < MIN_SUPPORTING:
        return False, (
            f"only {len(supporting)} passage(s) above {SUPPORT_SCORE}, "
            f"need {MIN_SUPPORTING}"
        )

    return True, ""


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #


def ask(
    question: str,
    provider=None,
    generator: Generator | None = None,
    k: int = RETRIEVE_K,
    prefer_gen: str = DEFAULT_GEN,
) -> LegalAnswer:
    """Answer a legal question, or refuse. Entry point for rag.py and the API."""
    started = time.monotonic()
    question = question.strip()

    if not question:
        return LegalAnswer(
            question=question, answered=False,
            text="Ask me a question about Nepali workplace law.",
            refusal_reason="empty question",
        )

    if provider is None:
        provider = get_provider("local")
    if generator is None:
        generator = get_generator(prefer_gen)

    hits, rewritten = retrieve(question, provider, k=k, generator=generator)
    top_score = hits[0].score if hits else 0.0
    gen_name = getattr(generator, "name", "") if generator else "none"

    ok, reason = passes_threshold(hits)
    if not ok:
        log.info("Refusing: %s", reason)
        return LegalAnswer(
            question=question, answered=False, text=REFUSAL_LEGAL,
            sources=[], top_score=top_score, rewritten_query=rewritten,
            elapsed_ms=int((time.monotonic() - started) * 1000),
            refusal_reason=reason, generator=gen_name,
        )

    context = _dedupe_by_section(hits)[:CONTEXT_K]
    prompt = build_legal_prompt(question, context)

    if generator is None:
        return LegalAnswer(
            question=question, answered=True,
            text=_raw_provisions(context),
            sources=prompt.sources, top_score=top_score,
            rewritten_query=rewritten,
            elapsed_ms=int((time.monotonic() - started) * 1000),
            generator="none",
        )

    try:
        answer_text = generator.generate(
            prompt.system, prompt.user, GEN_TEMPERATURE, GEN_MAX_TOKENS
        )
    except (QuotaExhausted, RuntimeError) as exc:
        # Retrieval succeeded; only the summary failed. Show the statutes.
        log.error("Generation failed: %s", _short_error(exc))
        return LegalAnswer(
            question=question, answered=True,
            text=_raw_provisions(context),
            sources=prompt.sources, top_score=top_score,
            rewritten_query=rewritten,
            elapsed_ms=int((time.monotonic() - started) * 1000),
            refusal_reason=_short_error(exc), generator=gen_name,
        )

    return LegalAnswer(
        question=question, answered=True, text=answer_text,
        sources=prompt.sources, top_score=top_score,
        rewritten_query=rewritten,
        elapsed_ms=int((time.monotonic() - started) * 1000),
        generator=gen_name,
    )


def _dedupe_by_section(hits: Sequence[Hit]) -> list[Hit]:
    """
    Keep the best-scoring chunk per section.

    Long sections split into several chunks, so an unfiltered top-k can spend
    three of five context slots on one provision and list it three times in the
    sources. Chunks with no section number (preamble, fallback splits) are kept
    as-is, since they have no section to collapse on.
    """
    best: dict[tuple[str, str], Hit] = {}
    unkeyed: list[Hit] = []

    for h in hits:
        if not h.section_number:
            unkeyed.append(h)
            continue
        key = (h.source_file, h.section_number)
        if key not in best or h.score > best[key].score:
            best[key] = h

    return sorted([*best.values(), *unkeyed], key=lambda h: h.score, reverse=True)


def _raw_provisions(hits: Sequence[Hit], limit: int = 3) -> str:
    """Fallback body: the statute text itself, unsummarised but accurate."""
    parts = []
    for h in hits[:limit]:
        head = h.citation + (f" — {h.section_title}" if h.section_title else "")
        parts.append(f"{head}\n{' '.join(h.text.split())}")
    return (
        "The summary engine is unavailable, so here are the relevant "
        "provisions in full:\n\n" + "\n\n".join(parts)
    )


def _short_error(exc: Exception) -> str:
    """One line. API error payloads run to several hundred characters."""
    msg = str(exc)
    m = re.search(r"'message':\s*'([^']{0,140})", msg)
    if m:
        return m.group(1).strip()
    return msg[:160]


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def _print_answer(result: LegalAnswer, show_scores: bool = False) -> None:
    print()
    print("=" * 88)
    print(result.question)
    if result.rewritten_query and result.rewritten_query != result.question:
        print(f"  searched as: {result.rewritten_query}")
    print("=" * 88)
    print()
    print(result.text)
    print()

    if result.sources:
        print("-" * 88)
        print("Sources")
        for s in result.sources:
            line = f"  · {s['reference']}"
            if show_scores:
                line += f"   ({s['score']})"
            print(line)
        print()

    print(f"  {result.disclaimer}")
    meta = f"  [{result.elapsed_ms}ms · top {result.top_score:.3f}"
    if result.generator:
        meta += f" · {result.generator}"
    print(meta + "]")
    if result.refusal_reason:
        print(f"  [{result.refusal_reason}]")
    print()


def _print_retrieval(question: str, hits: list[Hit], rewritten: str) -> None:
    print(f"\n{question}")
    if rewritten and rewritten != question:
        print(f"  searched as: {rewritten}")

    ok, reason = passes_threshold(hits)
    supporting = [h for h in hits if h.score >= SUPPORT_SCORE]
    top = hits[0].score if hits else 0.0

    print(f"  gate: {'PASS' if ok else 'REFUSE — ' + reason}")
    print(
        f"  scores: top {top:.3f} (need {MIN_SCORE}), "
        f"{len(supporting)} passage(s) above {SUPPORT_SCORE} (need {MIN_SUPPORTING})"
    )
    print("-" * 88)
    for i, h in enumerate(hits, 1):
        print(f"\n{i}.  {h.score:.3f}   {h.reference()}")
        if h.section_title:
            print(f"    {h.section_title}")
        print(f"    {' '.join(h.text.split())[:240]}…")
    print()


def main() -> None:
    ap = argparse.ArgumentParser(description="Antara legal engine")
    ap.add_argument("question", nargs="*")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--retrieval-only", action="store_true",
                    help="show passages and gate decision without generating")
    ap.add_argument("--no-rewrite", action="store_true")
    ap.add_argument("--scores", action="store_true")
    ap.add_argument("--gen", choices=["groq", "gemini", "anthropic"],
                    default=DEFAULT_GEN, help="generation provider")
    ap.add_argument("-k", type=int, default=RETRIEVE_K)
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.WARNING,
        format="%(levelname)-8s %(message)s",
    )
    for noisy in ("httpx", "httpcore", "google_genai", "google.genai", "groq",
                  "sentence_transformers", "chromadb", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.ERROR)

    question = " ".join(args.question).strip()
    if not question:
        ap.print_help()
        return

    global REWRITE_ENABLED
    if args.no_rewrite:
        REWRITE_ENABLED = False

    provider = get_provider("local")

    if args.retrieval_only:
        gen = get_generator(args.gen) if REWRITE_ENABLED else None
        hits, rewritten = retrieve(question, provider, k=args.k, generator=gen)
        _print_retrieval(question, hits, rewritten)
        return

    result = ask(question, provider=provider, k=args.k, prefer_gen=args.gen)

    if args.json:
        print(result.to_json())
    else:
        _print_answer(result, show_scores=args.scores)


if __name__ == "__main__":
    main()