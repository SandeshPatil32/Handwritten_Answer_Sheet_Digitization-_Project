import io
import os
import time
from typing import List

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# ============================================================
# HANDWRITING SCAN SCHEMAS
# ============================================================


class PageText(BaseModel):
    page_number: int = Field(description="1-based PDF page number")

    text: str = Field(description="All readable handwritten text on this page")

    confidence: float = Field(
        ge=0.0, le=1.0, description="Handwriting recognition confidence from 0 to 1"
    )


class ScanResponse(BaseModel):
    pages: List[PageText]


# ============================================================
# QUESTION EVALUATION SCHEMAS
# ============================================================


class QuestionEvaluation(BaseModel):
    question_number: str = Field(description="Question number such as 1, 2, 3(a), etc.")

    question: str = Field(description="Question text identified from the answer sheet")

    answer: str = Field(description="Student's answer")

    maximum_marks: float = Field(
        ge=0, description="Maximum marks assigned to this question"
    )

    obtained_marks: float = Field(ge=0, description="Marks awarded to this answer")

    correctness: float = Field(
        ge=0, le=100, description="Correctness score from 0 to 100"
    )

    relevance: float = Field(ge=0, le=100, description="Relevance score from 0 to 100")

    completeness: float = Field(
        ge=0, le=100, description="Completeness score from 0 to 100"
    )

    answer_quality: str = Field(
        description="Excellent, Good, Average, Weak, or Incorrect"
    )

    verdict: str = Field(
        description="Correct, Partially Correct, Incorrect, or Unanswered"
    )

    feedback: str = Field(description="Short feedback explaining the marks")


class AIContentDetection(BaseModel):
    classification: str = Field(
        description=("Likely AI-generated, Likely human-written, " "or Inconclusive")
    )

    probability: float = Field(
        ge=0,
        le=100,
        description="Estimated probability that the text has AI-generated characteristics",
    )

    confidence: float = Field(
        ge=0, le=100, description="Confidence in the AI-content assessment"
    )

    indicators: List[str] = Field(
        description="Observed linguistic indicators supporting the assessment"
    )

    explanation: str = Field(
        description="Short explanation of the AI-content assessment"
    )


class EvaluationResponse(BaseModel):
    obtained_marks: float = Field(
        ge=0, le=25, description="Total marks obtained out of 25"
    )

    total_marks: int = Field(default=25, description="Maximum assignment marks")

    percentage: float = Field(
        ge=0, le=100, description="Percentage calculated from obtained marks"
    )

    question_results: List[QuestionEvaluation] = Field(
        description="Detailed evaluation for every detected question"
    )

    overall_correctness: float = Field(
        ge=0, le=100, description="Overall correctness percentage"
    )

    overall_relevance: float = Field(
        ge=0, le=100, description="Overall relevance percentage"
    )

    overall_completeness: float = Field(
        ge=0, le=100, description="Overall completeness percentage"
    )

    answer_quality: str = Field(description="Overall answer quality")

    summary: str = Field(description="Overall evaluation summary")

    strengths: List[str] = Field(
        description="Important strengths in the student's answers"
    )

    weaknesses: List[str] = Field(
        description="Important weaknesses in the student's answers"
    )

    ai_content: AIContentDetection = Field(
        description="AI-generated-content likelihood assessment"
    )


# ============================================================
# GEMINI CLIENT
# ============================================================


def _get_client():

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. "
            "Create ai-service/.env and add your Gemini API key."
        )

    return genai.Client(api_key=api_key)


# ============================================================
# IMAGE CONVERSION
# ============================================================


def _image_to_bytes(image):

    buffer = io.BytesIO()

    image.save(buffer, format="JPEG", quality=92)

    return buffer.getvalue()


# ============================================================
# MODEL CONFIGURATION
# ============================================================


def _get_models():

    primary_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.7-flash")

    final_fallback_model = os.getenv(
        "GEMINI_FINAL_FALLBACK_MODEL", "gemini-3.5-flash-lite"
    )

    models = [primary_model, fallback_model, final_fallback_model]

    return list(dict.fromkeys(model for model in models if model))


# ============================================================
# RETRY HANDLING
# ============================================================


def _is_retryable_error(error):

    error_text = str(error).upper()

    retryable_errors = [
        "503",
        "UNAVAILABLE",
        "500",
        "INTERNAL",
        "502",
        "BAD GATEWAY",
        "504",
        "DEADLINE EXCEEDED",
        "429",
        "RESOURCE EXHAUSTED",
        "TOO MANY REQUESTS",
    ]

    return any(item in error_text for item in retryable_errors)


def _generate_with_fallback(client, contents, config):

    models = _get_models()

    last_error = None

    for model_name in models:

        print(f"[Gemini] Trying model: {model_name}")

        for attempt in range(1, 4):

            try:

                print(f"[Gemini] Model={model_name} " f"Attempt={attempt}/3")

                response = client.models.generate_content(
                    model=model_name, contents=contents, config=config
                )

                print(f"[Gemini] SUCCESS: {model_name}")

                return response

            except Exception as error:

                last_error = error

                print(f"[Gemini] ERROR: {error}")

                if not _is_retryable_error(error):
                    raise

                if attempt < 3:

                    delay = 2 ** (attempt - 1)

                    print(f"[Gemini] Retrying after " f"{delay} seconds...")

                    time.sleep(delay)

        print(f"[Gemini] {model_name} failed. " f"Trying next model.")

    raise RuntimeError(f"All Gemini models failed. " f"Last error: {last_error}")


# ============================================================
# HANDWRITING SCANNING
# ============================================================


def scan_page(image, page_number):

    client = _get_client()

    prompt = f"""
You are the handwriting-recognition component of an
academic answer-sheet digitization system.

The attached image is PDF page {page_number}
of a student's handwritten answer sheet.

Task:
Transcribe the visible handwritten content accurately.

Rules:

1. Do not evaluate the answer.
2. Do not assign marks.
3. Do not invent unreadable text.
4. Preserve question numbers.
5. Preserve headings.
6. Preserve equations.
7. Preserve answer order.
8. Preserve lists and important numbering.
9. If handwriting is unclear, use only the closest
   readable transcription.
10. Lower confidence when handwriting is unclear.
11. Return only the structured fields requested.
"""

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=ScanResponse,
    )

    response = _generate_with_fallback(
        client=client,
        contents=[
            types.Part.from_bytes(
                data=_image_to_bytes(image),
                mime_type="image/jpeg",
            ),
            prompt,
        ],
        config=config,
    )

    if not response.text:

        raise RuntimeError(
            f"Gemini returned an empty response " f"for page {page_number}."
        )

    result = ScanResponse.model_validate_json(response.text)

    for page in result.pages:
        page.page_number = page_number

    return result


# ============================================================
# ASSIGNMENT EVALUATION
# ============================================================


def evaluate_assignment(pages):

    client = _get_client()

    if not pages:

        raise RuntimeError("No extracted answer text is available " "for evaluation.")

    combined_text = "\n\n".join(f"""
================ PAGE {page.get("page_number", index + 1)}
================

{page.get("text", "")}
""" for index, page in enumerate(pages))

    prompt = f"""
You are an AI-assisted university assignment evaluator.

You are evaluating a student's handwritten assignment.

IMPORTANT:
The assignment has a TOTAL maximum of exactly 25 marks.

Your job is to evaluate the student's answers based on:

1. Correctness
2. Relevance
3. Completeness
4. Technical/conceptual accuracy
5. Quality of explanation
6. Logical reasoning
7. Examples where appropriate
8. Important missing concepts
9. Incorrect statements
10. Unanswered questions

============================================================
MARKING RULES
============================================================

TOTAL MAXIMUM = 25 MARKS.

The sum of maximum_marks for all detected questions MUST
be exactly 25.

The sum of obtained_marks MUST NOT exceed 25.

Award marks according to actual answer quality.

Do NOT simply give high marks because the answer is long.

Do NOT give marks for irrelevant content.

A short but correct answer can receive good marks.

A long but incorrect answer must receive low marks.

If an answer is partially correct, award partial marks.

If an answer is completely incorrect, award very low or zero marks.

If a question is unanswered, award zero marks.

If the extracted answer is unclear because of OCR/handwriting
quality, do not assume that the missing content is correct.

============================================================
QUESTION IDENTIFICATION
============================================================

Identify every question and answer that can be detected.

If question numbers are visible, preserve them.

If the assignment contains questions together with answers,
use those questions to judge correctness.

If only student answers are visible and no question/reference
answer is available, mark the evaluation as PROVISIONAL and
do not pretend that correctness can be verified with certainty.

Do not invent a question that is not present.

============================================================
MARK DISTRIBUTION
============================================================

The total maximum marks must be 25.

If individual question marks are explicitly visible,
use those marks.

If individual marks are NOT visible, distribute the 25 marks
reasonably across the detected questions according to their
apparent complexity and expected answer depth.

The final total must still equal exactly 25.

============================================================
PER-QUESTION EVALUATION
============================================================

For every detected question provide:

- question number
- question text
- student answer
- maximum marks
- obtained marks
- correctness score 0-100
- relevance score 0-100
- completeness score 0-100
- answer quality
- verdict:
    Correct
    Partially Correct
    Incorrect
    Unanswered
- short feedback

============================================================
OVERALL EVALUATION
============================================================

Calculate:

Overall Correctness
Overall Relevance
Overall Completeness

Also provide:

- strengths
- weaknesses
- concise overall summary
- overall answer quality

============================================================
AI CONTENT ANALYSIS
============================================================

After evaluating the academic answer, analyze the extracted
TEXT for characteristics commonly associated with AI-generated
writing.

IMPORTANT:

This is NOT a definitive AI detector.

Do NOT claim that AI use has been proven.

A handwritten answer can be written by a student while the
underlying text may have originated from another source.

Therefore classify only as:

"Likely AI-generated"
"Likely human-written"
"Inconclusive"

Consider indicators such as:

- unusually generic wording
- highly uniform sentence structure
- repetitive formal phrasing
- unusually polished language compared with the rest
  of the submission
- generic textbook-like transitions
- excessive structure without corresponding reasoning
- repeated AI-like explanatory patterns

Do NOT classify an answer as AI-generated merely because
it is grammatically correct or well written.

Handwriting itself is NOT evidence of AI generation.

Return:

- classification
- probability from 0 to 100
- confidence from 0 to 100
- observed indicators
- short explanation

If evidence is weak, prefer "Inconclusive".

============================================================
STUDENT ANSWER SHEET
============================================================

{combined_text}
"""

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=EvaluationResponse,
    )

    response = _generate_with_fallback(
        client=client,
        contents=[prompt],
        config=config,
    )

    if not response.text:

        raise RuntimeError("Gemini returned an empty evaluation response.")

    result = EvaluationResponse.model_validate_json(response.text)

    # --------------------------------------------------------
    # HARD SAFETY LIMITS
    # --------------------------------------------------------

    result.total_marks = 25

    result.obtained_marks = max(0, min(25, result.obtained_marks))

    result.percentage = round((result.obtained_marks / 25) * 100, 2)

    # Ensure individual marks never exceed
    # their question maximum.
    for question in result.question_results:

        question.obtained_marks = max(
            0, min(question.maximum_marks, question.obtained_marks)
        )

    # Recalculate total from question-level marks.
    question_total = sum(
        question.obtained_marks for question in result.question_results
    )

    result.obtained_marks = round(min(25, question_total), 2)

    result.percentage = round((result.obtained_marks / 25) * 100, 2)

    # AI probability safety.
    result.ai_content.probability = max(0, min(100, result.ai_content.probability))

    result.ai_content.confidence = max(0, min(100, result.ai_content.confidence))

    return result
