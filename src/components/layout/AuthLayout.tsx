import { ReactNode, useEffect, useCallback, useState, useRef } from 'react';
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
  const { isAuthenticated, user, checkSession, refreshSession, logout } = useAuthStore();
  const navigate = useNavigate();
  const hasCheckedAuthRef = useRef(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  const checkAuth = useCallback(() => {
    // Prevent multiple checks in the same rendering cycle
    if (hasCheckedAuthRef.current) return;
    hasCheckedAuthRef.current = true;
    
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
          // Handle session expiration 
          logout(); // Safely log out the user
          toast.error('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
        }
        navigate('/');
        return;
      }
      
      // Only refresh session when authenticated and have valid session
      refreshSession();
      
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
        
        refreshSession();
        
        // Already logged in, redirect to appropriate dashboard
        if (user?.role === 'surveyor') {
          navigate('/surveyor');
        } else if (user?.role === 'admin' || user?.role === 'admin-manager') {
          navigate('/admin');
        }
      }
    }
    
    setInitialCheckDone(true);
  }, [isAuthenticated, user, requiresAuth, allowedRoles, navigate, checkSession, refreshSession, logout]);
  
  useEffect(() => {
    // Run the auth check only once on component mount
    checkAuth();
    
    // Set up a periodic refresh for the session (every 15 minutes)
    // This keeps the session fresh while the user is active
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    refreshTimerRef.current = setInterval(() => {
      if (isAuthenticated && checkSession()) {
        refreshSession();
      }
    }, 15 * 60 * 1000); // 15 minutes
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [checkAuth]);
  
  // Don't render children until initial auth check is done
  if (requiresAuth && !initialCheckDone) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {children}
    </div>
  );
}
