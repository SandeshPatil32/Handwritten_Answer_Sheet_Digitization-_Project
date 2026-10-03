import { Router } from "express";
import {
  createAssignment,
  downloadAssignment,
  downloadReport,
  downloadSimilarityReport,
  getAllAssignments,
  getMyAssignments,
  getStudentAnalytics,
  getSimilarityResults,
  scanAssignment
} from "../controllers/assignmentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { uploadAssignmentPdf } from "../middleware/uploadMiddleware.js";

const router = Router();

router.use(protect);

router.post(
  "/",
  authorize("student"),
  uploadAssignmentPdf,
  createAssignment
);

router.get("/mine", authorize("student"), getMyAssignments);
router.get("/mine/analytics", authorize("student"), getStudentAnalytics);
router.get("/teacher", authorize("teacher"), getAllAssignments);
router.get("/teacher/similarity", authorize("teacher"), getSimilarityResults);
router.get("/teacher/similarity/report", authorize("teacher"), downloadSimilarityReport);

router.get("/:id/file", downloadAssignment);
router.get("/:id/report", downloadReport);
router.post("/:id/scan", scanAssignment);

export default router;
