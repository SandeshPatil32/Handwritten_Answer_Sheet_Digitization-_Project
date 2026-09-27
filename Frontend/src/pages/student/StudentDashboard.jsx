import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  UploadCloud,
  Eye,
  Clock3,
  CheckCircle2,
  ScanText,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

import {
  fetchMyAssignments,
  uploadAssignment,
  scanAssignment,
  clearAssignmentError,
} from "../../features/assignments/assignmentSlice";

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined || Number(bytes) <= 0) {
    return "0 KB";
  }

  const value = Number(bytes);

  if (Number.isNaN(value)) {
    return "N/A";
  }

  const units = ["Bytes", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  const converted = value / Math.pow(1024, index);

  return `${converted.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const formatConfidence = (confidence) => {
  if (confidence === null || confidence === undefined) {
    return "N/A";
  }

  const value = Number(confidence);

  if (Number.isNaN(value)) {
    return "N/A";
  }


  const percentage = value <= 1 ? value * 100 : value;

  return `${Math.round(Math.max(0, Math.min(100, percentage)))}%`;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

/* =========================================================
   STUDENT DASHBOARD
========================================================= */

export default function StudentDashboard() {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const {
    items: assignments = [],
    loading,
    uploadLoading,
    scanLoading,
    error,
    uploadError,
    scanError,
  } = useSelector((state) => state.assignments);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
  });

  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState("");
  const [validationError, setValidationError] = useState("");
  const [scanningId, setScanningId] = useState(null);

  /* =======================================================
     LOAD ASSIGNMENTS
  ======================================================= */

  useEffect(() => {
    dispatch(fetchMyAssignments());
    dispatch(clearAssignmentError());
  }, [dispatch]);

  /* =======================================================
     HANDLE FORM SUBMIT
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccess("");
    setValidationError("");

    /* ---------------------------------------------
       Validate file
    --------------------------------------------- */

    if (!file) {
      setValidationError("Please select an answered PDF.");
      return;
    }

    if (file.type !== "application/pdf") {
      setValidationError("Only PDF files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError("PDF must be 10 MB or smaller.");
      return;
    }

    /* ---------------------------------------------
       Validate title
    --------------------------------------------- */

    if (!form.title.trim()) {
      setValidationError("Assignment title is required.");
      return;
    }

    /* ---------------------------------------------
       Validate subject
    --------------------------------------------- */

    if (!form.subject.trim()) {
      setValidationError("Subject is required.");
      return;
    }

    /* ---------------------------------------------
       Create multipart form data
    --------------------------------------------- */

    const formData = new FormData();

    formData.append("title", form.title.trim());
    formData.append("subject", form.subject.trim());
    formData.append("description", form.description.trim());
    formData.append("assignmentPdf", file);

    /* ---------------------------------------------
       Upload assignment
    --------------------------------------------- */

    const uploadResult = await dispatch(uploadAssignment(formData));

    if (!uploadAssignment.fulfilled.match(uploadResult)) {
      return;
    }

    /*
      Depending on your Redux response structure,
      the ID should normally be available here.
    */

    const assignmentId =
      uploadResult.payload?.id ||
      uploadResult.payload?.assignment?.id;

    if (!assignmentId) {
      setValidationError(
        "Assignment uploaded, but assignment ID was not returned by the server."
      );
      return;
    }

    /* ---------------------------------------------
       Reset form
    --------------------------------------------- */

    setForm({
      title: "",
      subject: "",
      description: "",
    });

    setFile(null);

    const fileInput = document.getElementById("assignmentPdf");

    if (fileInput) {
      fileInput.value = "";
    }

    /* ---------------------------------------------
       Start AI scanning
    --------------------------------------------- */

    setScanningId(assignmentId);

    setSuccess(
      "PDF uploaded. Sending it to the Python AI service for scanning..."
    );

    const scanResult = await dispatch(scanAssignment(assignmentId));

    setScanningId(null);

    if (scanAssignment.fulfilled.match(scanResult)) {
      setSuccess(
        "PDF uploaded and evaluated successfully. Marks and AI analysis are now available below."
      );

      /*
        Refresh assignment list so the latest report
        is displayed immediately.
      */
      dispatch(fetchMyAssignments());
    }
  };

  /* =======================================================
     OPEN PDF
  ======================================================= */

  const openPdf = async (assignmentId) => {
    const newTab = window.open("about:blank", "_blank");

    try {
      const response = await api.get(
        `/assignments/${assignmentId}/file`,
        {
          responseType: "blob",
        }
      );

      const url = URL.createObjectURL(response.data);

      if (newTab) {
        newTab.location.href = url;
      } else {
        window.open(url, "_blank");
      }

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch (err) {
      if (newTab) {
        newTab.close();
      }

      alert(
        err.response?.data?.message ||
        "Unable to open the PDF."
      );
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="container-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-8 text-white shadow-sm">
          <p className="text-sm text-blue-100">
            Student Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Welcome, {user?.name || "Student"}
          </h1>

          <p className="mt-2 max-w-3xl text-blue-100">
            Upload your answered assignment PDF for AI-powered evaluation, including handwriting recognition, answer correctness, marks calculation, similarity detection, and AI-content analysis.
          </p>
        </section>

  

        <section className="mt-7 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">


          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <UploadCloud size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Upload & Scan Assignment
                </h2>

                <p className="text-xs text-slate-500">
                  PDF only · maximum 10 MB
                </p>
              </div>

            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >

      

              {validationError && (
                <Alert
                  message={validationError}
                  type="error"
                />
              )}

              {/* Upload error */}

              {uploadError && (
                <Alert
                  message={uploadError}
                  type="error"
                />
              )}

            

              {scanError && (
                <Alert
                  message={scanError}
                  type="error"
                />
              )}



              {success && (
                <Alert
                  message={success}
                  type="success"
                />
              )}


              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Assignment Title
                </label>

                <input
                  className="input-field"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. NLP Unit 2 Assignment"
                />
              </div>



              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Subject
                </label>

                <input
                  className="input-field"
                  required
                  value={form.subject}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subject: e.target.value,
                    })
                  }
                  placeholder="e.g. Artificial Intelligence"
                />
              </div>



              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  className="input-field min-h-24 resize-y"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional assignment details"
                />
              </div>



              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Answered Assignment PDF
                </label>

                <input
                  id="assignmentPdf"
                  className="block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={(e) =>
                    setFile(
                      e.target.files?.[0] || null
                    )
                  }
                />
              </div>



              <button
                type="submit"
                disabled={
                  uploadLoading ||
                  scanLoading ||
                  scanningId !== null
                }
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadLoading
                  ? "Uploading..."
                  : scanLoading || scanningId !== null
                    ? "Scanning with AI..."
                    : "Upload & Scan PDF"}
              </button>

            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  My Assignments
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Uploaded PDFs and AI evaluation results.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {assignments.length} uploaded
              </span>

            </div>



            {error && (
              <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}



            {loading ? (

              <div className="py-12 text-center text-sm text-slate-500">
                Loading assignments...
              </div>

            ) : assignments.length === 0 ? (

              

              <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center">

                <FileText
                  className="mx-auto text-slate-400"
                  size={34}
                />

                <p className="mt-3 font-semibold text-slate-700">
                  No assignments yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Upload your first answered assignment
                  using the form.
                </p>

              </div>

            ) : (



              <div className="mt-6 space-y-4">

                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onOpen={openPdf}
                    isScanning={
                      scanningId === assignment.id
                    }
                  />
                ))}

              </div>
            )}

          </div>

        </section>
      </div>
    </main>
  );
}



function AssignmentCard({
  assignment,
  onOpen,
  isScanning,
}) {
  const reportReady =
    assignment.status === "evaluated" &&
    assignment.report?.obtainedMarks !== null &&
    assignment.report?.obtainedMarks !== undefined;

  const pages =
    assignment.scanResult?.pages || [];

  const aiContent =
    assignment.report?.aiContent || null;

  return (
    <article className="rounded-xl border border-slate-200 p-5">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="flex gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <FileText size={19} />
          </div>

          <div>

            <h3 className="font-bold text-slate-900">
              {assignment.title || "Untitled Assignment"}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {assignment.subject || "No subject"} ·{" "}
              {formatDate(assignment.createdAt)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {assignment.fileName || "PDF"} ·{" "}
              {formatBytes(assignment.fileSize)}
            </p>

          </div>

        </div>



        <button
          type="button"
          onClick={() => onOpen(assignment.id)}
          className="btn-secondary gap-2 px-3 py-2 text-xs"
        >
          <Eye size={15} />
          View PDF
        </button>

      </div>

      {/* ===================================================
          RESULT AREA
      =================================================== */}

      <div className="mt-5 rounded-xl bg-slate-50 p-4">

        {/* =================================================
            PROCESSING
        ================================================= */}

        {isScanning ||
          assignment.status === "processing" ? (

          <div className="flex gap-3">

            <ScanText
              className="mt-0.5 shrink-0 animate-pulse text-blue-600"
              size={19}
            />

            <div>

              <p className="text-sm font-semibold text-slate-800">
                AI evaluation in progress
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                The AI is reading the handwriting,
                identifying answers, checking correctness,
                evaluating answer quality, calculating
                suggested marks out of 25, and analysing
                possible AI-generated content.
              </p>

            </div>

          </div>

        ) : reportReady ? (

  

          <div>

          

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <ReportValue
                label="Marks"
                value={`${assignment.report.obtainedMarks}/25`}
              />

              <ReportValue
                label="Percentage"
                value={`${assignment.report.percentage ?? 0}%`}
              />

              <ReportValue
                label="Correctness"
                value={`${Math.round(
                  assignment.report.overallCorrectness || 0
                )}%`}
              />

              <ReportValue
                label="Completeness"
                value={`${Math.round(
                  assignment.report.overallCompleteness || 0
                )}%`}
              />

            </div>

            {/* =============================================
                RELEVANCE
            ============================================= */}

            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Overall Relevance
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {Math.round(
                  assignment.report.overallRelevance || 0
                )}
                %
              </p>

            </div>

            {/* =============================================
                ANSWER QUALITY
            ============================================= */}

            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Overall Answer Quality
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {assignment.report.answerQuality || "Not available"}
              </p>

              {assignment.report.summary && (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {assignment.report.summary}
                </p>
              )}

            </div>

      

            {aiContent && (

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      AI Content Analysis
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {aiContent.classification ||
                        "Inconclusive"}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-xs text-slate-500">
                      Estimated likelihood
                    </p>

                    <p className="font-bold text-slate-900">
                      {Math.round(
                        aiContent.probability || 0
                      )}
                      %
                    </p>

                  </div>

                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This is an AI-content likelihood
                  estimate, not proof of AI usage.
                </p>

                {aiContent.confidence !== undefined &&
                  aiContent.confidence !== null && (
                    <p className="mt-2 text-xs text-slate-500">
                      Detection confidence:{" "}
                      {Math.round(
                        aiContent.confidence || 0
                      )}
                      %
                    </p>
                  )}

                {aiContent.explanation && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {aiContent.explanation}
                  </p>
                )}

                {aiContent.indicators?.length > 0 && (

                  <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-600">

                    {aiContent.indicators.map(
                      (indicator, index) => (
                        <li key={index}>
                          {indicator}
                        </li>
                      )
                    )}

                  </ul>

                )}

              </div>
            )}

            {/* =============================================
                QUESTION-WISE RESULTS
            ============================================= */}

            {assignment.report.questionResults?.length > 0 && (

              <div className="mt-5">

                <p className="mb-3 text-sm font-bold text-slate-900">
                  Question-wise Evaluation
                </p>

                <div className="space-y-3">

                  {assignment.report.questionResults.map(
                    (question, index) => (

                      <div
                        key={`${question.questionNumber || "question"}-${index}`}
                        className="rounded-lg border border-slate-200 bg-white p-4"
                      >

                        <div className="flex flex-wrap items-center justify-between gap-2">

                          <p className="font-semibold text-slate-900">
                            Q{question.questionNumber || index + 1}
                          </p>

                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {question.obtainedMarks ?? 0}/
                            {question.maximumMarks ?? 0}
                          </span>

                        </div>

                        {question.question && (
                          <div className="mt-3">

                            <p className="text-xs font-semibold text-slate-500">
                              Question
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {question.question}
                            </p>

                          </div>
                        )}

                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          Verdict:{" "}
                          <span className="text-slate-800">
                            {question.verdict || "Not available"}
                          </span>
                        </p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">

                          <Metric
                            label="Correctness"
                            value={question.correctness}
                          />

                          <Metric
                            label="Relevance"
                            value={question.relevance}
                          />

                          <Metric
                            label="Completeness"
                            value={question.completeness}
                          />

                        </div>

                        {question.answer && (
                          <div className="mt-3">

                            <p className="text-xs font-semibold text-slate-500">
                              Extracted Answer
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {question.answer}
                            </p>

                          </div>
                        )}

                        {question.answerQuality && (
                          <p className="mt-3 text-xs text-slate-500">
                            Answer quality:{" "}
                            <span className="font-semibold text-slate-700">
                              {question.answerQuality}
                            </span>
                          </p>
                        )}

                        {question.feedback && (
                          <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                            {question.feedback}
                          </p>
                        )}

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* =============================================
                STRENGTHS / WEAKNESSES
            ============================================= */}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              {/* Strengths */}

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                  Strengths
                </p>

                {assignment.report.strengths?.length > 0 ? (

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-green-800">

                    {assignment.report.strengths.map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}

                  </ul>

                ) : (

                  <p className="mt-2 text-sm text-green-800">
                    No strengths reported.
                  </p>

                )}

              </div>

              {/* Weaknesses */}

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                  Areas to Improve
                </p>

                {assignment.report.weaknesses?.length > 0 ? (

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">

                    {assignment.report.weaknesses.map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}

                  </ul>

                ) : (

                  <p className="mt-2 text-sm text-red-800">
                    No specific weaknesses reported.
                  </p>

                )}

              </div>

            </div>

            {/* Teacher verification warning */}

            <p className="mt-4 text-xs leading-5 text-amber-700">
              ⚠ AI-generated marks are suggested marks
              and should be verified by the teacher before
              they are treated as final marks.
            </p>

          </div>

        ) : assignment.status === "scanned" &&
          pages.length > 0 ? (

          /* =================================================
             SCAN ONLY RESULT
          ================================================= */

          <div>

            <div className="flex items-center gap-2">

              <CheckCircle2
                className="text-green-600"
                size={18}
              />

              <p className="text-sm font-semibold text-slate-800">
                Handwriting scan completed
              </p>

              <span className="ml-auto text-xs font-semibold text-slate-500">
                {pages.length} page(s)
              </span>

            </div>

            <div className="mt-4 space-y-3">

              {pages.map((page, index) => (

                <div
                  key={page.pageNumber ?? index}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">

                    <span>
                      Page {page.pageNumber ?? index + 1}
                    </span>

                    <span>
                      Confidence:{" "}
                      {formatConfidence(
                        page.confidence
                      )}
                    </span>

                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {page.text ||
                      "No readable text returned."}
                  </p>

                </div>

              ))}

            </div>

          </div>

        ) : assignment.status === "failed" ? (

          /* =================================================
             FAILED
          ================================================= */

          <div className="flex gap-3">

            <AlertCircle
              className="mt-0.5 shrink-0 text-red-600"
              size={19}
            />

            <div>

              <p className="text-sm font-semibold text-slate-800">
                AI evaluation failed
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Check the Node.js backend and Python
                AI-service terminals for the exact error.
              </p>

            </div>

          </div>

        ) : (

          /* =================================================
             DEFAULT
          ================================================= */

          <div className="flex gap-3">

            <Clock3
              className="mt-0.5 shrink-0 text-amber-600"
              size={19}
            />

            <div>

              <p className="text-sm font-semibold text-slate-800">
                Uploaded; evaluation not completed
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your assignment has been uploaded and is
                waiting for processing.
              </p>

            </div>

          </div>

        )}

      </div>
    </article>
  );
}

/* =========================================================
   REPORT VALUE
========================================================= */

function ReportValue({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   METRIC
========================================================= */

function Metric({ label, value }) {
  const numericValue = Number(value);

  const safeValue = Number.isNaN(numericValue)
    ? 0
    : Math.max(0, Math.min(100, numericValue));

  return (
    <div className="rounded-md bg-slate-50 p-2">

      <p className="text-[11px] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {Math.round(safeValue)}%
      </p>

    </div>
  );
}

/* =========================================================
   ALERT
========================================================= */

function Alert({ message, type = "error" }) {
  const isSuccess = type === "success";

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${isSuccess
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
        }`}
    >
      {message}
    </div>
  );
}