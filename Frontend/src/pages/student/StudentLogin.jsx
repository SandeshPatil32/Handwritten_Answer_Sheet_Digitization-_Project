import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, loginUser } from "../../features/auth/authSlice";
import AuthLayout from "../../components/auth/AuthLayout";

export default function StudentLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      navigate(user.role === "student" ? "/student/dashboard" : "/teacher/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ ...form, role: "student" }));
    if (loginUser.fulfilled.match(result)) {
      navigate("/student/dashboard", { replace: true });
    }
  };

  return (
    <AuthLayout
      role="student"
      title="Student Login"
      subtitle="Sign in to access your student examination portal."
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {location.state?.message && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{location.state.message}</div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
          <input
            className="input-field"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="student@example.com"
          />
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <span className="text-xs text-slate-400">Secure login</span>
          </div>
          <input
            className="input-field"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
          />
        </div>

        <button disabled={loading} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Signing in..." : "Login as Student"}
        </button>

        <p className="text-center text-sm text-slate-500">
          New student?{" "}
          <Link to="/student/signup" className="font-semibold text-blue-600 hover:text-blue-700">Create account</Link>
        </p>

        <p className="text-center text-sm text-slate-500">
          Are you a teacher?{" "}
          <Link to="/teacher/login" className="font-semibold text-blue-600 hover:text-blue-700">Teacher Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
