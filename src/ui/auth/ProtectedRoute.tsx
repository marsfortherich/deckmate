import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export interface ProtectedRouteProps {
  children: React.ReactElement;
  fallback?: React.ReactElement | null;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = null,
  redirectTo = '/login',
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return fallback;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};
