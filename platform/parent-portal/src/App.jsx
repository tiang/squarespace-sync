import { createBrowserRouter, Navigate } from 'react-router-dom';
import ParentLayout from './components/ParentLayout.jsx';
import ParentDashboard from './pages/ParentDashboard.jsx';
import ChildDetail from './pages/ChildDetail.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/parent" replace /> },
  {
    element: <ParentLayout />,
    children: [
      { path: '/parent',               element: <ParentDashboard /> },
      { path: '/parent/children/:id',  element: <ChildDetail /> },
      { path: '/parent/calendar',      element: <CalendarPage /> },
      { path: '/parent/billing',       element: <BillingPage /> },
      { path: '/parent/messages',      element: <MessagesPage /> },
      { path: '/parent/profile',       element: <ProfilePage /> },
    ],
  },
]);

export default router;
