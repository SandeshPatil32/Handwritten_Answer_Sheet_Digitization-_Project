# ai-service/routes/scan_routes.py

from flask import Blueprint, jsonify, request

from services.gemini_service import scan_page, evaluate_assignment
from services.pdf_service import pdf_to_images
from services.preprocessing_service import preprocess_image

scan_bp = Blueprint("scan", __name__)


@scan_bp.post("/scan")
def scan_pdf():

    if "answer_pdf" not in request.files:
        return jsonify({"message": "answer_pdf is required."}), 400

    file = request.files["answer_pdf"]

    if not file.filename:
        return jsonify({"message": "No PDF was selected."}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"message": "Only PDF files are supported."}), 400

    try:

        images = pdf_to_images(file)

        pages = []

        for page_number, image in enumerate(images, start=1):

            print(f"[AI] Processing page " f"{page_number}/{len(images)}")

            processed_image = preprocess_image(image)

            result = scan_page(processed_image, page_number)

            pages.extend(page.model_dump() for page in result.pages)

        if not pages:
            raise RuntimeError("No handwritten text was extracted from the PDF.")

        # --------------------------------------------------
        # AI MARK EVALUATION
        # --------------------------------------------------

        print("[AI] Handwriting transcription completed.")

        print("[AI] Starting assignment evaluation " "out of 25 marks...")

        evaluation = evaluate_assignment(pages)

        print(f"[AI] Suggested Marks: " f"{evaluation.obtained_marks}/25")

        return jsonify(
            {
                "status": "completed",
                "pagesProcessed": len(images),
                "pages": pages,
                "evaluation": evaluation.model_dump(),
            }
        )

    except Exception as error:

        print(f"[AI] Scan/evaluation failed: {error}")

        return (
            jsonify(
                {
                    "status": "failed",
                    "message": "AI scanning/evaluation failed.",
                    "error": str(error),
                }
            ),
            500,
        )
