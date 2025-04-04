
import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, checkSession, refreshSession, logout } = useAuthStore();
  const redirectingRef = useRef(false);
  const hasRefreshedRef = useRef(false);
  
  // Using useCallback to prevent unnecessary re-renders
  const handleRedirect = useCallback(() => {
    // Use ref to prevent multiple redirects
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    
    // Check if session is still valid
    const isSessionValid = checkSession();
    
    if (isAuthenticated && isSessionValid && user) {
      console.log('Usuario autenticado:', user);
      
      // Refresh the session timer
      if (!hasRefreshedRef.current) {
        refreshSession();
        hasRefreshedRef.current = true;
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
      
      // Navigate immediately without setTimeout to prevent race conditions
      navigate(targetPath);
      
    } else {
      if (isAuthenticated && !isSessionValid) {
        // Handle expired session 
        logout();
        toast.error('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
      }
      console.log('Usuario no autenticado o sesión expirada, redirigiendo a login');
      
      // Navigate immediately without setTimeout
      navigate('/');
    }
  }, [navigate, isAuthenticated, user, checkSession, logout, refreshSession]);

  useEffect(() => {
    // Only run once when component mounts
    handleRedirect();
    
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
