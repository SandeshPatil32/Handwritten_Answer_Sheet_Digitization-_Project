import fs from "fs";
import path from "path";
import Assignment from "../models/Assignment.js";

const safeAssignment = (assignment) => ({
  id: assignment._id,

  title: assignment.title,

  subject: assignment.subject,

  description: assignment.description,

  fileName: assignment.fileName,

  fileSize: assignment.fileSize,

  mimeType: assignment.mimeType,

  status: assignment.status,

  report: assignment.report || null,

  student:
    assignment.student?._id ||
    assignment.student,

  studentName:
    assignment.student?.name || null,

  studentEmail:
    assignment.student?.email || null,

  createdAt: assignment.createdAt,

  updatedAt: assignment.updatedAt
});


export const createAssignment = async (
  req,
  res
) => {
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
        title: title.trim(),

        subject: subject.trim(),

        description: description.trim(),

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

        status: "uploaded"
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

    // Delete uploaded file if database
    // operation fails
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


// ======================================
// STUDENT GET OWN ASSIGNMENTS
// ======================================

export const getMyAssignments = async (
  req,
  res
) => {
  try {
    const assignments =
      await Assignment.find({
        student: req.user._id
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
        .basename(assignment.fileName)
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