import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InstructorDashboard from './pages/InstructorDashboard';
import RollCallPage from './pages/RollCallPage';
import StaffDirectory from './pages/StaffDirectory';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/instructor/dashboard" replace /> },
  {
    element: <Layout />,
    children: [
      { path: '/instructor/dashboard', element: <InstructorDashboard /> },
      { path: '/instructor/session/:id/attend', element: <RollCallPage /> },
      { path: '/admin/staff', element: <StaffDirectory /> },
    ],
  },
]);

export default router;
