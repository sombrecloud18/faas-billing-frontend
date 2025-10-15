// src/routes/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { getRole, getToken } from '../utils/auth';

export function ProtectedRoute({ children, allow }: { children: JSX.Element; allow: Array<'admin'|'client'> }) {
  const token = getToken();
  const role = getRole();
  if (!token || !role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to="/login" replace />;
  return children;
}