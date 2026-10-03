import fs from "fs";
import path from "path";
import Assignment from "../models/Assignment.js";
import { scanAnswerSheet } from "../services/aiService.js";
import { buildSimilarity } from "../services/similarityService.js";

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
  student: assignment.student?._id || assignment.student,
  studentName: assignment.student?.name || null,
  studentEmail: assignment.student?.email || null,
  studentId: assignment.student?.studentId || null,
  createdAt: assignment.createdAt,
  updatedAt: assignment.updatedAt
});

const escapeCsv = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const reportToCsv = (assignment) => {
  const report = assignment.report || {};
  const rows = [
    ["Field", "Value"],
    ["Student", assignment.student?.name || ""],
    ["Student Email", assignment.student?.email || ""],
    ["Student ID", assignment.student?.studentId || ""],
    ["Assignment", assignment.title],
    ["Subject", assignment.subject],
    ["Status", assignment.status],
    ["Marks", `${report.obtainedMarks ?? ""}/${report.totalMarks ?? ""}`],
    ["Percentage", report.percentage ?? ""],
    ["Answer Quality", report.answerQuality || ""],
    ["Summary", report.summary || ""],
    ["Missed Concepts", (report.missedConcepts || []).join(" | ")],
    ["Grading Basis", report.gradingBasis || ""]
  ];

  if (Array.isArray(report.questionResults) && report.questionResults.length) {
    rows.push([]);
    rows.push([
      "Question",
      "Maximum Marks",
      "Obtained Marks",
      "Correctness",
      "Relevance",
      "Completeness",
      "Explanation Quality",
      "Quality Score",
      "Verdict",
      "Feedback",
      "Missed Concepts"
    ]);

    report.questionResults.forEach((question) => {
      rows.push([
        question.questionNumber,
        question.maximumMarks,
        question.obtainedMarks,
        question.correctness,
        question.relevance,
        question.completeness,
        question.explanationQuality,
        question.qualityScore,
        question.verdict,
        question.feedback,
        (question.missedConcepts || []).join(" | ")
      ]);
    });
  }

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
};

const getTeacherAssignments = async () =>
  Assignment.find()
    .populate("student", "name email studentId")
    .sort({ createdAt: -1 });

const getComparableSimilarityResults = (assignments) => {
  const results = [];

  for (let i = 0; i < assignments.length; i += 1) {
    for (let j = i + 1; j < assignments.length; j += 1) {
      const first = assignments[i];
      const second = assignments[j];

      if (first.student?._id?.toString() === second.student?._id?.toString()) continue;
      if (first.subject?.trim().toLowerCase() !== second.subject?.trim().toLowerCase()) continue;

      const firstText = first.scanResult?.pages?.map((page) => page.text || "").join(" ").trim();
      const secondText = second.scanResult?.pages?.map((page) => page.text || "").join(" ").trim();
      if (!firstText || !secondText) continue;

      const result = buildSimilarity(first, second);
      results.push({
        ...result,
        assignmentA: { id: first._id, title: first.title, status: first.status },
        assignmentB: { id: second._id, title: second.title, status: second.status }
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
};

export const createAssignment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please upload a PDF file." });

    const { title, subject, description = "" } = req.body;
    if (!title?.trim() || !subject?.trim()) {
      return res.status(400).json({ message: "Title and subject are required." });
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      student: req.user._id,
      status: "uploaded"
    });

    return res.status(201).json({
      message: "Assignment uploaded successfully.",
      assignment: safeAssignment(assignment)
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ message: "Server error while uploading assignment." });
  }
};

export const scanAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found." });

    const isOwner = assignment.student.toString() === req.user._id.toString();
    const isTeacher = req.user.role === "teacher";
    if (!isOwner && !isTeacher) {
      return res.status(403).json({ message: "You are not authorized to scan this assignment." });
    }

    if (!fs.existsSync(assignment.filePath)) {
      return res.status(404).json({ message: "Stored PDF file was not found on the server." });
    }

    assignment.status = "processing";
    await assignment.save();

    try {
      const scanResult = await scanAnswerSheet({
        filePath: assignment.filePath,
        originalName: assignment.fileName,
        mimeType: assignment.mimeType
      });

      assignment.scanResult = {
        pagesProcessed: scanResult.pagesProcessed || 0,
        pages: Array.isArray(scanResult.pages)
          ? scanResult.pages.map((page) => ({
              pageNumber: Number(page.page_number),
              text: String(page.text || ""),
              confidence: typeof page.confidence === "number" ? page.confidence : null
            }))
          : [],
        scannedAt: new Date()
      };

      const evaluation = scanResult.evaluation;

      if (evaluation) {
        const totalMarks = 25;
        const obtainedMarks = Math.max(0, Math.min(totalMarks, Number(evaluation.obtained_marks || 0)));

        assignment.report = {
          obtainedMarks,
          totalMarks,
          percentage: Number(((obtainedMarks / totalMarks) * 100).toFixed(2)),
          answerQuality: String(evaluation.answer_quality || ""),
          summary: String(evaluation.summary || ""),
          strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
          weaknesses: Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [],
          missedConcepts: Array.isArray(evaluation.missed_concepts) ? evaluation.missed_concepts : [],
          overallCorrectness: Number(evaluation.overall_correctness || 0),
          overallRelevance: Number(evaluation.overall_relevance || 0),
          overallCompleteness: Number(evaluation.overall_completeness || 0),
          gradingBasis: String(evaluation.grading_basis || "AI quality-based provisional grading."),
          questionResults: Array.isArray(evaluation.question_results)
            ? evaluation.question_results.map((question) => ({
                questionNumber: String(question.question_number || ""),
                question: String(question.question || ""),
                answer: String(question.answer || ""),
                maximumMarks: Number(question.maximum_marks || 0),
                obtainedMarks: Number(question.obtained_marks || 0),
                correctness: Number(question.correctness || 0),
                relevance: Number(question.relevance || 0),
                completeness: Number(question.completeness || 0),
                explanationQuality: Number(question.explanation_quality || 0),
                qualityScore: Number(question.quality_score || 0),
                answerQuality: String(question.answer_quality || ""),
                verdict: String(question.verdict || ""),
                feedback: String(question.feedback || ""),
                missedConcepts: Array.isArray(question.missed_concepts) ? question.missed_concepts : []
              }))
            : [],
          aiContent: evaluation.ai_content || null,
          evaluatedAt: new Date()
        };
        assignment.status = "evaluated";
      } else {
        assignment.status = "scanned";
      }

      await assignment.save();

      return res.json({
        message: assignment.status === "evaluated" ? "PDF scanned and evaluated successfully." : "PDF scanned successfully.",
        assignment: safeAssignment(assignment),
        scan: scanResult
      });
    } catch (aiError) {
      console.error("AI service error:", aiError.response?.data || aiError.message);
      assignment.status = "failed";
      await assignment.save();

      const aiMessage =
        aiError.response?.data?.error ||
        aiError.response?.data?.message ||
        aiError.message ||
        "AI service is unavailable.";

      return res.status(502).json({ message: "AI scanning/evaluation service failed.", error: aiMessage });
    }
  } catch (error) {
    console.error("Scan assignment error:", error);
    return res.status(500).json({ message: "Server error while scanning assignment." });
  }
};

export const getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ student: req.user._id }).sort({ createdAt: -1 });
    return res.json({ assignments: assignments.map(safeAssignment) });
  } catch (error) {
    console.error("Get student assignments error:", error);
    return res.status(500).json({ message: "Server error while loading assignments." });
  }
};

export const getStudentAnalytics = async (req, res) => {
  try {
    const assignments = await Assignment.find({ student: req.user._id, status: "evaluated" }).sort({ createdAt: 1 });

    const evaluated = assignments.filter((item) => item.report?.obtainedMarks != null);
    const averageMarks = evaluated.length
      ? Number((evaluated.reduce((sum, item) => sum + Number(item.report.obtainedMarks || 0), 0) / evaluated.length).toFixed(2))
      : 0;

    const averagePercentage = evaluated.length
      ? Number((evaluated.reduce((sum, item) => sum + Number(item.report.percentage || 0), 0) / evaluated.length).toFixed(2))
      : 0;

    const subjectMap = new Map();
    const questionMap = new Map();
    const conceptMap = new Map();

    evaluated.forEach((assignment) => {
      const subject = assignment.subject || "Unknown";
      const subjectEntry = subjectMap.get(subject) || { subject, attempts: 0, totalMarks: 0, totalPercentage: 0 };
      subjectEntry.attempts += 1;
      subjectEntry.totalMarks += Number(assignment.report.obtainedMarks || 0);
      subjectEntry.totalPercentage += Number(assignment.report.percentage || 0);
      subjectMap.set(subject, subjectEntry);

      const reportConcepts = [
        ...(assignment.report.missedConcepts || []),
        ...(assignment.report.weaknesses || [])
      ];
      reportConcepts.forEach((concept) => {
        const clean = String(concept).trim();
        if (!clean) return;
        conceptMap.set(clean, (conceptMap.get(clean) || 0) + 1);
      });

      (assignment.report.questionResults || []).forEach((question) => {
        const key = question.questionNumber || "Unknown";
        const entry = questionMap.get(key) || {
          questionNumber: key,
          attempts: 0,
          totalMarks: 0,
          obtainedMarks: 0,
          correctness: 0,
          completeness: 0
        };
        entry.attempts += 1;
        entry.totalMarks += Number(question.maximumMarks || 0);
        entry.obtainedMarks += Number(question.obtainedMarks || 0);
        entry.correctness += Number(question.correctness || 0);
        entry.completeness += Number(question.completeness || 0);
        questionMap.set(key, entry);
      });
    });

    const subjectPerformance = [...subjectMap.values()].map((entry) => ({
      subject: entry.subject,
      attempts: entry.attempts,
      averageMarks: Number((entry.totalMarks ? entry.totalMarks / entry.attempts : 0).toFixed(2)),
      averagePercentage: Number((entry.totalPercentage / entry.attempts).toFixed(2))
    })).sort((a, b) => b.averagePercentage - a.averagePercentage);

    const questionPerformance = [...questionMap.values()].map((entry) => ({
      questionNumber: entry.questionNumber,
      attempts: entry.attempts,
      averageMarks: Number((entry.obtainedMarks / entry.attempts).toFixed(2)),
      averageCorrectness: Number((entry.correctness / entry.attempts).toFixed(2)),
      averageCompleteness: Number((entry.completeness / entry.attempts).toFixed(2))
    })).sort((a, b) => a.averageCorrectness - b.averageCorrectness);

    const missedConcepts = [...conceptMap.entries()]
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const improvementOverTime = evaluated.map((assignment) => ({
      date: assignment.createdAt,
      title: assignment.title,
      subject: assignment.subject,
      marks: Number(assignment.report.obtainedMarks || 0),
      percentage: Number(assignment.report.percentage || 0)
    }));

    return res.json({
      totalEvaluated: evaluated.length,
      averageMarks,
      averagePercentage,
      subjectPerformance,
      questionPerformance,
      missedConcepts,
      improvementOverTime
    });
  } catch (error) {
    console.error("Student analytics error:", error);
    return res.status(500).json({ message: "Server error while generating student analytics." });
  }
};

export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await getTeacherAssignments();
    return res.json({ assignments: assignments.map(safeAssignment) });
  } catch (error) {
    console.error("Get all assignments error:", error);
    return res.status(500).json({ message: "Server error while loading teacher assignments." });
  }
};

export const getSimilarityResults = async (req, res) => {
  try {
    const assignments = await getTeacherAssignments();
    const results = getComparableSimilarityResults(assignments);
    return res.json({ count: results.length, results });
  } catch (error) {
    console.error("Similarity analysis error:", error);
    return res.status(500).json({ message: "Server error while calculating student similarity." });
  }
};

export const downloadAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found." });

    const isOwner = assignment.student.toString() === req.user._id.toString();
    const isTeacher = req.user.role === "teacher";
    if (!isOwner && !isTeacher) return res.status(403).json({ message: "You are not authorized to access this file." });
    if (!fs.existsSync(assignment.filePath)) return res.status(404).json({ message: "Stored PDF file was not found on the server." });

    const safeName = path.basename(assignment.fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
    const shouldDownload = req.query.download === "1";
    res.setHeader("Content-Type", assignment.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `${shouldDownload ? "attachment" : "inline"}; filename="${safeName}"`);
    return res.sendFile(path.resolve(assignment.filePath));
  } catch (error) {
    console.error("Download assignment error:", error);
    return res.status(500).json({ message: "Server error while opening assignment." });
  }
};

export const downloadReport = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("student", "name email studentId");
    if (!assignment) return res.status(404).json({ message: "Assignment not found." });

    const isOwner = assignment.student?._id?.toString() === req.user._id.toString();
    const isTeacher = req.user.role === "teacher";
    if (!isOwner && !isTeacher) return res.status(403).json({ message: "You are not authorized to access this report." });

    const format = String(req.query.format || "json").toLowerCase();
    const baseName = path.basename(assignment.fileName, path.extname(assignment.fileName)).replace(/[^a-zA-Z0-9._-]/g, "_");

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${baseName}_evaluation_report.csv"`);
      return res.send(`\ufeff${reportToCsv(assignment)}`);
    }

    const report = {
      generatedAt: new Date().toISOString(),
      assignment: safeAssignment(assignment),
      extractedPages: assignment.scanResult?.pages || [],
      evaluation: assignment.report || null
    };

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${baseName}_evaluation_report.json"`);
    return res.send(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("Download report error:", error);
    return res.status(500).json({ message: "Server error while generating the report." });
  }
};

export const downloadSimilarityReport = async (req, res) => {
  try {
    const results = getComparableSimilarityResults(await getTeacherAssignments());
    const rows = [["Student A", "Student B", "Subject", "Similarity %", "Status", "Common Phrases"]];
    results.forEach((result) => rows.push([
      result.studentA.name,
      result.studentB.name,
      result.subject,
      result.score,
      result.status,
      result.commonPhrases.join(" | ")
    ]));

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="student_similarity_report.csv"');
    return res.send(`\ufeff${csv}`);
  } catch (error) {
    console.error("Download similarity report error:", error);
    return res.status(500).json({ message: "Server error while generating similarity report." });
  }
};
