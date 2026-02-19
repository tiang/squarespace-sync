import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InstructorDashboard from './pages/InstructorDashboard';
import RollCallPage from './pages/RollCallPage';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/instructor/dashboard" replace /> },
  {
    element: <Layout />,
    children: [
      { path: '/instructor/dashboard', element: <InstructorDashboard /> },
      { path: '/instructor/session/:id/attend', element: <RollCallPage /> },
    ],
  },
]);

export default router;
