
import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, checkSession, refreshSession, logout } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectingRef = useRef(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  
  // Using useCallback to prevent unnecessary re-renders
  const handleRedirect = useCallback(() => {
    // Use ref to prevent multiple redirects including during the function execution
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    setIsRedirecting(true);
    
    // Check if session is still valid
    const isSessionValid = checkSession();
    
    if (isAuthenticated && isSessionValid && user) {
      console.log('Usuario autenticado:', user);
      
      // Refresh the session timer in an async way to prevent infinite loops
      if (!hasRefreshed) {
        setTimeout(() => {
          refreshSession();
          setHasRefreshed(true);
        }, 100);
      }
      
      let targetPath = '/';
      
      switch (user.role) {
        case 'admin':
        case 'admin-manager':
          console.log('Redirigiendo a panel de administrador');
          targetPath = '/admin';
          break;
        case 'surveyor':
          console.log('Redirigiendo a panel de encuestador');
          targetPath = '/surveyor';
          break;
        default:
          console.error('Rol no reconocido:', user.role);
          toast.error('Error: Rol de usuario no reconocido');
          logout();
          targetPath = '/';
      }
      
      // Use setTimeout to ensure state updates are processed before navigation
      setTimeout(() => {
        navigate(targetPath);
      }, 50);
      
    } else {
      if (isAuthenticated && !isSessionValid) {
        // Handle expired session 
        logout();
        toast.error('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
      }
      console.log('Usuario no autenticado o sesión expirada, redirigiendo a login');
      
      // Use setTimeout to ensure state updates are processed before navigation
      setTimeout(() => {
        navigate('/');
      }, 50);
    }
  }, [navigate, isAuthenticated, user, checkSession, logout, hasRefreshed, refreshSession]);

  useEffect(() => {
    // Only run once when component mounts
    if (!redirectingRef.current) {
      handleRedirect();
    }
    
    return () => {
      // Clean up when component unmounts
      redirectingRef.current = false;
    };
  }, [handleRedirect]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redireccionando...</h1>
        <p className="text-muted-foreground">Por favor espere, será redirigido automáticamente.</p>
      </div>
    </div>
  );
}

export default Index;
