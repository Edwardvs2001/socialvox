
import { ReactNode, useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
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
  const initialCheckRef = useRef(false);
  
  const checkAuth = useCallback(async () => {
    // Prevent multiple checks on the same render cycle
    if (initialCheckRef.current) return;
    initialCheckRef.current = true;
    
    console.log('AuthLayout - Checking auth:', { 
      isAuthenticated, 
      user, 
      requiresAuth, 
      allowedRoles 
    });
    
    // Logic for pages that require authentication
    if (requiresAuth) {
      // First check if session is valid
      const isSessionValid = await checkSession();
      
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
      // Use setTimeout to prevent infinite update loops
      if (isAuthenticated && isSessionValid && !hasCheckedAuthRef.current) {
        hasCheckedAuthRef.current = true;
        setTimeout(() => {
          refreshSession();
        }, 100);
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
      const isSessionValid = isAuthenticated ? await checkSession() : false;
      
      if (isAuthenticated && isSessionValid) {
        console.log('Already authenticated, redirecting to dashboard');
        
        // Only schedule refresh if we haven't already checked auth
        if (!hasCheckedAuthRef.current) {
          hasCheckedAuthRef.current = true;
          setTimeout(() => {
            refreshSession();
          }, 100);
        }
        
        // Already logged in, redirect to appropriate dashboard
        if (user?.role === 'surveyor') {
          navigate('/surveyor');
        } else if (user?.role === 'admin' || user?.role === 'admin-manager') {
          navigate('/admin');
        }
      }
    }
  }, [isAuthenticated, user, requiresAuth, allowedRoles, navigate, checkSession, refreshSession, logout]);
  
  useEffect(() => {
    // Set up auth state listener for Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        // User signed out, update state
        useAuthStore.getState().logout();
      }
    });
    
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
      
      // Clean up Supabase auth listener
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [checkAuth]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {children}
    </div>
  );
}
