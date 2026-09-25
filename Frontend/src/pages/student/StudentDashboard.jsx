import {
  useEffect,
  useState
} from "react";

import {
  useDispatch,
  useSelector
} from "react-redux";

import {
  FileText,
  UploadCloud,
  Eye,
  Clock3,
  CheckCircle2
} from "lucide-react";

import api from "../../services/api";

import {
  fetchMyAssignments,
  uploadAssignment,
  clearAssignmentError
} from "../../features/assignments/assignmentSlice";


const MAX_FILE_SIZE =
  10 * 1024 * 1024;


export default function StudentDashboard() {

  const dispatch =
    useDispatch();


  const { user } =
    useSelector(
      (state) => state.auth
    );


  const {
    items: assignments,
    loading,
    uploadLoading,
    error,
    uploadError
  } =
    useSelector(
      (state) =>
        state.assignments
    );


  const [form, setForm] =
    useState({
      title: "",
      subject: "",
      description: ""
    });


  const [file, setFile] =
    useState(null);


  const [success, setSuccess] =
    useState("");


  // ======================================
  // LOAD ASSIGNMENTS
  // ======================================

  useEffect(() => {

    dispatch(
      fetchMyAssignments()
    );

    dispatch(
      clearAssignmentError()
    );

  }, [dispatch]);


  // ======================================
  // FILE SELECT
  // ======================================

  const handleFileChange =
    (event) => {

      const selectedFile =
        event.target.files?.[0];


      if (!selectedFile) {
        setFile(null);
        return;
      }


      if (
        selectedFile.type !==
        "application/pdf"
      ) {

        alert(
          "Only PDF files are allowed."
        );

        event.target.value = "";

        setFile(null);

        return;
      }


      if (
        selectedFile.size >
        MAX_FILE_SIZE
      ) {

        alert(
          "PDF must be smaller than 10 MB."
        );

        event.target.value = "";

        setFile(null);

        return;
      }


      setFile(selectedFile);
    };


  // ======================================
  // UPLOAD
  // ======================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setSuccess("");


      if (!file) {

        alert(
          "Please select a PDF."
        );

        return;
      }


      const formData =
        new FormData();


      formData.append(
        "title",
        form.title
      );


      formData.append(
        "subject",
        form.subject
      );


      formData.append(
        "description",
        form.description
      );


      formData.append(
        "assignmentPdf",
        file
      );


      const result =
        await dispatch(
          uploadAssignment(
            formData
          )
        );


      if (
        uploadAssignment.fulfilled
          .match(result)
      ) {

        setForm({
          title: "",
          subject: "",
          description: ""
        });


        setFile(null);


        const input =
          document.getElementById(
            "assignmentPdf"
          );


        if (input) {
          input.value = "";
        }


        setSuccess(
          "Assignment uploaded successfully. Evaluation is pending."
        );
      }
    };


  // ======================================
  // OPEN PDF
  // ======================================

  const openPdf =
    async (assignmentId) => {

      try {

        const response =
          await api.get(
            `/assignments/${assignmentId}/file`,
            {
              responseType: "blob"
            }
          );


        const url =
          URL.createObjectURL(
            response.data
          );


        window.open(
          url,
          "_blank"
        );


        setTimeout(
          () =>
            URL.revokeObjectURL(
              url
            ),
          60000
        );

      } catch (error) {

        alert(
          error.response?.data
            ?.message ||
          "Unable to open PDF."
        );
      }
    };


  return (

    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">

      <div className="container-page">

        {/* =================================
            HEADER
        ================================= */}

        <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-8 text-white shadow-sm">

          <p className="text-sm text-blue-100">
            Student Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Welcome, {user?.name}
          </h1>

          <p className="mt-2 max-w-3xl text-blue-100">
            Upload your answered assignment
            PDF. Your submissions and future
            evaluation reports will remain
            available here.
          </p>

        </section>


        <section className="mt-7 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">


          {/* =================================
              UPLOAD
          ================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">

                <UploadCloud
                  size={22}
                />

              </div>

              <div>

                <h2 className="font-bold text-slate-900">
                  Upload Assignment
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

              {uploadError && (

                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">

                  {uploadError}

                </div>

              )}


              {success && (

                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">

                  {success}

                </div>

              )}


              {/* TITLE */}

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
                      title: e.target.value
                    })
                  }
                  placeholder="e.g. NLP Unit 2 Assignment"
                />

              </div>


              {/* SUBJECT */}

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
                      subject: e.target.value
                    })
                  }
                  placeholder="e.g. Artificial Intelligence"
                />

              </div>


              {/* DESCRIPTION */}

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
                      description:
                        e.target.value
                    })
                  }
                  placeholder="Optional assignment details"
                />

              </div>


              {/* PDF */}

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
                  onChange={
                    handleFileChange
                  }
                />

              </div>


              {/* SUBMIT */}

              <button
                disabled={
                  uploadLoading
                }
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >

                {uploadLoading
                  ? "Uploading..."
                  : "Upload Assignment"}

              </button>

            </form>

          </div>


          {/* =================================
              ASSIGNMENT HISTORY
          ================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  My Assignments
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your uploaded assignments and reports.
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

              <div className="py-12 text-center">

                <FileText
                  className="mx-auto text-slate-300"
                  size={42}
                />

                <p className="mt-4 font-semibold text-slate-700">
                  No assignments uploaded yet.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Upload your first answered PDF.
                </p>

              </div>

            ) : (

              <div className="mt-6 space-y-4">

                {assignments.map(
                  (assignment) => (

                    <div
                      key={assignment.id}
                      className="rounded-xl border border-slate-200 p-5"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">

                            <FileText
                              size={19}
                            />

                          </div>

                          <div>

                            <h3 className="font-semibold text-slate-900">
                              {assignment.title}
                            </h3>

                            <p className="text-sm text-slate-500">
                              {assignment.subject}
                            </p>

                          </div>

                        </div>


                        <button
                          onClick={() =>
                            openPdf(
                              assignment.id
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >

                          <Eye
                            size={15}
                          />

                          View

                        </button>

                      </div>


                      <div className="mt-4 grid gap-3 sm:grid-cols-3">

                        <div>

                          <p className="text-xs text-slate-400">
                            Status
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-sm font-semibold">

                            {assignment.status ===
                              "evaluated" ? (

                              <>
                                <CheckCircle2
                                  size={15}
                                  className="text-green-600"
                                />

                                Evaluated
                              </>

                            ) : (

                              <>
                                <Clock3
                                  size={15}
                                  className="text-amber-500"
                                />

                                Evaluation Pending
                              </>

                            )}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs text-slate-400">
                            Marks
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">

                            {assignment.report
                              ?.obtainedMarks ??
                              "—"}

                            {assignment.report
                              ?.totalMarks
                              ? ` / ${assignment.report.totalMarks}`
                              : ""}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs text-slate-400">
                            Uploaded
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">

                            {new Date(
                              assignment.createdAt
                            ).toLocaleDateString()}

                          </p>

                        </div>

                      </div>


                      {assignment.report
                        ?.summary && (

                          <div className="mt-4 rounded-lg bg-slate-50 p-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Evaluation Report
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {
                                assignment.report
                                  .summary
                              }
                            </p>

                          </div>

                        )}

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </section>

      </div>

    </main>
  );
}