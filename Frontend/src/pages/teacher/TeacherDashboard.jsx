import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, FileText, Clock3, CheckCircle2, Users, UploadCloud } from "lucide-react";
import api from "../../services/api";
import { fetchTeacherAssignments } from "../../features/assignments/assignmentSlice";

export default function TeacherDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: assignments, loading, error } = useSelector((state) => state.assignments);

  useEffect(() => {
    dispatch(fetchTeacherAssignments());
  }, [dispatch]);

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

  const pending = assignments.filter((item) => item.status !== "evaluated").length;
  const evaluated = assignments.filter((item) => item.status === "evaluated").length;
  const uniqueStudents = new Set(assignments.map((item) => item.student)).size;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="container-page">
        <section className="rounded-2xl bg-gradient-to-r from-slate-950 to-blue-950 p-8 text-white shadow-sm">
          <p className="text-sm text-blue-200">Teacher Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            Every student assignment uploaded through the student portal is listed here.
            The next processing layer will add OCR/HTR, NLP evaluation, marks and similarity analysis.
          </p>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={UploadCloud} label="Total Uploads" value={assignments.length} />
          <StatCard icon={Users} label="Students" value={uniqueStudents} />
          <StatCard icon={Clock3} label="Pending Evaluation" value={pending} />
          <StatCard icon={CheckCircle2} label="Evaluated" value={evaluated} />
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Student Assignments</h2>
              <p className="mt-1 text-sm text-slate-500">Review every PDF uploaded by students.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {assignments.length} files
            </span>
          </div>

          {error && <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading student assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <FileText className="mx-auto text-slate-400" size={34} />
              <p className="mt-3 font-semibold text-slate-700">No student uploads yet</p>
              <p className="mt-1 text-sm text-slate-500">Uploaded assignments will appear here automatically.</p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Assignment</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Report</th>
                    <th className="px-4 py-3">File</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{assignment.studentName || "Student"}</p>
                        <p className="text-xs text-slate-500">{assignment.studentEmail || "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">{assignment.title}</p>
                        <p className="text-xs text-slate-500">{assignment.subject}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                        {formatDate(assignment.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={assignment.status} />
                      </td>
                      <td className="px-4 py-4">
                        {assignment.status === "evaluated" && assignment.report ? (
                          <span className="font-semibold text-slate-800">
                            {assignment.report.obtainedMarks}/{assignment.report.totalMarks}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">AI evaluation pending</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => openPdf(assignment.id)} className="btn-secondary gap-2 px-3 py-2 text-xs">
                          <Eye size={15} /> View PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
          <Icon size={19} />
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    uploaded: ["Uploaded", "bg-amber-50 text-amber-700"],
    processing: ["Processing", "bg-blue-50 text-blue-700"],
    evaluated: ["Evaluated", "bg-green-50 text-green-700"],
    failed: ["Failed", "bg-red-50 text-red-700"]
  };

  const [label, classes] = config[status] || [status, "bg-slate-100 text-slate-600"];

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
