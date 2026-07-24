"""
main.py — Master Orchestrator for Antara's Dual-RAG Architecture.

Coordinates:
  1. Career Guidance Engine (rag/career_rag.py) -> Supporting script generation
     via SBI/STAR frameworks and McKinsey/Grant Thornton research statistics.
  2. Legal & Safety Triage Engine (rag/legal_rag.py) -> Objective compliance
     and statutory parsing mapped to Nepalese labor/criminal codes.

Import note
-----------
career_rag.py, legal_rag.py, embedder.py and prompts.py all import each other
with bare names ("from embedder import Hit", "from legal_rag import Generator",
etc). That only resolves when the rag/ directory itself is on sys.path — true
when one of those files is run directly ("python rag/career_rag.py"), but NOT
true if this file just does "from rag.career_rag import ...", because
importing a package puts its *parent* directory on the resolution path, not
the package directory itself. So rag/ is added to sys.path explicitly below,
before anything under rag/ is imported, and everything is then imported by
its bare module name — the same way the files already import each other.
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
RAG_DIR = ROOT / "rag"

load_dotenv(ROOT / ".env")

# Must happen before any "from career_rag import ..." style import below.
sys.path.insert(0, str(RAG_DIR))

from career_rag import (  # noqa: E402
    generate_script as generate_career_script,
    _print_result as print_career_result,
)
from legal_rag import (  # noqa: E402
    ask as ask_legal_engine,
    _print_answer as print_legal_answer,
)
from embedder import get_provider  # noqa: E402

log = logging.getLogger("antara.orchestrator")


class AntaraRAGOrchestrator:
    """Unified entry point for Antara's dual AI engines."""

    def __init__(self, embedding_provider: str = "local"):
        self.provider_name = embedding_provider
        self._provider = None

    @property
    def provider(self):
        if self._provider is None:
            try:
                self._provider = get_provider(self.provider_name)
            except Exception as exc:
                log.error("Failed to load embedding provider: %s", exc)
                raise
        return self._provider

    def run_career_engine(
        self,
        scenario: str,
        tone: str = "assertive",
        user_context: str = "",
        generator_pref: str = "groq",
    ):
        """Executes the Career Guidance RAG workflow."""
        log.info("Executing Career RAG Engine for scenario: %s", scenario)
        return generate_career_script(
            scenario=scenario,
            tone=tone,
            user_context=user_context,
            provider=self.provider,
            prefer_gen=generator_pref,
        )

    def run_legal_engine(self, question: str, generator_pref: str = "groq"):
        """Executes the Legal & Safety Triage RAG workflow (Nepal jurisdiction)."""
        log.info("Executing Legal Triage RAG Engine...")
        return ask_legal_engine(
            question=question,
            provider=self.provider,
            prefer_gen=generator_pref,
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Antara Dual-RAG Master Orchestrator CLI"
    )
    parser.add_argument("-v", "--verbose", action="store_true")
    subparsers = parser.add_subparsers(dest="engine", required=True)

    # Sub-parser for Career Engine
    career_parser = subparsers.add_parser(
        "career", help="Run the career scripting engine"
    )
    career_parser.add_argument("--scenario", default="salary-negotiation")
    career_parser.add_argument(
        "--tone",
        default="assertive",
        choices=("collaborative", "assertive", "executive"),
    )
    career_parser.add_argument("--context", default="")
    career_parser.add_argument("--json", action="store_true")
    career_parser.add_argument("--scores", action="store_true")
    career_parser.add_argument(
        "--gen", default="groq", choices=["groq", "gemini", "anthropic"]
    )

    # Sub-parser for Legal Triage Engine
    legal_parser = subparsers.add_parser(
        "legal", help="Run the Nepal legal safety triage engine"
    )
    legal_parser.add_argument(
        "question", nargs="*", help="Question about workplace rights or incident notes"
    )
    legal_parser.add_argument("--json", action="store_true")
    legal_parser.add_argument("--scores", action="store_true")
    legal_parser.add_argument(
        "--gen", default="groq", choices=["groq", "gemini", "anthropic"]
    )

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.WARNING,
        format="%(levelname)-8s %(message)s",
    )
    for noisy in (
        "httpx", "httpcore", "google_genai", "google.genai", "groq",
        "sentence_transformers", "chromadb", "urllib3",
    ):
        logging.getLogger(noisy).setLevel(logging.ERROR)

    orchestrator = AntaraRAGOrchestrator()

    if args.engine == "career":
        result = orchestrator.run_career_engine(
            scenario=args.scenario,
            tone=args.tone,
            user_context=args.context,
            generator_pref=args.gen,
        )
        if args.json:
            print(result.to_json())
        else:
            print_career_result(result, show_scores=args.scores)

    elif args.engine == "legal":
        question_text = " ".join(args.question).strip()
        if not question_text:
            print("\nError: Please provide a legal question or incident query.\n", file=sys.stderr)
            sys.exit(1)

        result = orchestrator.run_legal_engine(
            question=question_text,
            generator_pref=args.gen,
        )
        if args.json:
            print(result.to_json())
        else:
            print_legal_answer(result, show_scores=args.scores)


if __name__ == "__main__":
    main()