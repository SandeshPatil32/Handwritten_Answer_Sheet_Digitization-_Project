import { useEffect } from "react";

import {
  useDispatch,
  useSelector
} from "react-redux";

import {
  FileText,
  Eye,
  Clock3,
  Users,
  CheckCircle2
} from "lucide-react";

import api from "../../services/api";

import {
  fetchTeacherAssignments
} from "../../features/assignments/assignmentSlice";


export default function TeacherDashboard() {

  const dispatch =
    useDispatch();


  const { user } =
    useSelector(
      (state) => state.auth
    );


  const {
    items: assignments,
    loading,
    error
  } =
    useSelector(
      (state) =>
        state.assignments
    );


  // ======================================
  // LOAD ALL STUDENT ASSIGNMENTS
  // ======================================

  useEffect(() => {

    dispatch(
      fetchTeacherAssignments()
    );

  }, [dispatch]);


  // ======================================
  // VIEW PDF
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

        <section className="rounded-2xl bg-gradient-to-r from-slate-950 to-blue-950 p-8 text-white">

          <p className="text-sm text-blue-200">
            Teacher Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Welcome, {user?.name}
          </h1>

          <p className="mt-2 max-w-3xl text-slate-300">

            View student-submitted assignments
            and review their future AI-assisted
            evaluation reports.

          </p>

        </section>


        {/* =================================
            STATISTICS
        ================================= */}

        <div className="mt-7 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">

              <FileText size={20} />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              Total Assignments
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {assignments.length}
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">

              <Users size={20} />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              Student Submissions
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {assignments.length}
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">

              <Clock3 size={20} />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              Pending Evaluation
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">

              {
                assignments.filter(
                  (item) =>
                    item.status !==
                    "evaluated"
                ).length
              }

            </p>

          </div>

        </div>


        {/* =================================
            ASSIGNMENTS TABLE
        ================================= */}

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">

            <h2 className="text-xl font-bold text-slate-900">
              Student Assignments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              All assignments uploaded by students.
            </p>

          </div>


          {error && (

            <div className="m-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">

              {error}

            </div>

          )}


          {loading ? (

            <div className="p-10 text-center text-sm text-slate-500">

              Loading student assignments...

            </div>

          ) : assignments.length === 0 ? (

            <div className="p-12 text-center">

              <FileText
                className="mx-auto text-slate-300"
                size={45}
              />

              <p className="mt-4 font-semibold text-slate-700">
                No student assignments yet.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Assignment
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Marks
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-200">

                  {assignments.map(
                    (assignment) => (

                      <tr
                        key={assignment.id}
                        className="hover:bg-slate-50"
                      >

                        {/* STUDENT */}

                        <td className="px-6 py-5">

                          <p className="font-semibold text-slate-900">
                            {assignment.studentName ||
                              "Unknown Student"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {assignment.studentEmail ||
                              ""}
                          </p>

                        </td>


                        {/* ASSIGNMENT */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">

                              <FileText
                                size={18}
                              />

                            </div>

                            <div>

                              <p className="font-semibold text-slate-900">
                                {assignment.title}
                              </p>

                              <p className="text-xs text-slate-500">
                                {assignment.fileName}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* SUBJECT */}

                        <td className="px-6 py-5 text-sm text-slate-600">

                          {assignment.subject}

                        </td>


                        {/* STATUS */}

                        <td className="px-6 py-5">

                          {assignment.status ===
                            "evaluated" ? (

                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">

                              <CheckCircle2
                                size={14}
                              />

                              Evaluated

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">

                              <Clock3
                                size={14}
                              />

                              Pending

                            </span>

                          )}

                        </td>


                        {/* MARKS */}

                        <td className="px-6 py-5 text-sm font-semibold text-slate-700">

                          {assignment.report
                            ?.obtainedMarks ??
                            "—"}

                          {assignment.report
                            ?.totalMarks
                            ? ` / ${assignment.report.totalMarks}`
                            : ""}

                        </td>


                        {/* ACTION */}

                        <td className="px-6 py-5">

                          <button
                            onClick={() =>
                              openPdf(
                                assignment.id
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                          >

                            <Eye
                              size={15}
                            />

                            View PDF

                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </main>
  );
}