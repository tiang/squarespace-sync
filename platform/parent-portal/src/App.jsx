import { createBrowserRouter, Navigate } from 'react-router-dom';

// Pages imported in later tasks
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/parent" replace /> },
]);

export default router;
