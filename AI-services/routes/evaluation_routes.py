import json

from flask import Blueprint, request, jsonify

from services.evaluation_service import evaluate_answer_sheet

evaluation_bp = Blueprint("evaluation", __name__)


@evaluation_bp.post("/evaluate")
def evaluate():

    if "answer_file" not in request.files:

        return jsonify({"error": "answer_file is required"}), 400

    answer_file = request.files["answer_file"]

    if not answer_file.filename:

        return jsonify({"error": "No file selected"}), 400

    questions_json = request.form.get("questions")

    if not questions_json:

        return jsonify({"error": "questions is required"}), 400

    try:

        questions = json.loads(questions_json)

    except Exception:

        return jsonify({"error": "Invalid questions JSON"}), 400

    if not isinstance(questions, list):

        return jsonify({"error": "questions must be an array"}), 400

    try:

        result = evaluate_answer_sheet(answer_file, questions)

        return jsonify(result), 200

    except Exception as error:

        print("AI ERROR:", error)

        return jsonify({"error": "Evaluation failed", "details": str(error)}), 500
