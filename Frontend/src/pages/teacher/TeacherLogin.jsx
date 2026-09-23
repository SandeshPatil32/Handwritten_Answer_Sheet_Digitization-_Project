import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, loginUser } from "../../features/auth/authSlice";
import AuthLayout from "../../components/auth/AuthLayout";

export default function TeacherLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (user) navigate(user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ ...form, role: "teacher" }));
    if (loginUser.fulfilled.match(result)) navigate("/teacher/dashboard", { replace: true });
  };

  return (
    <AuthLayout
      role="teacher"
      title="Teacher Login"
      subtitle="Sign in to manage examinations and review AI-assisted answer evaluation."
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Teacher Email</label>
          <input className="input-field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="teacher@example.com" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
          <input className="input-field" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" />
        </div>

        <button disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? "Signing in..." : "Login as Teacher"}
        </button>

        <p className="text-center text-sm text-slate-500">
          New teacher?{" "}
          <Link to="/teacher/signup" className="font-semibold text-blue-600">Create teacher account</Link>
        </p>

        <p className="text-center text-sm text-slate-500">
          Student portal?{" "}
          <Link to="/student/login" className="font-semibold text-blue-600">Student Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
