from sklearn.metrics.pairwise import cosine_similarity


def calculate_similarity(vector_a, vector_b):

    if not vector_a or not vector_b:

        return 0.0

    score = cosine_similarity([vector_a], [vector_b])[0][0]

    return round(float(score), 4)


def calculate_reference_similarity(answers, questions, embedding_function):

    student_answers = {
        int(answer.question_number): answer.student_answer for answer in answers
    }

    results = []

    for question in questions:

        question_number = int(question["questionNumber"])

        student_answer = student_answers.get(question_number, "")

        reference_answer = question.get("referenceAnswer", "")

        if not student_answer.strip() or not reference_answer.strip():

            score = 0

        else:

            vectors = embedding_function([student_answer, reference_answer])

            score = calculate_similarity(vectors[0], vectors[1])

        results.append(
            {"questionNumber": question_number, "referenceSimilarity": score}
        )

    return results
