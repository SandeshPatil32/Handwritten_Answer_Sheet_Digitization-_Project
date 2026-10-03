import os

from services.pdf_service import file_to_images

from services.preprocessing_service import prepare_image

from services.gemini_service import (
    extract_answers_from_page,
    evaluate_questions,
    embed_texts,
)

from services.similarity_service import calculate_reference_similarity


def evaluate_answer_sheet(file, questions):

    if not os.getenv("GEMINI_API_KEY"):

        raise ValueError("GEMINI_API_KEY is missing.") 

    images = file_to_images(file)

    all_answers = []

    for page_number, image in enumerate(images, start=1):

        variants = prepare_image(image)

        extraction = extract_answers_from_page(variants["processed"], questions)


        if not extraction.answers or all(
            not answer.student_answer.strip() for answer in extraction.answers
        ):

            extraction = extract_answers_from_page(variants["original"], questions)


        for answer in extraction.answers:

            all_answers.append(
                {
                    "page": page_number,
                    "questionNumber": answer.question_number,
                    "studentAnswer": answer.student_answer,
                    "confidence": answer.confidence,
                }
            )

    merged = {}

    for answer in all_answers:

        q_no = answer["questionNumber"]

        if q_no not in merged:

            merged[q_no] = answer

        else:

            merged[q_no]["studentAnswer"] += "\n" + answer["studentAnswer"]

            merged[q_no]["confidence"] = min(
                merged[q_no]["confidence"], answer["confidence"]
            )


    extracted_objects = []

    for answer in merged.values():

        obj = type(
            "Answer",
            (),
            {
                "question_number": answer["questionNumber"],
                "student_answer": answer["studentAnswer"],
            },
        )()

        extracted_objects.append(obj)


    evaluation = evaluate_questions(extracted_objects, questions)



    total_marks = sum(float(q.get("maximumMarks", 0)) for q in questions)

    obtained_marks = sum(
        float(evaluation_item.suggested_marks)
        for evaluation_item in evaluation.evaluations
    )

    percentage = obtained_marks / total_marks * 100 if total_marks > 0 else 0

    percentage = round(percentage, 2)

    if percentage >= 85:

        quality = "Excellent"

    elif percentage >= 70:

        quality = "Good"

    elif percentage >= 50:

        quality = "Average"

    else:

        quality = "Needs Improvement"

    similarity = calculate_reference_similarity(
        extracted_objects, questions, embed_texts
    )

    return {
        "status": "completed",
        "pagesProcessed": len(images),
        "extractedAnswers": all_answers,
        "questions": [
            evaluation_item.model_dump() for evaluation_item in evaluation.evaluations
        ],
        "referenceSimilarity": similarity,
        "obtainedMarks": round(obtained_marks, 2),
        "totalMarks": round(total_marks, 2),
        "percentage": percentage,
        "answerQuality": quality,
        "summary": evaluation.overall_summary,
        "evaluationStatus": "pending_teacher_verification",
    }
