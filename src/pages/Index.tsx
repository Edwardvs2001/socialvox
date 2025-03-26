
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  useEffect(() => {
    console.log('Index - Auth state:', { isAuthenticated, user });
    
    if (isAuthenticated && user) {
      // Si ya está autenticado, redirigir al panel correspondiente
      if (user.role === 'admin') {
        console.log('Redireccionando a panel de administrador');
        navigate('/admin');
      } else if (user.role === 'surveyor') {
        console.log('Redireccionando a panel de encuestador');
        navigate('/surveyor');
      } else {
        // Rol no reconocido
        console.error('Rol de usuario no reconocido:', user.role);
        toast.error('Error: Rol de usuario no reconocido');
      }
    } else {
      // Si no está autenticado, redirigir a la página de login
      console.log('No autenticado, redireccionando a login');
      navigate('/');
    }
  }, [navigate, isAuthenticated, user]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redireccionando...</h1>
        <p className="text-muted-foreground">Por favor espere, será redirigido automáticamente.</p>
      </div>
    </div>
  );
};

export default Index;
