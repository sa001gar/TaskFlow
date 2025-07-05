import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { motion } from 'framer-motion';
import { Loader2, Building2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [checkAuth, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-bg via-white to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-accent-red rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-medium">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <Loader2 className="w-8 h-8 text-accent-red animate-spin mx-auto mb-4" />
          <p className="text-primary-dark text-lg font-semibold">Loading TaskFlow...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};