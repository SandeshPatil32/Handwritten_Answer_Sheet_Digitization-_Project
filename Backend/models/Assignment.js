import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    obtainedMarks: {
      type: Number,
      default: null
    },

    totalMarks: {
      type: Number,
      default: null
    },

    percentage: {
      type: Number,
      default: null
    },

    answerQuality: {
      type: String,
      default: null
    },

    summary: {
      type: String,
      default: null
    },

    evaluatedAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: false
  }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    // Original PDF name
    fileName: {
      type: String,
      required: true
    },

    // Name actually stored on server
    storedFileName: {
      type: String,
      required: true
    },

    // Server file path
    filePath: {
      type: String,
      required: true
    },

    fileSize: {
      type: Number,
      required: true
    },

    mimeType: {
      type: String,
      required: true
    },

    // Student who uploaded the assignment
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: [
        "uploaded",
        "processing",
        "evaluated",
        "failed"
      ],
      default: "uploaded",
      index: true
    },

    // AI report will use this later
    report: {
      type: reportSchema,
      default: () => ({})
    }
  },

  {
    timestamps: true
  }
);

export default mongoose.model(
  "Assignment",
  assignmentSchema
);