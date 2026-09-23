import { useSelector } from "react-redux";
import { BookOpen, FileCheck2, UserRound } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useSelector((state) => state.auth);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="container-page">
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-8 text-white">
          <p className="text-sm text-blue-100">Student Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="mt-2 max-w-2xl text-blue-100">
            Your student-side workspace is ready. Examination result and answer-analysis modules can be added here in the next phase.
          </p>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-3">
          <DashboardCard icon={BookOpen} title="Examinations" text="Future examination information will appear here." />
          <DashboardCard icon={FileCheck2} title="Evaluation Results" text="Future reviewed results will appear here." />
          <DashboardCard icon={UserRound} title="Profile" text={`Student ID: ${user?.studentId || "Not provided"}`} />
        </div>
      </div>
    </main>
  );
}

function DashboardCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Icon size={21} /></div>
      <h2 className="mt-5 font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
