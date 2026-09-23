import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, registerUser } from "../../features/auth/authSlice";
import AuthLayout from "../../components/auth/AuthLayout";

export default function StudentSignup() {
  const [form, setForm] = useState({ name: "", email: "", studentId: "", password: "", confirmPassword: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (user) navigate(user.role === "student" ? "/student/dashboard" : "/teacher/dashboard", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const result = await dispatch(registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role: "student",
      studentId: form.studentId
    }));

    if (registerUser.fulfilled.match(result)) navigate("/student/dashboard", { replace: true });
  };

  return (
    <AuthLayout
      role="student"
      title="Create Student Account"
      subtitle="Create an account to access the student side of the examination-support system."
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
          <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Student ID</label>
          <input className="input-field" required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. MCA2026-001" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
          <input className="input-field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@example.com" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <input className="input-field" type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
            <input className="input-field" type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password" />
          </div>
        </div>

        <button disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? "Creating account..." : "Create Student Account"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link to="/student/login" className="font-semibold text-blue-600">Student Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
