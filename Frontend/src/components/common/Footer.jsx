import { GraduationCap, Code2, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3">

        {/* Project Information */}
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <GraduationCap size={20} />
            </span>

            <span className="font-bold">
              AnswerCheck AI
            </span>
          </div>

          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
            An examination-support platform for handwritten answer-sheet
            digitization, evaluation assistance, and similarity analysis.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h3 className="font-semibold text-white">
            Platform
          </h3>

          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>Student Portal</p>
            <p>Teacher Portal</p>
            <p>Answer Evaluation</p>
            <p>Similarity Analysis</p>
          </div>
        </div>

        {/* Project */}
        <div>
          <h3 className="font-semibold text-white">
            Project
          </h3>

          <div className="mt-4 space-y-3 text-sm text-slate-400">

            <p className="flex items-center gap-2">
              <Mail size={15} />
              Examination Support System
            </p>

            <p className="flex items-center gap-2">
              <Code2 size={15} />
              MERN + AI Architecture
            </p>

          </div>
        </div>

      </div>

      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <p>
            © {new Date().getFullYear()} AnswerCheck AI.
            Academic project.
          </p>

          <p>
            AI results are assistance for teacher verification,
            not final decisions.
          </p>

        </div>
      </div>
    </footer>
  );
}