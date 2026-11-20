import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-xs font-medium text-surface-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User authenticated but unauthorized for this specific role route
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-surface-200 shadow-card text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-surface-900">Access Restricted</h3>
        <p className="text-xs text-surface-500 mt-2">
          Your account role (<span className="font-semibold text-surface-700">{user.role}</span>) is not authorized to access this section.
        </p>
        <div className="mt-6">
          <Navigate to={getHomeRoute(user.role)} replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const getHomeRoute = (role: UserRole): string => {
  switch (role) {
    case 'ROLE_STUDENT':
      return '/student';
    case 'ROLE_FACULTY':
      return '/handler';
    case 'ROLE_HOD':
      return '/hod';
    case 'ROLE_ADMIN':
      return '/admin';
    default:
      return '/';
  }
};
