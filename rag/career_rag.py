"""
career_rag.py — Leadership scripting engine for Antara.

Generates verbatim scripts a woman can say out loud in a specific workplace
moment: a salary negotiation, a review, a room where she was talked over.

How this differs from legal_rag
-------------------------------
The legal engine refuses when retrieval is weak, because an ungrounded claim
about a filing deadline can cost someone their case. This engine does not
refuse, because retrieval here is supportive rather than load-bearing.

Measured on this corpus:

    "situation behavior impact framework"   0.842   SBI paper, all 5 hits
    "broken rung women promotion"           0.740   McKinsey p.18, real finding
    "salary negotiation what to say"        ~0.67   nothing useful

The corpus contains framework mechanics and research statistics. It contains
no negotiation scripts, because none of the six source documents is a coaching
manual — they are ILO policy handbooks and McKinsey/Grant Thornton research.

So the model writes the script from its own knowledge of SBI and STAR, and
retrieval supplies two things: framework guidance when the query is about
mechanics, and a citable statistic when one is genuinely relevant. Grounding a
script in a corpus that holds no scripts would produce worse output than
letting the model write, and pretending otherwise would be dishonest about
what the retrieval is doing.

Usage
-----
    python rag/career_rag.py --scenario salary-negotiation --tone executive
    python rag/career_rag.py --scenario pl-authority --tone assertive --json
    python rag/career_rag.py --list
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Sequence

from dotenv import load_dotenv

from embedder import Hit, get_provider, search
from legal_rag import Generator, QuotaExhausted, get_generator, _short_error
from prompts import (
    DISCLAIMER_CAREER,
    SCENARIO_BRIEFS,
    TONE_BRIEFS,
    build_career_prompt,
)

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

log = logging.getLogger("antara.career")

# --------------------------------------------------------------------------- #
# Tuning
# --------------------------------------------------------------------------- #

# Career retrieval is supportive, not load-bearing — but the threshold still
# has to be high enough that "grounded" means something.
#
# Measured scores on this corpus:
#     SBI framework query      0.842   genuinely useful
#     broken-rung statistic    0.740   genuinely useful
#     salary negotiation       0.677   nothing relevant exists
#
# At 0.60 the McKinsey report matched every scripting query at 0.65-0.68 and
# contributed nothing, while the result was still labelled grounded. 0.70 admits
# only material that helps and lets `grounded: false` be honest.
MIN_SCORE = 0.70

RETRIEVE_K = 6
CONTEXT_K = 4

# Model selection is per-engine. The legal engine wants the stronger model for
# statutory reasoning; scripting is a register-matching task driven by few-shot
# examples, where the smaller model is faster and often matches tone better
# because it over-explains less.
CAREER_MODEL = "llama-3.1-8b-instant"

# Higher than the legal engine: this is composition, and identical scripts on
# repeat presses feel broken. Not so high that it invents facts, since the only
# facts present are the retrieved statistics.
GEN_TEMPERATURE = 0.75
GEN_MAX_TOKENS = 1600

# Retrieval queries per scenario. The user-facing scenario label makes a poor
# search string — "Negotiating a 15%+ salary raise" retrieves badly, while the
# framework and evidence terms behind it retrieve well.
SCENARIO_QUERIES: dict[str, str] = {
    "meeting-interjection": (
        "situation behavior impact feedback framework interruption"
    ),
    "salary-negotiation": (
        "STAR method accomplishment result pay gap negotiation women"
    ),
    "pl-authority": (
        "profit and loss responsibility executive advancement sponsorship women"
    ),
    "performance-review": (
        "STAR method situation task action result performance evaluation"
    ),
    "scope-expansion": (
        "stretch assignment scope sponsorship promotion women"
    ),
    "stem-coaching": (
        "women in STEM technology engineering coding robotics science research"
    ),
    "empowerment-motivation": (
        "women empowerment confidence self-belief motivation leadership potential"
    ),
    "community-support": (
        "sisterhood community collaboration networking mentorship support connection"
    ),
}

VALID_TONES = ("collaborative", "assertive", "executive")


# --------------------------------------------------------------------------- #
# Result type
# --------------------------------------------------------------------------- #


@dataclass(slots=True)
class ScriptResult:
    """A generated script with its tactical breakdown."""

    scenario: str
    tone: str
    script: list[str] = field(default_factory=list)
    framework: str = ""
    breakdown: list[dict[str, str]] = field(default_factory=list)
    evidence: str = ""
    sources: list[dict] = field(default_factory=list)
    grounded: bool = False
    disclaimer: str = DISCLAIMER_CAREER
    elapsed_ms: int = 0
    generator: str = ""
    error: str = ""

    @property
    def ok(self) -> bool:
        return bool(self.script)

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json(self, indent: int | None = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    def as_text(self) -> str:
        """Plain-text rendering for the CLI and for clipboard copy."""
        return "\n\n".join(self.script)


# --------------------------------------------------------------------------- #
# JSON parsing
# --------------------------------------------------------------------------- #
# Models wrap JSON in prose or fences regardless of instruction. This recovers
# the object rather than failing the request over formatting.

_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)


def _extract_json(raw: str) -> dict:
    """
    Pull a JSON object out of a model response.

    Three attempts in order: parse as-is, strip markdown fences, then take the
    outermost brace pair. Raises ValueError only when all three fail.
    """
    text = raw.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    fenced = _FENCE.search(text)
    if fenced:
        try:
            return json.loads(fenced.group(1).strip())
        except json.JSONDecodeError:
            pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        candidate = text[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            # Trailing commas are the usual culprit
            repaired = re.sub(r",(\s*[}\]])", r"\1", candidate)
            try:
                return json.loads(repaired)
            except json.JSONDecodeError:
                pass

    raise ValueError("no parseable JSON object in response")


def _coerce_script(value) -> list[str]:
    """Accept a list of lines, or a string the model split with newlines."""
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        parts = [p.strip() for p in value.split("\n") if p.strip()]
        return parts or [value.strip()]
    return []


def _coerce_breakdown(value) -> list[dict[str, str]]:
    """Normalise the breakdown to {step, rationale} regardless of model shape."""
    if not isinstance(value, list):
        return []

    out: list[dict[str, str]] = []
    for item in value:
        if isinstance(item, dict):
            step = str(item.get("step") or item.get("stage") or "").strip()
            rationale = str(
                item.get("rationale") or item.get("why") or item.get("explanation") or ""
            ).strip()
            if step and rationale:
                out.append({"step": step, "rationale": rationale})
        elif isinstance(item, str) and ":" in item:
            step, _, rationale = item.partition(":")
            out.append({"step": step.strip(), "rationale": rationale.strip()})
    return out


# --------------------------------------------------------------------------- #
# Retrieval
# --------------------------------------------------------------------------- #


def _dedupe_by_page(hits: Sequence[Hit]) -> list[Hit]:
    """
    One chunk per source page.

    Career chunks overlap by design, so consecutive chunks from a page repeat
    material and waste context slots that could hold a different source.
    """
    best: dict[tuple[str, int], Hit] = {}
    for h in hits:
        key = (h.source_file, h.page_number)
        if key not in best or h.score > best[key].score:
            best[key] = h
    return sorted(best.values(), key=lambda h: h.score, reverse=True)


def retrieve_support(
    scenario: str,
    provider,
    user_context: str = "",
    k: int = RETRIEVE_K,
) -> list[Hit]:
    """
    Fetch framework guidance and citable statistics.

    Returns an empty list when nothing clears MIN_SCORE. That is a normal
    outcome — the model writes unaided and the result is no worse for it, since
    the corpus holds no scripts to copy in the first place.
    """
    query = SCENARIO_QUERIES.get(scenario, scenario.replace("-", " "))
    if user_context.strip():
        # Her own words often retrieve better than the canned scenario query.
        query = f"{query} {user_context.strip()[:200]}"

    try:
        hits = search(query, "career", provider, k=k, min_score=MIN_SCORE)
    except RuntimeError as exc:
        log.warning("Career retrieval unavailable: %s", exc)
        return []

    return _dedupe_by_page(hits)[:CONTEXT_K]


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #


def _career_generator(prefer: str = "groq", model: str = CAREER_MODEL):
    """
    Resolve a generator with the career model override applied.

    `get_generator` returns whichever provider has a key configured, using the
    shared default model. Scripting wants its own model, so when the resolved
    provider is Groq the model string is swapped after construction.
    """
    generator = get_generator(prefer)
    if generator is None:
        return None

    if model and getattr(generator, "name", "").startswith("groq"):
        generator.model = model
        generator.name = f"groq:{model}"

    return generator


def generate_script(
    scenario: str,
    tone: str = "assertive",
    user_context: str = "",
    provider=None,
    generator: Generator | None = None,
    prefer_gen: str = "groq",
    model: str = CAREER_MODEL,
) -> ScriptResult:
    """
    Generate a verbatim script. Entry point for rag.py and the API layer.

    Unlike the legal engine this never refuses on weak retrieval. It fails only
    when generation itself is unavailable.
    """
    started = time.monotonic()

    if tone not in VALID_TONES:
        tone = "assertive"

    if provider is None:
        provider = get_provider("local")
    if generator is None:
        generator = _career_generator(prefer_gen, model)

    gen_name = getattr(generator, "name", "none") if generator else "none"

    if generator is None:
        return ScriptResult(
            scenario=scenario, tone=tone, generator="none",
            error=(
                "No generation provider configured. Add GROQ_API_KEY to "
                "Sunya/.env to enable script generation."
            ),
            elapsed_ms=int((time.monotonic() - started) * 1000),
        )

    hits = retrieve_support(scenario, provider, user_context)
    prompt = build_career_prompt(
        scenario=scenario, tone=tone, hits=hits, user_context=user_context
    )

    try:
        raw = generator.generate(
            prompt.system, prompt.user, GEN_TEMPERATURE, GEN_MAX_TOKENS
        )
    except (QuotaExhausted, RuntimeError) as exc:
        log.error("Generation failed: %s", _short_error(exc))
        return ScriptResult(
            scenario=scenario, tone=tone, sources=prompt.sources,
            grounded=prompt.grounded, generator=gen_name,
            error=_short_error(exc),
            elapsed_ms=int((time.monotonic() - started) * 1000),
        )

    try:
        payload = _extract_json(raw)
    except ValueError:
        # The model wrote prose instead of JSON. The lines are still usable, so
        # salvage them rather than discarding a complete generation.
        log.warning("Response was not JSON — salvaging as plain lines")
        lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
        return ScriptResult(
            scenario=scenario, tone=tone,
            script=[ln for ln in lines if not ln.startswith(("#", "*", "-"))][:6],
            sources=prompt.sources, grounded=prompt.grounded,
            generator=gen_name,
            elapsed_ms=int((time.monotonic() - started) * 1000),
        )

    return ScriptResult(
        scenario=scenario,
        tone=tone,
        script=_coerce_script(payload.get("script")),
        framework=str(payload.get("framework", "")).strip().upper(),
        breakdown=_coerce_breakdown(payload.get("breakdown")),
        evidence=str(payload.get("evidence", "")).strip(),
        sources=prompt.sources,
        grounded=prompt.grounded,
        generator=gen_name,
        elapsed_ms=int((time.monotonic() - started) * 1000),
    )


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def _print_result(result: ScriptResult, show_scores: bool = False) -> None:
    print()
    print("=" * 88)
    label = result.scenario.replace("-", " ").title()
    print(f"{label}   ·   {result.tone.title()}")
    if result.framework:
        print(f"{result.framework} framework")
    print("=" * 88)

    if result.error:
        print(f"\n  {result.error}\n")
        return

    print("\nSAY THIS\n")
    for line in result.script:
        print(f"  {line}\n")

    if result.breakdown:
        print("-" * 88)
        print("WHY IT'S BUILT THIS WAY\n")
        for item in result.breakdown:
            print(f"  {item['step']}")
            print(f"    {item['rationale']}\n")

    if result.evidence:
        print("-" * 88)
        print(f"EVIDENCE\n\n  {result.evidence}\n")

    if result.sources:
        print("-" * 88)
        print("Reference material")
        for s in result.sources:
            line = f"  · {s['reference']}"
            if show_scores:
                line += f"   ({s['score']})"
            print(line)
        print()

    print(f"  {result.disclaimer}")
    print(
        f"  [{result.elapsed_ms}ms · {result.generator}"
        f"{' · grounded' if result.grounded else ' · model-only'}]"
    )
    print()


def _print_options() -> None:
    print("\nScenarios\n")
    for key, brief in SCENARIO_BRIEFS.items():
        print(f"  {key}")
        print(f"    {brief}\n")
    print("Tones\n")
    for key, brief in TONE_BRIEFS.items():
        print(f"  {key}")
        print(f"    {brief}\n")


def main() -> None:
    ap = argparse.ArgumentParser(description="Antara scripting engine")
    ap.add_argument("--scenario", default="salary-negotiation",
                    help="scenario key (see --list)")
    ap.add_argument("--tone", default="assertive", choices=VALID_TONES)
    ap.add_argument("--context", default="",
                    help="her situation in her own words")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--list", action="store_true", help="show scenarios and tones")
    ap.add_argument("--scores", action="store_true")
    ap.add_argument("--retrieval-only", action="store_true",
                    help="show retrieved support without generating")
    ap.add_argument("--gen", choices=["groq", "gemini", "anthropic"], default="groq")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.WARNING,
        format="%(levelname)-8s %(message)s",
    )
    for noisy in ("httpx", "httpcore", "google_genai", "google.genai", "groq",
                  "sentence_transformers", "chromadb", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.ERROR)

    if args.list:
        _print_options()
        return

    if args.retrieval_only:
        provider = get_provider("local")
        hits = retrieve_support(args.scenario, provider, args.context)
        print(f"\n{args.scenario}  —  {len(hits)} passage(s) above {MIN_SCORE}")
        print("-" * 88)
        if not hits:
            print("  nothing above threshold — the model will write unaided\n")
        for i, h in enumerate(hits, 1):
            print(f"\n{i}.  {h.score:.3f}   {h.reference()}")
            print(f"    {' '.join(h.text.split())[:260]}…")
        print()
        return

    result = generate_script(
        scenario=args.scenario, tone=args.tone,
        user_context=args.context, prefer_gen=args.gen,
    )

    if args.json:
        print(result.to_json())
    else:
        _print_result(result, show_scores=args.scores)


if __name__ == "__main__":
    main()