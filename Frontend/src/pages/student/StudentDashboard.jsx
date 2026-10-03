import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileBarChart2,
  FileText,
  ScanText,
  UploadCloud
} from "lucide-react";
import api from "../../services/api";
import {
  clearAssignmentError,
  fetchMyAssignments,
  scanAssignment,
  uploadAssignment,
  fetchStudentAnalytics
} from "../../features/assignments/assignmentSlice";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
    analytics,
    analyticsLoading,
    analyticsError
  } = useSelector((state) => state.assignments);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: ""
  });
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState("");
  const [validationError, setValidationError] = useState("");
  const [scanningId, setScanningId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyAssignments());
    dispatch(fetchStudentAnalytics());
    dispatch(clearAssignmentError());
  }, [dispatch]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");
    setValidationError("");

    if (!form.title.trim() || !form.subject.trim()) {
      setValidationError("Assignment title and subject are required.");
      return;
    }

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

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("subject", form.subject.trim());
    formData.append("description", form.description.trim());
    formData.append("assignmentPdf", file);

    const uploadResult = await dispatch(uploadAssignment(formData));

    if (!uploadAssignment.fulfilled.match(uploadResult)) return;

    const assignmentId =
      uploadResult.payload?.id || uploadResult.payload?.assignment?.id;

    if (!assignmentId) {
      setValidationError("Upload succeeded, but the assignment ID was not returned.");
      return;
    }

    setForm({ title: "", subject: "", description: "" });
    setFile(null);
    const input = document.getElementById("assignmentPdf");
    if (input) input.value = "";

    setScanningId(assignmentId);
    setSuccess("PDF uploaded. AI processing has started...");

    const scanResult = await dispatch(scanAssignment(assignmentId));
    setScanningId(null);

    if (scanAssignment.fulfilled.match(scanResult)) {
      setSuccess("PDF scanned successfully. Your report is ready when evaluation data is available.");
      dispatch(fetchMyAssignments());
    }
  };

  const downloadBlob = async (url, filename) => {
    try {
      setDownloadingId(url);
      const response = await api.get(url, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to download the file.");
    } finally {
      setDownloadingId(null);
    }
  };

  const openPdf = async (assignmentId) => {
    const newTab = window.open("about:blank", "_blank");

    try {
      const response = await api.get(`/assignments/${assignmentId}/file`, {
        responseType: "blob"
      });
      const url = URL.createObjectURL(response.data);
      if (newTab) newTab.location.href = url;
      else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (newTab) newTab.close();
      alert(err.response?.data?.message || "Unable to open the PDF.");
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 sm:py-10">
      <div className="container-page">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Student Workspace</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome, {user?.name || "Student"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">
                Upload an answered PDF, track handwriting processing, view evaluation results, and download your submission/report.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-blue-100">Assignments</p>
              <p className="mt-1 text-3xl font-bold">{assignments.length}</p>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[390px_1fr]">
          <div className="dashboard-card h-fit">
            <div className="flex items-center gap-3">
              <div className="icon-box"><UploadCloud size={22} /></div>
              <div>
                <h2 className="section-title">Upload & Scan</h2>
                <p className="section-subtitle">PDF only · maximum 10 MB</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {validationError && <Alert message={validationError} />}
              {uploadError && <Alert message={uploadError} />}
              {scanError && <Alert message={scanError} />}
              {success && <Alert message={success} type="success" />}

              <Field label="Assignment Title">
                <input
                  className="input-field"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. NLP Unit 2 Assignment"
                />
              </Field>

              <Field label="Subject">
                <input
                  className="input-field"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Artificial Intelligence"
                />
              </Field>

              <Field label="Description">
                <textarea
                  className="input-field min-h-24 resize-y"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional assignment details"
                />
              </Field>

              <Field label="Answered Assignment PDF">
                <input
                  id="assignmentPdf"
                  className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:font-semibold file:text-white"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file && (
                  <p className="mt-2 text-xs text-slate-500">
                    Selected: {file.name} · {formatBytes(file.size)}
                  </p>
                )}
              </Field>

              <button
                type="submit"
                disabled={uploadLoading || scanLoading || scanningId !== null}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadLoading
                  ? "Uploading..."
                  : scanLoading || scanningId !== null
                    ? "Processing with AI..."
                    : "Upload & Scan PDF"}
              </button>
            </form>
          </div>

          <div className="dashboard-card">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="section-title text-xl">My Assignments</h2>
                <p className="section-subtitle">Your submissions, extracted answers and evaluation reports.</p>
              </div>
              <span className="badge-blue">{assignments.length} uploaded</span>
            </div>

            {error && <Alert message={error} />}

            {loading ? (
              <LoadingState text="Loading assignments..." />
            ) : assignments.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="mt-6 space-y-4">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onOpen={openPdf}
                    onDownload={downloadBlob}
                    downloadingId={downloadingId}
                    isScanning={scanningId === assignment.id}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <StudentPerformanceAnalytics
          analytics={analytics}
          loading={analyticsLoading}
          error={analyticsError}
        />
      </div>
    </main>
  );
}


function StudentPerformanceAnalytics({ analytics, loading, error }) {
  if (loading) {
    return (
      <section className="dashboard-card mt-7">
        <h2 className="section-title text-xl">Student Performance Analytics</h2>
        <p className="mt-3 text-sm text-slate-500">Calculating your performance...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-card mt-7">
        <h2 className="section-title text-xl">Student Performance Analytics</h2>
        <p className="mt-3 text-sm text-red-600">{error}</p>
      </section>
    );
  }

  const data = analytics || {};
  const subjects = data.subjectPerformance || [];
  const questions = data.questionPerformance || [];
  const concepts = data.missedConcepts || [];
  const trend = data.improvementOverTime || [];
  const maxSubject = Math.max(...subjects.map((item) => item.averagePercentage || 0), 1);
  const maxConcept = Math.max(...concepts.map((item) => item.count || 0), 1);

  return (
    <section className="dashboard-card mt-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title text-xl">Student Performance Analytics</h2>
          <p className="section-subtitle">Track marks, subject performance, missed concepts, question performance and improvement over time.</p>
        </div>
        <span className="badge-blue">{data.totalEvaluated || 0} evaluated</span>
      </div>

      {!data.totalEvaluated ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="font-semibold text-slate-700">Analytics will appear after evaluation.</p>
          <p className="mt-1 text-sm text-slate-500">Upload and successfully evaluate an answer sheet to start building your performance history.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AnalyticsStat label="Average Marks" value={`${data.averageMarks ?? 0}/25`} />
            <AnalyticsStat label="Average Percentage" value={`${data.averagePercentage ?? 0}%`} />
            <AnalyticsStat label="Evaluated Assignments" value={data.totalEvaluated || 0} />
            <AnalyticsStat label="Missed Concepts" value={concepts.length} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <AnalyticsPanel title="Subject-wise Performance">
              {subjects.length ? subjects.map((item) => (
                <div key={item.subject} className="mb-4 last:mb-0">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{item.subject}</span>
                    <span className="font-semibold text-slate-900">{item.averagePercentage}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, (item.averagePercentage / maxSubject) * 100)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{item.attempts} attempt(s) · {item.averageMarks}/25 average</p>
                </div>
              )) : <AnalyticsEmpty text="No subject data yet." />}
            </AnalyticsPanel>

            <AnalyticsPanel title="Frequently Missed Concepts">
              {concepts.length ? concepts.map((item) => (
                <div key={item.concept} className="mb-4 last:mb-0">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{item.concept}</span>
                    <span className="font-semibold text-slate-900">{item.count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (item.count / maxConcept) * 100)}%` }} />
                  </div>
                </div>
              )) : <AnalyticsEmpty text="No repeated missed concepts detected yet." />}
            </AnalyticsPanel>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <AnalyticsPanel title="Question-wise Performance">
              {questions.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="text-slate-500">
                      <tr>
                        <th className="pb-2 pr-4">Question</th>
                        <th className="pb-2 pr-4">Avg Marks</th>
                        <th className="pb-2 pr-4">Correctness</th>
                        <th className="pb-2">Completeness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((item) => (
                        <tr key={item.questionNumber} className="border-t border-slate-100">
                          <td className="py-2 pr-4 font-semibold">Q{item.questionNumber}</td>
                          <td className="py-2 pr-4">{item.averageMarks}</td>
                          <td className="py-2 pr-4">{item.averageCorrectness}%</td>
                          <td className="py-2">{item.averageCompleteness}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <AnalyticsEmpty text="Question-level analytics are not available yet." />}
            </AnalyticsPanel>

            <AnalyticsPanel title="Improvement Over Time">
              {trend.length ? (
                <div className="space-y-3">
                  {trend.map((item, index) => (
                    <div key={`${item.date}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.subject} · {formatDate(item.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{item.percentage}%</p>
                          <p className="text-[11px] text-slate-400">{item.marks}/25</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <AnalyticsEmpty text="Complete more evaluated assignments to see improvement." />}
            </AnalyticsPanel>
          </div>
        </>
      )}
    </section>
  );
}

function AnalyticsStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function AnalyticsPanel({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function AnalyticsEmpty({ text }) {
  return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{text}</p>;
}

function AssignmentCard({ assignment, onOpen, onDownload, downloadingId, isScanning }) {
  const reportReady = assignment.status === "evaluated" && assignment.report?.obtainedMarks != null;
  const pages = assignment.scanResult?.pages || [];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="icon-box bg-slate-100 text-slate-600"><FileText size={19} /></div>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-slate-900">{assignment.title || "Untitled Assignment"}</h3>
            <p className="mt-1 text-xs text-slate-500">{assignment.subject || "No subject"} · {formatDate(assignment.createdAt)}</p>
            <p className="mt-1 truncate text-xs text-slate-400">{assignment.fileName} · {formatBytes(assignment.fileSize)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => onOpen(assignment.id)} className="btn-secondary gap-2 px-3 py-2 text-xs">
            <Eye size={15} /> View PDF
          </button>
          <button
            onClick={() => onDownload(`/assignments/${assignment.id}/file?download=1`, `${safeFileName(assignment.fileName)}.pdf`)}
            className="btn-secondary gap-2 px-3 py-2 text-xs"
            disabled={downloadingId?.includes(`/assignments/${assignment.id}/file`)}
          >
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        {isScanning || assignment.status === "processing" ? (
          <ProcessState />
        ) : reportReady ? (
          <EvaluationReport assignment={assignment} onDownload={onDownload} downloadingId={downloadingId} />
        ) : assignment.status === "scanned" && pages.length > 0 ? (
          <ScanResult pages={pages} />
        ) : assignment.status === "failed" ? (
          <FailedState />
        ) : (
          <PendingState />
        )}
      </div>
    </article>
  );
}

function EvaluationReport({ assignment, onDownload, downloadingId }) {
  const report = assignment.report || {};
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Evaluation Report</p>
          <p className="mt-1 text-sm text-slate-600">AI-assisted result. Teacher verification remains important.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onDownload(`/assignments/${assignment.id}/report?format=csv`, `${safeFileName(assignment.title)}_report.csv`)}
            className="btn-secondary gap-2 px-3 py-2 text-xs"
            disabled={downloadingId?.includes(`/assignments/${assignment.id}/report`)}
          >
            <FileBarChart2 size={15} /> CSV Report
          </button>
          <button
            onClick={() => onDownload(`/assignments/${assignment.id}/report?format=json`, `${safeFileName(assignment.title)}_report.json`)}
            className="btn-secondary gap-2 px-3 py-2 text-xs"
            disabled={downloadingId?.includes(`/assignments/${assignment.id}/report`)}
          >
            <Download size={15} /> JSON Report
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ReportValue label="Marks" value={`${report.obtainedMarks}/${report.totalMarks}`} />
        <ReportValue label="Percentage" value={`${report.percentage ?? 0}%`} />
        <ReportValue label="Answer Quality" value={report.answerQuality || "—"} />
      </div>

      {report.summary && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          {report.summary}
        </div>
      )}

      {report.questionResults?.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3">Question</th>
                <th className="px-3 py-3">Marks</th>
                <th className="px-3 py-3">Correctness</th>
                <th className="px-3 py-3">Completeness</th>
                <th className="px-3 py-3">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {report.questionResults.map((question, index) => (
                <tr key={`${question.questionNumber}-${index}`} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-semibold">Q{question.questionNumber || index + 1}</td>
                  <td className="px-3 py-3">{question.obtainedMarks}/{question.maximumMarks}</td>
                  <td className="px-3 py-3">{Math.round(question.correctness || 0)}%</td>
                  <td className="px-3 py-3">{Math.round(question.completeness || 0)}%</td>
                  <td className="px-3 py-3">{question.verdict || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScanResult({ pages }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="text-green-600" size={18} />
        <p className="text-sm font-semibold text-slate-800">Handwriting scan completed</p>
        <span className="ml-auto text-xs font-semibold text-slate-500">{pages.length} page(s)</span>
      </div>
      <div className="mt-4 space-y-3">
        {pages.map((page, index) => (
          <div key={`${page.pageNumber}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Page {page.pageNumber || index + 1}</span>
              <span>Confidence: {formatConfidence(page.confidence)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{page.text || "No readable text returned."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessState() {
  return (
    <div className="flex gap-3">
      <ScanText className="mt-0.5 shrink-0 animate-pulse text-blue-600" size={19} />
      <div>
        <p className="text-sm font-semibold text-slate-800">AI processing in progress</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">PDF pages are being converted, preprocessed and sent to the handwriting-recognition service.</p>
      </div>
    </div>
  );
}

function FailedState() {
  return (
    <div className="flex gap-3">
      <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={19} />
      <div>
        <p className="text-sm font-semibold text-slate-800">AI processing failed</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">The uploaded PDF remains stored. Check the backend and AI-service logs for the exact cause.</p>
      </div>
    </div>
  );
}

function PendingState() {
  return (
    <div className="flex gap-3">
      <Clock3 className="mt-0.5 shrink-0 text-amber-600" size={19} />
      <div>
        <p className="text-sm font-semibold text-slate-800">Waiting for processing</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">The PDF is stored and will show OCR/evaluation results after processing completes.</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Alert({ message, type = "error" }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
      {message}
    </div>
  );
}

function ReportValue({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
      <FileText className="mx-auto text-slate-400" size={36} />
      <p className="mt-3 font-semibold text-slate-700">No assignments yet</p>
      <p className="mt-1 text-sm text-slate-500">Upload your first answered assignment using the form.</p>
    </div>
  );
}

function LoadingState({ text }) {
  return <div className="py-14 text-center text-sm text-slate-500">{text}</div>;
}

function formatBytes(bytes) {
  if (!bytes || Number(bytes) <= 0) return "0 KB";
  const value = Number(bytes);
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatConfidence(value) {
  if (typeof value !== "number") return "—";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function formatDate(date) {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function safeFileName(value) {
  return String(value || "assignment").replace(/[^a-zA-Z0-9._-]/g, "_");
}
