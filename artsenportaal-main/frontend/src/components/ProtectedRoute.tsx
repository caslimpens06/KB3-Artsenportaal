import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isDoctor, isResearcher } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'doctor' | 'researcher';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const authenticated = isAuthenticated();
  
  if (!authenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const hasAccess = 
      (requiredRole === 'doctor' && isDoctor()) || 
      (requiredRole === 'researcher' && isResearcher());

    if (!hasAccess) {
      // Redirect to home or unauthorized page if wrong role
      return <Navigate to="/" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 