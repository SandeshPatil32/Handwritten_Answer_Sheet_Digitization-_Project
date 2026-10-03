"""
Handwritten Text Recognition service.

Default mode is Gemini so the application does NOT download/load
the large TrOCR model. TrOCR can be added later as an optional engine.
"""

import os
from typing import Optional

from PIL import Image


def get_htr_engine() -> str:
    return os.getenv("HTR_ENGINE", "gemini").strip().lower()


def should_use_trocr() -> bool:
    return get_htr_engine() in {"trocr", "hybrid"}


def validate_image(image: Image.Image) -> Optional[str]:
    if image is None:
        return "Image is missing."

    if image.width < 100 or image.height < 100:
        return "Image resolution is too small for reliable handwriting recognition."

    return None


def get_engine_status() -> dict:
    engine = get_htr_engine()

    return {
        "engine": engine,
        "trocrEnabled": should_use_trocr(),
        "message": (
            "Gemini handwriting transcription is enabled."
            if engine == "gemini"
            else f"HTR engine configured as '{engine}'."
        ),
    }
