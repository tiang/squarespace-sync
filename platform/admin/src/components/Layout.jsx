import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      <Outlet />
    </div>
  );
}
