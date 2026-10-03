import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  Download,
  Eye,
  FileBarChart2,
  FileText,
  RefreshCw,
  Search,
  Users,
  UploadCloud,
  CheckCircle2,
  Clock3
} from "lucide-react";
import api from "../../services/api";
import {
  fetchSimilarityResults,
  fetchTeacherAssignments
} from "../../features/assignments/assignmentSlice";

export default function TeacherDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    items: assignments = [],
    loading,
    error,
    similarityResults = [],
    similarityLoading,
    similarityError
  } = useSelector((state) => state.assignments);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [similarityFilter, setSimilarityFilter] = useState("all");
  const [expandedPair, setExpandedPair] = useState(null);
  const [downloading, setDownloading] = useState("");

  const loadDashboard = () => {
    dispatch(fetchTeacherAssignments());
    dispatch(fetchSimilarityResults());
  };

  useEffect(() => {
    loadDashboard();
  }, [dispatch]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      if (!query) {
        return statusFilter === "all" || assignment.status === statusFilter;
      }

      const studentName = String(assignment.studentName || "").toLowerCase();
      const studentId = String(assignment.studentId || "").toLowerCase();
      const title = String(assignment.title || "").toLowerCase();
      const subject = String(assignment.subject || "").toLowerCase();
      const email = String(assignment.studentEmail || "").toLowerCase();
      const emailLocalPart = email.split("@")[0];

      const searchFields = [studentName, studentId, title, subject, emailLocalPart];
      if (query.includes("@")) searchFields.push(email);

      const matchesSearch = searchFields.some((value) => value.includes(query));

      const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  const filteredSimilarity = useMemo(() => {
    if (similarityFilter === "all") return similarityResults;
    if (similarityFilter === "high") return similarityResults.filter((item) => item.score >= 80);
    if (similarityFilter === "moderate") return similarityResults.filter((item) => item.score >= 60 && item.score < 80);
    return similarityResults.filter((item) => item.score < 60);
  }, [similarityResults, similarityFilter]);

  const pending = assignments.filter((item) => !["evaluated", "scanned"].includes(item.status)).length;
  const evaluated = assignments.filter((item) => item.status === "evaluated").length;
  const scanned = assignments.filter((item) => item.status === "scanned").length;
  const uniqueStudents = new Set(assignments.map((item) => item.student?.toString())).size;
  const highSimilarity = similarityResults.filter((item) => item.score >= 80).length;

  const downloadBlob = async (url, filename) => {
    try {
      setDownloading(url);
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
      setDownloading("");
    }
  };

  const openPdf = async (assignmentId) => {
    const newTab = window.open("about:blank", "_blank");

    try {
      const response = await api.get(`/assignments/${assignmentId}/file`, { responseType: "blob" });
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
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-200">Teacher Workspace</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome, {user?.name || "Teacher"}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Review student submissions, inspect AI-assisted reports, compare extracted answers between students, and download analysis reports.
              </p>
            </div>
            <button onClick={loadDashboard} className="btn-dark gap-2">
              <RefreshCw size={16} /> Refresh data
            </button>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={UploadCloud} label="Total Uploads" value={assignments.length} />
          <StatCard icon={Users} label="Students" value={uniqueStudents} />
          <StatCard icon={Clock3} label="Pending" value={pending} />
          <StatCard icon={CheckCircle2} label="Evaluated" value={evaluated} />
          <StatCard icon={AlertTriangle} label="High Similarity" value={highSimilarity} tone="warning" />
        </section>

        <section className="dashboard-card mt-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="section-title text-xl">Student Assignments</h2>
              <p className="section-subtitle">Search, filter, open files and download individual reports.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => downloadBlob("/assignments/teacher/similarity/report", "student_similarity_report.csv")}
                className="btn-secondary gap-2 text-xs"
                disabled={Boolean(downloading)}
              >
                <FileBarChart2 size={15} /> Download Similarity CSV
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                className="input-field pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, email, ID, subject or assignment..."
              />
            </div>
            <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="scanned">Scanned</option>
              <option value="evaluated">Evaluated</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {error && <Alert message={error} />}

          {loading ? (
            <LoadingState />
          ) : filteredAssignments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[1050px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Assignment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Marks</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{assignment.studentName || "Student"}</p>
                        <p className="text-xs text-slate-500">{assignment.studentId || assignment.studentEmail || "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">{assignment.title}</p>
                        <p className="text-xs text-slate-500">{assignment.subject}</p>
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={assignment.status} /></td>
                      <td className="px-4 py-4">
                        {assignment.report?.obtainedMarks != null ? (
                          <span className="font-semibold text-slate-800">{assignment.report.obtainedMarks}/{assignment.report.totalMarks}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatDate(assignment.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openPdf(assignment.id)} className="btn-secondary gap-2 px-3 py-2 text-xs"><Eye size={14} /> View</button>
                          <button onClick={() => downloadBlob(`/assignments/${assignment.id}/file?download=1`, `${safeFileName(assignment.fileName)}`)} className="btn-secondary gap-2 px-3 py-2 text-xs"><Download size={14} /> PDF</button>
                          <button onClick={() => downloadBlob(`/assignments/${assignment.id}/report?format=csv`, `${safeFileName(assignment.title)}_report.csv`)} className="btn-secondary gap-2 px-3 py-2 text-xs"><FileBarChart2 size={14} /> Report</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="dashboard-card mt-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-600" size={20} />
                <h2 className="section-title text-xl">Student-to-Student Similarity</h2>
              </div>
              <p className="section-subtitle mt-1 max-w-3xl">
                Answers are compared within the same subject using extracted text. A high score is an analytical indicator for teacher review, not proof of copying.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="input-field w-auto min-w-44" value={similarityFilter} onChange={(e) => setSimilarityFilter(e.target.value)}>
                <option value="all">All similarity</option>
                <option value="high">High (80%+)</option>
                <option value="moderate">Moderate (60–79%)</option>
                <option value="low">Low (&lt;60%)</option>
              </select>
              <button onClick={() => dispatch(fetchSimilarityResults())} className="btn-secondary gap-2 text-xs">
                <RefreshCw size={15} /> Recalculate
              </button>
            </div>
          </div>

          {similarityError && <Alert message={similarityError} />}

          {similarityLoading ? (
            <LoadingState text="Calculating student-to-student similarity..." />
          ) : filteredSimilarity.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <Users className="mx-auto text-slate-400" size={34} />
              <p className="mt-3 font-semibold text-slate-700">No comparable student pairs yet</p>
              <p className="mt-1 text-sm text-slate-500">At least two students in the same subject need successfully scanned answer text.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filteredSimilarity.map((pair, index) => {
                const key = `${pair.assignmentA?.id || pair.assignmentA}-${pair.assignmentB?.id || pair.assignmentB}`;
                const expanded = expandedPair === key;
                return (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="grid flex-1 gap-3 sm:grid-cols-3">
                        <StudentPair name={pair.studentA?.name} email={pair.studentA?.email} label="Student A" />
                        <StudentPair name={pair.studentB?.name} email={pair.studentB?.email} label="Student B" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</p>
                          <p className="mt-1 font-semibold text-slate-800">{pair.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Similarity</p>
                          <p className={`text-2xl font-bold ${pair.score >= 80 ? "text-red-600" : pair.score >= 60 ? "text-amber-600" : "text-green-600"}`}>{pair.score}%</p>
                        </div>
                        <StatusBadge status={pair.score >= 80 ? "similar-high" : pair.score >= 60 ? "similar-medium" : "similar-low"} />
                        <button onClick={() => setExpandedPair(expanded ? null : key)} className="btn-secondary px-3 py-2 text-xs">
                          {expanded ? "Hide" : "Details"}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Analysis</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {pair.status}. The score is based on lexical cosine similarity and token-set overlap of the extracted answers.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-white px-3 py-1">A tokens: {pair.tokenCountA}</span>
                            <span className="rounded-full bg-white px-3 py-1">B tokens: {pair.tokenCountB}</span>
                          </div>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Matching phrases</p>
                          {pair.commonPhrases?.length ? (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                              {pair.commonPhrases.map((phrase, phraseIndex) => <li key={phraseIndex}>{phrase}</li>)}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-amber-900">No long matching phrases detected.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <InfoCard title="Scanned" value={scanned} text="Submissions with extracted handwriting text." />
          <InfoCard title="Similarity Pairs" value={similarityResults.length} text="Comparable student pairs in the same subject." />
          <InfoCard title="Review Queue" value={highSimilarity} text="Pairs with 80% or higher similarity indicator." />
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, tone = "default" }) {
  return (
    <div className="dashboard-card p-5">
      <div className="flex items-center justify-between">
        <div className={`icon-box ${tone === "warning" ? "bg-amber-100 text-amber-700" : ""}`}><Icon size={19} /></div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function StudentPair({ name, email, label }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{name || "Student"}</p>
      <p className="truncate text-xs text-slate-500">{email || "—"}</p>
    </div>
  );
}

function InfoCard({ title, value, text }) {
  return (
    <div className="dashboard-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    uploaded: ["Uploaded", "bg-amber-50 text-amber-700"],
    processing: ["Processing", "bg-blue-50 text-blue-700"],
    scanned: ["Scanned", "bg-indigo-50 text-indigo-700"],
    evaluated: ["Evaluated", "bg-green-50 text-green-700"],
    failed: ["Failed", "bg-red-50 text-red-700"],
    "similar-high": ["Review", "bg-red-50 text-red-700"],
    "similar-medium": ["Review", "bg-amber-50 text-amber-700"],
    "similar-low": ["Normal", "bg-green-50 text-green-700"]
  };

  const [label, classes] = config[status] || [status || "Unknown", "bg-slate-100 text-slate-600"];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function Alert({ message }) {
  return <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

function LoadingState({ text = "Loading student assignments..." }) {
  return <div className="py-14 text-center text-sm text-slate-500">{text}</div>;
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
      <FileText className="mx-auto text-slate-400" size={34} />
      <p className="mt-3 font-semibold text-slate-700">No matching assignments</p>
      <p className="mt-1 text-sm text-slate-500">Try changing the search or status filter.</p>
    </div>
  );
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
