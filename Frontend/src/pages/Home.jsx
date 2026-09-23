import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit, FileText, ScanText, ShieldCheck, Sparkles, Users } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Answer Sheet Management",
    text: "Teachers will be able to upload and organize question papers, answer keys, and scanned handwritten answer sheets."
  },
  {
    icon: ScanText,
    title: "OCR / HTR Digitization",
    text: "The next phase will convert handwritten content from uploaded documents into machine-readable text."
  },
  {
    icon: BrainCircuit,
    title: "NLP Evaluation Support",
    text: "Semantic analysis will compare student responses with reference answers and provide suggested evaluation support."
  },
  {
    icon: Users,
    title: "Similarity Detection",
    text: "Student answers can be compared to identify highly similar responses that require teacher verification."
  },
  {
    icon: ShieldCheck,
    title: "Teacher Verification",
    text: "AI-generated results remain reviewable by the teacher before final evaluation decisions are made."
  },
  {
    icon: Sparkles,
    title: "Reports & Analytics",
    text: "Future modules can present answer-wise marks, similarity scores, flagged cases, and examination reports."
  }
];

export default function Home() {
  return (
    <main>
      <section className="overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="container-page grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <Sparkles size={14} /> AI-assisted examination support
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Digitize handwritten answers.
              <span className="text-blue-600"> Evaluate smarter.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A web-based examination-support system designed to digitize handwritten answer sheets,
              assist answer evaluation, and identify potentially similar student responses.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/teacher/login" className="btn-primary gap-2">
                Teacher Portal <ArrowRight size={18} />
              </Link>
              <Link to="/student/login" className="btn-secondary">
                Student Portal
              </Link>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              AI outputs are intended to support teacher review, not replace final human judgement.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-blue-100/60 blur-3xl" />
            <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="rounded-2xl bg-slate-950 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Teacher Dashboard</p>
                    <h3 className="mt-1 text-xl font-bold">Evaluation Overview</h3>
                  </div>
                  <div className="rounded-lg bg-blue-500/20 px-3 py-2 text-xs text-blue-200">Demo UI</div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-2xl font-bold">24</p>
                    <p className="mt-1 text-xs text-slate-400">Sheets</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-2xl font-bold">18</p>
                    <p className="mt-1 text-xs text-slate-400">Processed</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-2xl font-bold">06</p>
                    <p className="mt-1 text-xs text-slate-400">Review</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {["OCR extraction", "Semantic evaluation", "Similarity analysis"].map((item, index) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item}</span>
                        <span className="text-blue-300">{index === 0 ? "Ready" : "Planned"}</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${index === 0 ? 78 : 35}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Core modules</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Built around the SRS workflow</h2>
            <p className="mt-4 leading-7 text-slate-600">
              The interface is structured so the authentication layer can grow into the examination,
              OCR/HTR, NLP, similarity analysis, and teacher-verification modules later.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Icon size={21} />
                </div>
                <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-slate-50 py-20">
        <div className="container-page">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Planned workflow</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">From upload to teacher verification</h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-5">
            {[
              ["01", "Upload", "Question paper, answer key and answer sheets"],
              ["02", "Extract", "OCR / HTR converts handwriting to text"],
              ["03", "Analyze", "NLP processes and compares answers"],
              ["04", "Flag", "Similarity results identify cases for review"],
              ["05", "Verify", "Teacher reviews and finalizes results"]
            ].map(([number, title, text]) => (
              <div key={number} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold text-blue-600">{number}</p>
                <h3 className="mt-2 font-bold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
