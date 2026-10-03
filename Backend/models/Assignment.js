import mongoose from "mongoose";

const scanPageSchema = new mongoose.Schema(
  {
    pageNumber: { type: Number, required: true },
    text: { type: String, default: "" },
    confidence: { type: Number, min: 0, max: 1, default: null }
  },
  { _id: false }
);

const scanResultSchema = new mongoose.Schema(
  {
    pagesProcessed: { type: Number, default: 0 },
    pages: { type: [scanPageSchema], default: [] },
    scannedAt: { type: Date, default: null }
  },
  { _id: false }
);

const questionResultSchema = new mongoose.Schema(
  {
    questionNumber: { type: String, default: "" },
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
    maximumMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    correctness: { type: Number, min: 0, max: 100, default: 0 },
    relevance: { type: Number, min: 0, max: 100, default: 0 },
    completeness: { type: Number, min: 0, max: 100, default: 0 },
    explanationQuality: { type: Number, min: 0, max: 100, default: 0 },
    qualityScore: { type: Number, min: 0, max: 100, default: 0 },
    answerQuality: { type: String, default: "" },
    verdict: { type: String, default: "" },
    feedback: { type: String, default: "" },
    missedConcepts: { type: [String], default: [] }
  },
  { _id: false }
);

const aiContentSchema = new mongoose.Schema(
  {
    classification: { type: String, default: "Inconclusive" },
    probability: { type: Number, min: 0, max: 100, default: 0 },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    indicators: { type: [String], default: [] },
    explanation: { type: String, default: "" }
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    obtainedMarks: { type: Number, default: null },
    totalMarks: { type: Number, default: 25 },
    percentage: { type: Number, default: null },
    answerQuality: { type: String, default: null },
    summary: { type: String, default: null },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missedConcepts: { type: [String], default: [] },
    overallCorrectness: { type: Number, min: 0, max: 100, default: 0 },
    overallRelevance: { type: Number, min: 0, max: 100, default: 0 },
    overallCompleteness: { type: Number, min: 0, max: 100, default: 0 },
    questionResults: { type: [questionResultSchema], default: [] },
    aiContent: { type: aiContentSchema, default: null },
    gradingBasis: { type: String, default: "" },
    evaluatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    fileName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "scanned", "evaluated", "failed"],
      default: "uploaded",
      index: true
    },
    scanResult: {
      type: scanResultSchema,
      default: () => ({ pagesProcessed: 0, pages: [] })
    },
    report: { type: reportSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
