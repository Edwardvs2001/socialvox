
import { ReactNode, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

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
  const { isAuthenticated, user, checkSession, refreshSession } = useAuthStore();
  const navigate = useNavigate();
  
  const checkAuth = useCallback(() => {
    console.log('AuthLayout - Checking auth:', { 
      isAuthenticated, 
      user, 
      requiresAuth, 
      allowedRoles 
    });
    
    // Logic for pages that require authentication
    if (requiresAuth) {
      // First check if session is valid
      const isSessionValid = checkSession();
      
      if (!isAuthenticated || !isSessionValid) {
        console.log('Not authenticated or session expired, redirecting to login');
        // Not logged in or session expired, redirect to login
        if (isAuthenticated && !isSessionValid) {
          toast.error('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
        }
        navigate('/');
        return;
      }
      
      // Only refresh session when needed and not on every render
      // This prevents infinite update loops
      if (isAuthenticated && isSessionValid) {
        // Using setTimeout to break the synchronous update cycle
        setTimeout(() => {
          refreshSession();
        }, 0);
      }
      
      if (allowedRoles.length > 0 && user) {
        // Check if user has admin-manager role, which should have access to admin pages
        const hasAccess = user.role === 'admin-manager' || allowedRoles.includes(user.role);
        
        if (!hasAccess) {
          console.log(`User role ${user.role} not allowed, redirecting`);
          // User doesn't have the required role
          if (user.role === 'surveyor') {
            navigate('/surveyor');
          } else if (user.role === 'admin' || user.role === 'admin-manager') {
            navigate('/admin');
          } else {
            navigate('/');
          }
          return;
        }
      }
    } else {
      // Logic for pages that don't require authentication (like login)
      // Check if session is valid for already authenticated users
      const isSessionValid = isAuthenticated ? checkSession() : false;
      
      if (isAuthenticated && isSessionValid) {
        console.log('Already authenticated, redirecting to dashboard');
        // Refresh the session timer but use setTimeout to break the synchronous cycle
        setTimeout(() => {
          refreshSession();
        }, 0);
        
        // Already logged in, redirect to appropriate dashboard
        if (user?.role === 'surveyor') {
          navigate('/surveyor');
        } else if (user?.role === 'admin' || user?.role === 'admin-manager') {
          navigate('/admin');
        }
      }
    }
  }, [isAuthenticated, user, requiresAuth, allowedRoles, navigate, checkSession]);
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {children}
    </div>
  );
}
