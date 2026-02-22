import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ParentLayout from './components/ParentLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ParentDashboard from './pages/ParentDashboard.jsx';
import ChildDetail from './pages/ChildDetail.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AccountNotFoundPage from './pages/AccountNotFoundPage.jsx';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/',      element: <Navigate to="/parent" replace /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/account-not-found', element: <AccountNotFoundPage /> },
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
    ],
  },
]);

export default router;
