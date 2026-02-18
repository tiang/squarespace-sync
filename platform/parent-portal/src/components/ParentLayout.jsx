import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Icon } from '@iconify/react';

const NAV_ITEMS = [
  { to: '/parent',          label: 'Dashboard', icon: 'lucide:layout-dashboard', end: true },
  { to: '/parent/billing',  label: 'Billing',   icon: 'lucide:receipt'          },
  { to: '/parent/messages', label: 'Messages',  icon: 'lucide:message-circle'   },
  { to: '/parent/profile',  label: 'Profile',   icon: 'lucide:user'             },
];

function NavItem({ to, label, icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-black text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <Icon icon={icon} className="w-4 h-4 shrink-0" />
      {label}
    </NavLink>
  );
}

export default function ParentLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <span className="text-lg font-bold" style={{ fontFamily: "'General Sans', sans-serif" }}>
          🚀 Rocket Academy
        </span>
        <button onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Icon icon="lucide:menu" className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold" style={{ fontFamily: "'General Sans', sans-serif" }}>
                🚀 Rocket Academy
              </span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <Icon icon="lucide:x" className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map(item => (
                <NavItem key={item.to} {...item} onClick={() => setDrawerOpen(false)} />
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 min-h-screen border-r border-slate-100 px-4 py-8 shrink-0">
          <div className="mb-10 px-4">
            <span className="text-xl font-bold" style={{ fontFamily: "'General Sans', sans-serif" }}>
              🚀 Rocket Academy
            </span>
          </div>
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map(item => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
          <div className="px-4 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">Parent Portal</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 md:px-10 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
