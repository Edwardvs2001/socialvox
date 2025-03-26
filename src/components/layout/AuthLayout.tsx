
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface AuthLayoutProps {
  children: ReactNode;
  requiresAuth?: boolean;
  allowedRoles?: string[];
}

export function AuthLayout({ 
  children, 
  requiresAuth = true,
  allowedRoles = [] 
}: AuthLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Logic for pages that require authentication
    if (requiresAuth) {
      if (!isAuthenticated) {
        // Not logged in, redirect to login
        navigate('/');
        return;
      }
      
      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        // User doesn't have the required role
        if (user.role === 'surveyor') {
          navigate('/surveyor');
        } else if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
        return;
      }
    } else {
      // Logic for pages that don't require authentication (like login)
      if (isAuthenticated) {
        // Already logged in, redirect to appropriate dashboard
        if (user?.role === 'surveyor') {
          navigate('/surveyor');
        } else {
          navigate('/admin');
        }
      }
    }
  }, [isAuthenticated, user, requiresAuth, allowedRoles, navigate]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {children}
    </div>
  );
}
