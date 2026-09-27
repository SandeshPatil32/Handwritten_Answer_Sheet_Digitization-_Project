import fs from "fs";
import path from "path";

import Assignment from "../models/Assignment.js";
import { scanAnswerSheet } from "../services/aiService.js";


const safeAssignment = (assignment) => ({
  id: assignment._id,

  title: assignment.title,

  subject: assignment.subject,

  description: assignment.description,

  fileName: assignment.fileName,

  fileSize: assignment.fileSize,

  mimeType: assignment.mimeType,

  status: assignment.status,

  scanResult: assignment.scanResult || null,

  report: assignment.report || null,

  student:
    assignment.student?._id ||
    assignment.student,

  studentName:
    assignment.student?.name ||
    null,

  studentEmail:
    assignment.student?.email ||
    null,

  createdAt: assignment.createdAt,

  updatedAt: assignment.updatedAt
});


/* =========================================================
   CREATE ASSIGNMENT
========================================================= */

export const createAssignment = async (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({
        message: "Please upload a PDF file."
      });

    }

    const {
      title,
      subject,
      description = ""
    } = req.body;


    if (
      !title?.trim() ||
      !subject?.trim()
    ) {

      return res.status(400).json({
        message:
          "Title and subject are required."
      });

    }


    const assignment =
      await Assignment.create({

        title:
          title.trim(),

        subject:
          subject.trim(),

        description:
          description.trim(),

        fileName:
          req.file.originalname,

        storedFileName:
          req.file.filename,

        filePath:
          req.file.path,

        fileSize:
          req.file.size,

        mimeType:
          req.file.mimetype,

        student:
          req.user._id,

        status:
          "uploaded"

      });


    return res.status(201).json({

      message:
        "Assignment uploaded successfully.",

      assignment:
        safeAssignment(assignment)

    });

  } catch (error) {

    console.error(
      "Create assignment error:",
      error
    );


    if (req.file?.path) {

      fs.unlink(
        req.file.path,
        () => { }
      );

    }


    return res.status(500).json({

      message:
        "Server error while uploading assignment."

    });

  }

};


/* =========================================================
   SCAN + EVALUATE ASSIGNMENT
========================================================= */

export const scanAssignment = async (req, res) => {

  try {

    const assignment =
      await Assignment.findById(
        req.params.id
      );


    if (!assignment) {

      return res.status(404).json({

        message:
          "Assignment not found."

      });

    }


    const isOwner =
      assignment.student.toString() ===
      req.user._id.toString();


    const isTeacher =
      req.user.role === "teacher";


    if (!isOwner && !isTeacher) {

      return res.status(403).json({

        message:
          "You are not authorized to scan this assignment."

      });

    }


    if (
      !fs.existsSync(
        assignment.filePath
      )
    ) {

      return res.status(404).json({

        message:
          "Stored PDF file was not found on the server."

      });

    }


    assignment.status =
      "processing";


    await assignment.save();


    try {

      console.log(
        "\n======================================"
      );

      console.log(
        "[AI] Starting assignment processing"
      );

      console.log(
        `[AI] File: ${assignment.fileName}`
      );

      console.log(
        "======================================\n"
      );


      const scanResult =
        await scanAnswerSheet({

          filePath:
            assignment.filePath,

          originalName:
            assignment.fileName,

          mimeType:
            assignment.mimeType

        });


      /* =====================================================
         SAVE HANDWRITING SCAN
      ===================================================== */

      assignment.scanResult = {

        pagesProcessed:
          scanResult.pagesProcessed || 0,

        pages:
          Array.isArray(
            scanResult.pages
          )

            ? scanResult.pages.map(
              (page) => ({

                pageNumber:
                  Number(
                    page.page_number
                  ),

                text:
                  String(
                    page.text || ""
                  ),

                confidence:
                  typeof page.confidence ===
                    "number"

                    ? page.confidence

                    : null

              })
            )

            : [],

        scannedAt:
          new Date()

      };


      /* =====================================================
         AI EVALUATION
      ===================================================== */

      const evaluation =
        scanResult.evaluation;


      if (!evaluation) {

        assignment.status =
          "scanned";


        await assignment.save();


        return res.json({

          message:
            "PDF scanned successfully, but AI evaluation was not returned.",

          assignment:
            safeAssignment(
              assignment
            ),

          scan:
            scanResult

        });

      }


      /* =====================================================
         MARKS
      ===================================================== */

      const obtainedMarks =
        Math.max(
          0,
          Math.min(
            25,
            Number(
              evaluation.obtained_marks || 0
            )
          )
        );


      const totalMarks = 25;


      const percentage =
        Number(
          (
            obtainedMarks /
            totalMarks *
            100
          ).toFixed(2)
        );


      /* =====================================================
         QUESTION RESULTS
      ===================================================== */

      const questionResults =
        Array.isArray(
          evaluation.question_results
        )

          ? evaluation.question_results.map(
            (question) => ({

              questionNumber:
                String(
                  question.question_number ||
                  ""
                ),

              question:
                String(
                  question.question ||
                  ""
                ),

              answer:
                String(
                  question.answer ||
                  ""
                ),

              maximumMarks:
                Number(
                  question.maximum_marks ||
                  0
                ),

              obtainedMarks:
                Number(
                  question.obtained_marks ||
                  0
                ),

              correctness:
                Number(
                  question.correctness ||
                  0
                ),

              relevance:
                Number(
                  question.relevance ||
                  0
                ),

              completeness:
                Number(
                  question.completeness ||
                  0
                ),

              answerQuality:
                String(
                  question.answer_quality ||
                  ""
                ),

              verdict:
                String(
                  question.verdict ||
                  ""
                ),

              feedback:
                String(
                  question.feedback ||
                  ""
                )

            })
          )

          : [];


      /* =====================================================
         AI CONTENT DETECTION
      ===================================================== */

      const aiContent =
        evaluation.ai_content || {};


      assignment.report = {

        obtainedMarks,

        totalMarks,

        percentage,


        answerQuality:
          String(
            evaluation.answer_quality ||
            ""
          ),


        summary:
          String(
            evaluation.summary ||
            ""
          ),


        strengths:
          Array.isArray(
            evaluation.strengths
          )

            ? evaluation.strengths

            : [],


        weaknesses:
          Array.isArray(
            evaluation.weaknesses
          )

            ? evaluation.weaknesses

            : [],


        overallCorrectness:
          Number(
            evaluation.overall_correctness ||
            0
          ),


        overallRelevance:
          Number(
            evaluation.overall_relevance ||
            0
          ),


        overallCompleteness:
          Number(
            evaluation.overall_completeness ||
            0
          ),


        questionResults,


        aiContent: {

          classification:
            String(
              aiContent.classification ||
              "Inconclusive"
            ),

          probability:
            Math.max(
              0,
              Math.min(
                100,
                Number(
                  aiContent.probability ||
                  0
                )
              )
            ),

          confidence:
            Math.max(
              0,
              Math.min(
                100,
                Number(
                  aiContent.confidence ||
                  0
                )
              )
            ),

          indicators:
            Array.isArray(
              aiContent.indicators
            )

              ? aiContent.indicators

              : [],

          explanation:
            String(
              aiContent.explanation ||
              ""
            )

        },


        evaluatedAt:
          new Date()

      };


      assignment.status =
        "evaluated";


      await assignment.save();


      console.log(
        "\n======================================"
      );

      console.log(
        "[AI] Evaluation completed"
      );

      console.log(
        `[AI] Marks: ${obtainedMarks}/25`
      );

      console.log(
        `[AI] Percentage: ${percentage}%`
      );

      console.log(
        `[AI] AI Content: ${aiContent.classification ||
        "Inconclusive"
        }`
      );

      console.log(
        "======================================\n"
      );


      return res.json({

        message:
          "PDF scanned and evaluated successfully.",

        assignment:
          safeAssignment(
            assignment
          ),

        scan:
          scanResult

      });


    } catch (aiError) {

      console.error(
        "\n[AI SERVICE ERROR]"
      );

      console.error(
        aiError.response?.data ||
        aiError.message
      );


      assignment.status =
        "failed";


      await assignment.save();


      const aiMessage =
        aiError.response?.data?.error ||
        aiError.response?.data?.message ||
        aiError.message ||
        "AI service is unavailable.";


      return res.status(502).json({

        message:
          "AI scanning/evaluation service failed.",

        error:
          aiMessage

      });

    }


  } catch (error) {

    console.error(
      "Scan assignment error:",
      error
    );


    return res.status(500).json({

      message:
        "Server error while scanning assignment."

    });

  }

};


/* =========================================================
   GET STUDENT ASSIGNMENTS
========================================================= */

export const getMyAssignments = async (
  req,
  res
) => {

  try {

    const assignments =
      await Assignment.find({

        student:
          req.user._id

      })
        .sort({
          createdAt: -1
        });


    return res.json({

      assignments:
        assignments.map(
          safeAssignment
        )

    });

  } catch (error) {

    console.error(
      "Get student assignments error:",
      error
    );


    return res.status(500).json({

      message:
        "Server error while loading assignments."

    });

  }

};


/* =========================================================
   GET ALL ASSIGNMENTS FOR TEACHER
========================================================= */

export const getAllAssignments = async (
  req,
  res
) => {

  try {

    const assignments =
      await Assignment.find()

        .populate(
          "student",
          "name email studentId"
        )

        .sort({
          createdAt: -1
        });


    return res.json({

      assignments:
        assignments.map(
          safeAssignment
        )

    });

  } catch (error) {

    console.error(
      "Get all assignments error:",
      error
    );


    return res.status(500).json({

      message:
        "Server error while loading teacher assignments."

    });

  }

};


/* =========================================================
   DOWNLOAD ASSIGNMENT
========================================================= */

export const downloadAssignment = async (
  req,
  res
) => {

  try {

    const assignment =
      await Assignment.findById(
        req.params.id
      );


    if (!assignment) {

      return res.status(404).json({

        message:
          "Assignment not found."

      });

    }


    const isOwner =
      assignment.student.toString() ===
      req.user._id.toString();


    const isTeacher =
      req.user.role === "teacher";


    if (!isOwner && !isTeacher) {

      return res.status(403).json({

        message:
          "You are not authorized to access this file."

      });

    }


    if (
      !fs.existsSync(
        assignment.filePath
      )
    ) {

      return res.status(404).json({

        message:
          "Stored PDF file was not found on the server."

      });

    }


    const safeName =
      path
        .basename(
          assignment.fileName
        )
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );


    res.setHeader(
      "Content-Type",
      assignment.mimeType ||
      "application/pdf"
    );


    res.setHeader(
      "Content-Disposition",
      `inline; filename="${safeName}"`
    );


    return res.sendFile(
      path.resolve(
        assignment.filePath
      )
    );

  } catch (error) {

    console.error(
      "Download assignment error:",
      error
    );


    return res.status(500).json({

      message:
        "Server error while opening assignment."

    });

  }

};