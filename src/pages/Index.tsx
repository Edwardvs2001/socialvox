
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  // Using useCallback to prevent unnecessary re-renders
  const handleRedirect = useCallback(() => {
    if (isAuthenticated && user) {
      console.log('Usuario autenticado:', user);
      
      switch (user.role) {
        case 'admin':
        case 'admin-manager':
          console.log('Redirigiendo a panel de administrador');
          navigate('/admin');
          break;
        case 'surveyor':
          console.log('Redirigiendo a panel de encuestador');
          navigate('/surveyor');
          break;
        default:
          console.error('Rol no reconocido:', user.role);
          toast.error('Error: Rol de usuario no reconocido');
      }
    } else {
      console.log('Usuario no autenticado, redirigiendo a login');
      navigate('/');
    }
  }, [navigate, isAuthenticated, user]);

  useEffect(() => {
    // Only run once when component mounts
    handleRedirect();
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
