import { Router } from "express";

import {
  createAssignment,
  downloadAssignment,
  getAllAssignments,
  getMyAssignments
} from "../controllers/assignmentController.js";

import {
  authorize,
  protect
} from "../middleware/authMiddleware.js";

import {
  uploadAssignmentPdf
} from "../middleware/uploadMiddleware.js";

const router = Router();


// Every assignment API requires login
router.use(protect);


// Student upload
router.post(
  "/",
  authorize("student"),
  uploadAssignmentPdf,
  createAssignment
);


// Student's own assignments
router.get(
  "/mine",
  authorize("student"),
  getMyAssignments
);


// Teacher sees all student assignments
router.get(
  "/teacher",
  authorize("teacher"),
  getAllAssignments
);


// Student/teacher can view authorized PDF
router.get(
  "/:id/file",
  downloadAssignment
);

export default router;