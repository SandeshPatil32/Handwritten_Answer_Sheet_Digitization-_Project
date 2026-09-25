import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.resolve(
  "uploads",
  "assignments"
);

// Create folder automatically
fs.mkdirSync(uploadDirectory, {
  recursive: true
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 50);

    const finalName =
      `${Date.now()}-${baseName || "assignment"}${extension}`;

    cb(null, finalName);
  }
});

// Only PDF
const fileFilter = (_req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" &&
    path.extname(file.originalname).toLowerCase() === ".pdf";

  if (!isPdf) {
    return cb(
      new Error("Only PDF files are allowed.")
    );
  }

  cb(null, true);
};

export const uploadAssignmentPdf = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024
  }
}).single("assignmentPdf");