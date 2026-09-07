import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { state } = useStore();
  const location = useLocation();

  if (!state.role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(state.role)) {
    return <Navigate to="/" replace />; // Redirect to login if unauthorized
  }

  return <>{children}</>;
};
