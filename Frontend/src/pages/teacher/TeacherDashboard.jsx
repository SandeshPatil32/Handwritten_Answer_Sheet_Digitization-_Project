import { useSelector } from "react-redux";
import { FileUp, KeyRound, ScanText, ShieldCheck, Users } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useSelector((state) => state.auth);

  const modules = [
    { icon: FileUp, title: "Question Papers", text: "Upload and manage examination question papers." },
    { icon: KeyRound, title: "Answer Keys", text: "Manage reference answers and evaluation criteria." },
    { icon: FileUp, title: "Answer Sheets", text: "Upload scanned/image-based handwritten answer sheets." },
    { icon: ScanText, title: "OCR / HTR Processing", text: "Next phase: extract handwritten content into digital text." },
    { icon: Users, title: "Similarity Analysis", text: "Next phase: compare student answers and flag high similarity." },
    { icon: ShieldCheck, title: "Teacher Verification", text: "Review AI suggestions before finalizing evaluation." }
  ];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="container-page">
        <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-blue-950 p-8 text-white">
          <p className="text-sm text-blue-200">Teacher Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            This is the foundation for the teacher workflow described in the SRS:
            examination management, answer-sheet upload, OCR/HTR processing,
            NLP evaluation, similarity analysis, and teacher verification.
          </p>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Icon size={21} />
              </div>
              <h2 className="mt-5 font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              <button className="mt-5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
                Coming next
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
