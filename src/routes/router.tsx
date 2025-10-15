// src/routes/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { LoginPage } from '../pages/LoginPage';
import { AdminPage } from '../pages/AdminPage';
import { ClientPage } from '../pages/ClientPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'admin',
        element: (
          <ProtectedRoute allow={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'client',
        element: (
          <ProtectedRoute allow={['client', 'admin']}>
            <ClientPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);