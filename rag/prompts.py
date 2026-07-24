"""
prompts.py — Prompt templates and context assembly for Antara.

Two engines with different contracts:

  legal    Grounded strictly in retrieved statute text. The model summarises
           and explains; it never supplies a section number, because citations
           are attached from chunk metadata after generation. When retrieval
           is weak the caller refuses before the model is invoked at all — the
           refusal is a code path, not an instruction the model may ignore.

  career   The model writes the script. Retrieval supplies framework mechanics
           (the SBI paper scores 0.84 on framework queries) and citable
           statistics from the research reports. Grounding is supportive, not
           load-bearing: a corpus with no negotiation scripts in it cannot
           source one, and pretending otherwise produces worse output than
           letting the model write.

Everything here is pure string construction. No API calls, no I/O — so the
templates can be tested and diffed without a network.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterable, Literal, Sequence
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import type only; embedder owns the retrieval contract.
try:  # pragma: no cover - import shape differs when run as a script
    from embedder import Hit
except ImportError:  # pragma: no cover
    Hit = object  # type: ignore[misc, assignment]


ToneId = Literal["collaborative", "assertive", "executive"]
ScenarioId = Literal[
    "meeting-interjection",
    "salary-negotiation",
    "pl-authority",
    "performance-review",
    "scope-expansion",
    "custom",
]

# --------------------------------------------------------------------------- #
# Shared guardrails
# --------------------------------------------------------------------------- #

DISCLAIMER_LEGAL = (
    "This is general information about Nepali law, not legal advice. "
    "For advice about your situation, speak to a lawyer or a legal aid organisation."
)

DISCLAIMER_CAREER = (
    "Antara is a coaching tool. Adapt the wording to your own voice and context."
)

# Shown when retrieval falls below threshold.
REFUSAL_LEGAL = (
    "I can't answer that from the Nepali statutes I have access to.\n\n"
    "My legal index covers the Constitution of Nepal 2072, the Criminal Code 2074, "
    "the Labour Act 2074, the Sexual Harassment at Workplace (Prevention) Act 2071, "
    "and the Electronic Transactions Act 2063. Your question may fall outside "
    "these, or it may be phrased in a way I couldn't match.\n\n"
    "Two things you can do: rephrase using the words the law would use "
    "(for example \"termination\" rather than \"got let go\"), or take the question "
    "to a lawyer or legal aid organisation. I would rather tell you I don't know "
    "than give you a section number that doesn't exist."
)


# --------------------------------------------------------------------------- #
# Groq LLM Generation Helper
# --------------------------------------------------------------------------- #

def generate_groq_response(
    system_prompt: str, user_prompt: str, context: str = ""
) -> str:
    """
    Generates ultra-fast LLM responses using Groq Llama-3.3-70B.
    Requires `groq` to be installed (`pip install groq`).
    """
    from groq import Groq

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in environment variables.")

    client = Groq(api_key=api_key)

    full_user_content = user_prompt
    if context:
        full_user_content = (
            f"Retrieved Context:\n{context}\n\nUser Question:\n{user_prompt}"
        )

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": full_user_content},
        ],
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        temperature=0.3,
    )

    return chat_completion.choices[0].message.content


# --------------------------------------------------------------------------- #
# Context assembly
# --------------------------------------------------------------------------- #

@dataclass(slots=True)
class BuiltPrompt:
    """A prompt ready to send, plus the sources it was built from."""

    system: str
    user: str
    sources: list[dict[str, str | int | float]]
    grounded: bool                 # False when the model is writing unsupported

    def source_lines(self) -> list[str]:
        """Display-ready citation lines for the UI."""
        return [str(s["reference"]) for s in self.sources]


def _format_legal_passage(index: int, hit) -> str:
    """One retrieved statute passage, labelled for the model."""
    header = f"[{index}] {hit.citation}"
    if hit.section_title:
        header += f" — {hit.section_title}"
    header += f" (page {hit.page_number})"

    body = " ".join(hit.text.split())
    return f"{header}\n{body}"


def _format_career_passage(index: int, hit) -> str:
    source = hit.doc_title or hit.source_file
    header = f"[{index}] {source}, p. {hit.page_number}"
    body = " ".join(hit.text.split())
    return f"{header}\n{body}"


def _sources_from_hits(hits: Sequence) -> list[dict[str, str | int | float]]:
    return [
        {
            "reference": hit.reference(),
            "citation": hit.citation,
            "doc_title": hit.doc_title,
            "section_number": hit.section_number,
            "section_title": hit.section_title,
            "page_number": hit.page_number,
            "score": round(float(hit.score), 3),
            "chunk_id": hit.chunk_id,
        }
        for hit in hits
    ]


# --------------------------------------------------------------------------- #
# Legal engine
# --------------------------------------------------------------------------- #

LEGAL_SYSTEM = """\
You are Antara's legal information engine. You explain Nepali law to women \
dealing with workplace harassment, discrimination, and employment disputes.

You are given numbered passages from Nepali statutes. Those passages are the \
only law you know. Everything you state about what the law says must come from \
them.

How to answer:

- Lead with the answer. The person asking may be under stress and reading on a \
phone. Do not open with background or with a restatement of their question.
- Refer to provisions the way the passages label them — "Section 9 of the \
Sexual Harassment at Workplace (Prevention) Act", "Article 18". Never invent a \
number, a year, or an Act name that does not appear in the passages.
- Quote the operative words when the exact wording matters. Paraphrase when it \
does not.
- Some passages will be irrelevant to the question — retrieval is imperfect. \
Ignore those. Do not summarise a passage merely because it was supplied.
- If the passages only partly answer the question, say which part is covered \
and which is not. A half-answer labelled as half is useful; a half-answer \
presented as complete is not.
- Where the law gives the person a concrete step — a deadline, a person to \
complain to, a form of relief — state it plainly. Deadlines especially: they \
are the detail that most often costs people their claim.
- Do not predict outcomes, assess the strength of their case, or tell them what \
they should do. Explain what the law provides and let them decide.

Tone: plain, direct, unhurried. No legalese where ordinary words work. No \
reassurance you cannot back up. Write as if the person will act on this today.\
"""

LEGAL_USER = """\
Question:
{question}

Statutory passages:

{passages}

Answer the question using only these passages."""


def build_legal_prompt(question: str, hits: Sequence) -> BuiltPrompt:
    """Assemble the legal prompt."""
    passages = "\n\n".join(
        _format_legal_passage(i, h) for i, h in enumerate(hits, start=1)
    )

    return BuiltPrompt(
        system=LEGAL_SYSTEM,
        user=LEGAL_USER.format(question=question.strip(), passages=passages),
        sources=_sources_from_hits(hits),
        grounded=True,
    )


# --------------------------------------------------------------------------- #
# Career engine — scripting
# --------------------------------------------------------------------------- #

SCENARIO_BRIEFS: dict[str, str] = {
    "meeting-interjection": (
        "She was spoken over in a meeting and needs to reclaim the floor and "
        "finish her point without making the interruption the subject."
    ),
    "salary-negotiation": (
        "She is asking for a raise and needs to anchor on a market number "
        "backed by delivered results, not on tenure or effort."
    ),
    "pl-authority": (
        "She already runs delivery for an org but the budget line sits "
        "elsewhere. She is asking to take the P&L — the single strongest "
        "predictor of executive advancement."
    ),
    "performance-review": (
        "She is going into a review and needs to state her contribution in "
        "terms of scope and outcome rather than activity."
    ),
    "scope-expansion": (
        "She wants formal ownership of work she is already doing informally."
    ),
}

TONE_BRIEFS: dict[str, str] = {
    "collaborative": (
        "Low friction. Invites the other person in. Right for early tenure, "
        "consensus cultures, or a relationship she needs to protect. Warm, but "
        "never apologetic — no hedging, no 'I just wanted to ask'."
    ),
    "assertive": (
        "States the ask and the basis for it. Names behaviour and its effect "
        "without accusing anyone of intent. Uses the SBI structure. Firm, "
        "specific, unbothered."
    ),
    "executive": (
        "Boardroom register. Short sentences, fragments where they land "
        "harder. The ask comes first and the justification is compressed to "
        "the two or three numbers that carry it. Elaboration reads as "
        "insecurity at this level."
    ),
}

CAREER_SYSTEM = """\
You are Antara's leadership scripting engine. You write the exact words a woman \
can say out loud in a specific workplace moment — a negotiation, a review, a \
room where she was talked over.

You are writing speech, not prose. That distinction governs everything:

- Contractions. Fragments. Uneven sentence lengths. People do not speak in \
balanced clauses.
- No corporate filler. Cut "I wanted to reach out", "I just", "circle back", \
"synergies", "leverage" used as a verb, "touch base".
- No hedging that undercuts the ask — "I was hoping maybe", "if that's okay", \
"sorry to bother you". Warmth is fine; apology for existing is not.
- Specific over general. Invented placeholder detail is better than vagueness: \
"$178K" beats "market rate", "four quarters" beats "a long time". Use bracketed \
placeholders like [your number] only where she genuinely must supply the value.
- Three to five lines. A script she cannot remember is a script she will not use.

Then explain the construction. For each move in the script, say what it is \
doing strategically and why it is built that way. This is the part that \
teaches — she should be able to write the next one herself.

Return valid JSON, nothing else. No markdown fences, no preamble:

{
  "script": ["line one", "line two", "line three"],
  "framework": "SBI" or "STAR",
  "breakdown": [
    {"step": "Situation", "rationale": "what this move does and why"},
    {"step": "Behavior", "rationale": "..."}
  ],
  "evidence": "one sentence citing a supplied statistic, or empty string"
}

Framework choice: SBI when naming a problem or giving difficult feedback. \
STAR when making a claim on scope, money, or title.

The breakdown steps must be the named stages of whichever framework you chose.

Here is a few-shot example of the input/output pattern:
Input Scenario: Custom
Input Tone: assertive
Her situation, in her words: "as a girl i am good at making food. how can you guide me to earn?"

Output JSON:
{
  "script": [
    "I want to explore starting a commercial food delivery or catering service, focusing on my culinary expertise.",
    "Over the past year, I have refined my recipes and successfully hosted dinners for groups of up to 15 people.",
    "I am seeking mentorship on pricing, licensing, and marketing to transition this skill into a profitable venture."
  ],
  "framework": "STAR",
  "breakdown": [
    {"step": "Situation", "rationale": "States the commercial culinary ambition clearly and professionally, moving away from casual cooking to business language."},
    {"step": "Task/Action", "rationale": "Provides concrete proof of success (hosting dinners for 15 people) to ground the business proposal in results."},
    {"step": "Result", "rationale": "Specifies the precise support needed (pricing, licensing, marketing) to make the venture profitable."}
  ],
  "evidence": ""
}
"""

CAREER_USER = """\
Scenario: {scenario_label}
{scenario_brief}

Tone: {tone_label}
{tone_brief}
{extra_context}
{reference_block}
Write the script."""

REFERENCE_HEADER = """
Reference material — framework mechanics and research findings. Use the \
framework guidance to structure the script. Cite a statistic in the "evidence" \
field only if one here is directly relevant; otherwise leave it empty. Do not \
force it.

{passages}
"""


def build_career_prompt(
    scenario: str,
    tone: str,
    hits: Sequence = (),
    scenario_label: str | None = None,
    user_context: str | None = None,
) -> BuiltPrompt:
    """Assemble the scripting prompt."""
    label = scenario_label or scenario.replace("-", " ").title()
    brief = SCENARIO_BRIEFS.get(scenario, "")
    tone_brief = TONE_BRIEFS.get(tone, TONE_BRIEFS["assertive"])

    extra = ""
    if user_context and user_context.strip():
        extra = f"\nHer situation, in her words:\n{user_context.strip()}\n"

    reference_block = ""
    if hits:
        passages = "\n\n".join(
            _format_career_passage(i, h) for i, h in enumerate(hits, start=1)
        )
        reference_block = REFERENCE_HEADER.format(passages=passages)

    user = CAREER_USER.format(
        scenario_label=label,
        scenario_brief=brief,
        tone_label=tone.replace("-", " ").title(),
        tone_brief=tone_brief,
        extra_context=extra,
        reference_block=reference_block,
    )

    return BuiltPrompt(
        system=CAREER_SYSTEM,
        user=user,
        sources=_sources_from_hits(hits),
        grounded=bool(hits),
    )


# --------------------------------------------------------------------------- #
# Incident documentation
# --------------------------------------------------------------------------- #

INCIDENT_SYSTEM = """\
You are Antara's incident documentation engine. Someone is describing something \
that happened to them at work. You turn that account into a structured record \
they could hand to HR, a lawyer, or a complaint hearing officer.

What you are doing: separating observable fact from interpretation. Not because \
her interpretation is wrong, but because a record built on observable fact \
survives challenge and a record built on characterisation does not.

Rules:

- Use only what she told you. Never add a detail, a date, or a name she did not \
give. If something important is missing, list it as a follow-up question — do \
not fill it in.
- Convert characterisation to observation. "He was aggressive" becomes what he \
actually did: raised his voice, stood over her desk, blocked the doorway. If \
she did not say what he did, ask.
- Preserve exact words in quotation marks when she reported them. Verbatim \
speech is the strongest material in any record.
- Keep her emotional response — it belongs in an impact statement, and it is \
evidence of effect. Keep it in its own field, separate from the account of \
what occurred.
- Neutral register throughout. No adjectives that argue. The facts do that work.
- Never assess whether this constitutes harassment, whether she has a case, or \
what she should do. You are producing a record, not an opinion.

Return valid JSON, nothing else:

{
  "summary": "one neutral sentence describing what occurred",
  "datetime": "as she reported it, or empty string",
  "location": "as she reported it, or empty string",
  "people": [{"name": "or 'unnamed colleague'", "role": "their relation to her"}],
  "witnesses": ["names or descriptions, empty list if none mentioned"],
  "account": ["numbered factual statements, chronological, one event each"],
  "quotes": ["verbatim statements she reported, empty list if none"],
  "impact": "how she said it affected her, in her terms",
  "missing": ["specific follow-up questions for detail that would strengthen the record"]
}\
"""

INCIDENT_USER = """\
Her account:

{account}

Produce the structured record."""


def build_incident_prompt(account: str) -> BuiltPrompt:
    return BuiltPrompt(
        system=INCIDENT_SYSTEM,
        user=INCIDENT_USER.format(account=account.strip()),
        sources=[],
        grounded=False,
    )


# --------------------------------------------------------------------------- #
# Query rewriting
# --------------------------------------------------------------------------- #

REWRITE_SYSTEM = """\
You convert a plain-language question into search terms for a Nepali statute index.

Output search terms only — no explanation, no punctuation beyond commas.

Replace everyday phrasing with statutory terms:
- "death threats" or "death threads" -> "criminal intimidation, threat to kill, offense against life, personal liberty"
- "got fired" -> "termination of employment, dismissal"
- "my boss touched me" -> "sexual harassment, physical contact, workplace"
- "online harassment" -> "electronic transactions act, cyber crime, intimidation"


Include both the concept and the likely statutory heading. Keep it under fifteen \
words.\
"""


def build_rewrite_prompt(question: str) -> BuiltPrompt:
    return BuiltPrompt(
        system=REWRITE_SYSTEM,
        user=question.strip(),
        sources=[],
        grounded=False,
    )


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def format_sources_block(sources: Iterable[dict]) -> str:
    """Render citations for display beneath an answer."""
    lines = []
    for s in sources:
        ref = s.get("reference", "")
        score = s.get("score")
        lines.append(f"  · {ref}" + (f"   ({score})" if score is not None else ""))
    return "\n".join(lines)


__all__ = [
    "BuiltPrompt",
    "DISCLAIMER_CAREER",
    "DISCLAIMER_LEGAL",
    "REFUSAL_LEGAL",
    "SCENARIO_BRIEFS",
    "TONE_BRIEFS",
    "build_career_prompt",
    "build_incident_prompt",
    "build_legal_prompt",
    "build_rewrite_prompt",
    "format_sources_block",
    "generate_groq_response",
]