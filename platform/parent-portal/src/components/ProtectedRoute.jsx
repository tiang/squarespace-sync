import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Renders child routes when authenticated.
 * Shows a loading screen while Firebase resolves auth state.
 * Redirects to /login when signed out.
 * Redirects to /account-not-found when authenticated but Family not found in DB.
 */
export default function ProtectedRoute() {
  const { user, familyNotFound } = useAuth();

  // null = still loading (Firebase hasn't resolved yet)
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-400 text-sm">Loading…</span>
      </div>
    );
  }

  if (user === false)  return <Navigate to="/login" replace />;
  if (familyNotFound)  return <Navigate to="/account-not-found" replace />;

  return <Outlet />;
}
