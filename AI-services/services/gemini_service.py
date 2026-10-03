import os
import time
from typing import List

from dotenv import load_dotenv
from PIL import Image
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

load_dotenv()


class PageScanResult(BaseModel):
    text: str = Field(default="", description="Transcribed handwritten text from the page.")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class QuestionResult(BaseModel):
    question_number: str = ""
    question: str = ""
    answer: str = ""
    maximum_marks: float = 0.0
    obtained_marks: float = 0.0
    correctness: float = 0.0
    relevance: float = 0.0
    completeness: float = 0.0
    answer_quality: str = ""
    verdict: str = ""
    feedback: str = ""


class AIContentResult(BaseModel):
    classification: str = "Inconclusive"
    probability: float = 0.0
    confidence: float = 0.0
    indicators: List[str] = Field(default_factory=list)
    explanation: str = ""


class AssignmentEvaluation(BaseModel):
    obtained_marks: float = 0.0
    total_marks: float = 25.0
    percentage: float = 0.0
    answer_quality: str = ""
    summary: str = ""
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    overall_correctness: float = 0.0
    overall_relevance: float = 0.0
    overall_completeness: float = 0.0
    question_results: List[QuestionResult] = Field(default_factory=list)
    ai_content: AIContentResult = Field(default_factory=AIContentResult)


def _models():
    primary = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
    fallback_text = os.getenv(
        "GEMINI_FALLBACK_MODELS",
        "gemini-3.1-flash-lite"
    ).strip()

    fallbacks = [
        model.strip()
        for model in fallback_text.split(",")
        if model.strip()
    ]

    return [primary] + [m for m in fallbacks if m != primary]


def _client():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing in AI-services/.env"
        )

    return genai.Client(api_key=api_key)


def _generate(contents, schema):
    client = _client()
    models = _models()

    max_retries = int(os.getenv("GEMINI_MAX_RETRIES", "3"))

    last_error = None

    for model_name in models:
        for attempt in range(1, max_retries + 1):
            try:
                print(
                    f"[Gemini] model={model_name}, "
                    f"attempt={attempt}/{max_retries}"
                )

                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=schema,
                    ),
                )

                if not response.text:
                    raise RuntimeError("Gemini returned an empty response.")

                return response.text

            except Exception as error:
                last_error = error
                print(
                    f"[Gemini] {model_name} failed on "
                    f"attempt {attempt}: {error}"
                )

                if attempt < max_retries:
                    time.sleep(min(2 ** attempt, 8))

        print(f"[Gemini] Switching from {model_name} to next model.")

    raise RuntimeError(
        f"All Gemini models failed. Last error: {last_error}"
    )


def scan_page(image: Image.Image, page_number: int = 1) -> dict:
    """
    Gemini multimodal handwriting transcription.
    No TrOCR model is loaded or downloaded.
    """

    if image is None:
        raise ValueError(f"Page {page_number}: image is missing.")

    prompt = f"""
You are a handwriting transcription engine for an examination answer sheet.

Transcribe page {page_number} exactly as accurately as possible.

Rules:
1. Read handwritten English text from the image.
2. Preserve question numbers and answer structure.
3. Do not invent missing words.
4. Do not solve or evaluate the answers.
5. If text is unclear, use the closest readable text.
6. Return only the requested JSON structure.
7. Confidence must be between 0 and 1.
"""

    raw = _generate(
        contents=[prompt, image.convert("RGB")],
        schema=PageScanResult,
    )

    result = PageScanResult.model_validate_json(raw)

    return {
        "page_number": page_number,
        "text": result.text.strip(),
        "confidence": result.confidence,
    }


def evaluate_assignment(pages: list) -> dict:
    """
    Evaluate the transcribed answer sheet.

    Important:
    For academically reliable marking, the request should eventually
    include the question paper, reference answers and/or marking rubric.
    With only student answers, evaluation is necessarily limited.
    """

    if not pages:
        raise ValueError("No scanned pages were provided for evaluation.")

    transcript_parts = []

    for page in pages:
        page_number = page.get("page_number", "")
        text = page.get("text", "")

        transcript_parts.append(
            f"--- PAGE {page_number} ---\n{text}"
        )

    transcript = "\n\n".join(transcript_parts)

    prompt = f"""
You are an AI-assisted examination answer evaluator.

The following text was transcribed from a student's handwritten answer sheet.

Evaluate the student's answers conservatively.

Important:
- Total marks must be exactly 25.
- Identify the questions and answers present in the transcript.
- Distribute maximum marks across detected questions so their sum is 25.
- Award marks according to correctness, relevance and completeness.
- Do not give full marks merely because an answer sounds fluent.
- Do not invent facts that are not present.
- If a question or answer cannot be identified reliably, reduce confidence and explain it.
- AI-content detection is only an indicator, not proof that a student used AI.
- Since no official answer key/rubric is supplied in this call, do not claim exact official correctness. Treat the result as AI-assisted/provisional evaluation.

Student answer-sheet transcript:

{transcript}
"""

    raw = _generate(
        contents=prompt,
        schema=AssignmentEvaluation,
    )

    result = AssignmentEvaluation.model_validate_json(raw)

    # Normalize the total and percentage on the server side.
    result.total_marks = 25.0
    result.obtained_marks = max(
        0.0,
        min(25.0, float(result.obtained_marks))
    )
    result.percentage = round(
        (result.obtained_marks / 25.0) * 100.0,
        2
    )

    return result.model_dump()
