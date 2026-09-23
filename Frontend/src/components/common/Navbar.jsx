import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, GraduationCap, LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";

const navClass = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setOpen(false);
  };

  const dashboardPath =
    user?.role === "teacher"
      ? "/teacher/dashboard"
      : "/student/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <GraduationCap size={21} />
          </span>
          <div>
            <p className="text-base font-bold text-slate-900">AnswerCheck AI</p>
            <p className="hidden text-[10px] uppercase tracking-wider text-slate-500 sm:block">
              Examination Support System
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/" className={navClass}>Home</NavLink>
          <a href="/#features" className="text-sm font-medium text-slate-600 hover:text-blue-600">Features</a>
          <a href="/#workflow" className="text-sm font-medium text-slate-600 hover:text-blue-600">Workflow</a>

          {user ? (
            <>
              <Link to={dashboardPath} className="btn-primary px-4 py-2 text-sm">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-red-600">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/student/login" className="btn-secondary px-4 py-2 text-sm">Student Login</Link>
              <Link to="/teacher/login" className="btn-primary px-4 py-2 text-sm">Teacher Login</Link>
            </div>
          )}
        </nav>

        <button
          className="rounded-lg p-2 text-slate-700 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="container-page flex flex-col gap-4 py-5">
            <NavLink to="/" className={navClass} onClick={() => setOpen(false)}>Home</NavLink>
            <a href="/#features" className="text-sm font-medium text-slate-600" onClick={() => setOpen(false)}>Features</a>
            <a href="/#workflow" className="text-sm font-medium text-slate-600" onClick={() => setOpen(false)}>Workflow</a>
            {user ? (
              <>
                <Link to={dashboardPath} className="btn-primary" onClick={() => setOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="flex items-center gap-2 text-left text-sm font-medium text-red-600">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/student/login" className="btn-secondary">Student Login</Link>
                <Link to="/teacher/login" className="btn-primary">Teacher Login</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
