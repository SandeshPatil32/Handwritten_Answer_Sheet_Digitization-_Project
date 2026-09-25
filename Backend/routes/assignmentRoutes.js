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

router.use(protect);

router.post(
  "/",
  authorize("student"),
  uploadAssignmentPdf,
  createAssignment
);

router.get(
  "/mine",
  authorize("student"),
  getMyAssignments
);

router.get(
  "/teacher",
  authorize("teacher"),
  getAllAssignments
);

router.get(
  "/:id/file",
  downloadAssignment
);

export default router;