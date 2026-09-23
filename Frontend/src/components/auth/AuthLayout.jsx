import { Link } from "react-router-dom";
import { GraduationCap, ShieldCheck } from "lucide-react";

export default function AuthLayout({ title, subtitle, children, role }) {
  const isTeacher = role === "teacher";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="container-page grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <section className="hidden overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <GraduationCap size={26} />
            </div>
            <h2 className="mt-8 text-3xl font-bold">
              {isTeacher ? "Teacher Evaluation Portal" : "Student Examination Portal"}
            </h2>
            <p className="mt-4 leading-7 text-blue-100">
              {isTeacher
                ? "Manage examinations, upload answer sheets, review extracted answers, and verify AI-assisted evaluation results."
                : "Access your examination information and future evaluation results through a secure student account."}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} />
              <div>
                <p className="font-semibold">Secure role-based access</p>
                <p className="text-sm text-blue-100">Your account is linked to its assigned portal.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mx-auto max-w-md">
            <Link to="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              ← Back to home
            </Link>
            <h1 className="mt-7 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
