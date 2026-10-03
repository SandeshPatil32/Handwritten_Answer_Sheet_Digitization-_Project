import os

from flask import Blueprint, jsonify, request

from services.pdf_service import pdf_to_images
from services.preprocessing_service import preprocess_image
from services.gemini_service import scan_page, evaluate_assignment
from services.htr_service import get_htr_engine

scan_bp = Blueprint("scan", __name__)


@scan_bp.get("/htr-status")
def htr_status():
    return jsonify({
        "status": "ok",
        "engine": get_htr_engine(),
        "trocrEnabled": get_htr_engine() in {"trocr", "hybrid"},
    })


@scan_bp.post("/scan")
def scan():
    uploaded_file = request.files.get("answer_pdf")

    if not uploaded_file:
        return jsonify({
            "status": "failed",
            "error": "answer_pdf is required."
        }), 400

    filename = uploaded_file.filename or ""

    if not filename.lower().endswith(".pdf"):
        return jsonify({
            "status": "failed",
            "error": "Only PDF files are supported."
        }), 400

    try:
        pdf_bytes = uploaded_file.read()

        if not pdf_bytes:
            return jsonify({
                "status": "failed",
                "error": "The uploaded PDF is empty."
            }), 400

        images = pdf_to_images(pdf_bytes)

        if not images:
            return jsonify({
                "status": "failed",
                "error": "No readable pages were found in the PDF."
            }), 400

        # Gemini is deliberately the default transcription engine.
        # TrOCR is NOT loaded/downloaded when HTR_ENGINE=gemini.
        htr_engine = request.args.get(
            "htr",
            os.getenv("HTR_ENGINE", "gemini")
        ).strip().lower()

        if htr_engine not in {"gemini", "trocr", "hybrid"}:
            htr_engine = "gemini"

        pages = []

        print(
            f"[AI] Starting scan: pages={len(images)}, "
            f"HTR_ENGINE={htr_engine}"
        )

        for index, image in enumerate(images, start=1):
            print(f"[AI] Processing page {index}/{len(images)}")

            processed_image = preprocess_image(image)

            # Current production/default path:
            # Gemini performs the handwriting transcription.
            page_result = scan_page(
                processed_image,
                page_number=index
            )

            pages.append(page_result)

        evaluation = evaluate_assignment(pages)

        return jsonify({
            "status": "completed",
            "pagesProcessed": len(pages),
            "htrEngine": "gemini",
            "pages": pages,
            "evaluation": evaluation,
        })

    except Exception as error:
        print(f"[AI] Scan/evaluation failed: {error}")

        return jsonify({
            "status": "failed",
            "error": str(error),
        }), 500
