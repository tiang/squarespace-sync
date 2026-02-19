import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      <nav className="fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-6 z-30">
        <span className="font-semibold text-sm text-violet-600">Rocket Admin</span>
        <NavLink
          to="/instructor/dashboard"
          className={({ isActive }) =>
            `text-sm ${isActive ? 'text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700'}`
          }
        >
          Sessions
        </NavLink>
        <NavLink
          to="/admin/staff"
          className={({ isActive }) =>
            `text-sm ${isActive ? 'text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700'}`
          }
        >
          Staff
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
