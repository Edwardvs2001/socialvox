
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      // If already authenticated, redirect to appropriate dashboard
      if (user?.role === 'surveyor') {
        navigate('/surveyor');
      } else if (user?.role === 'admin') {
        navigate('/admin');
      }
    } else {
      // Redirect to login page if not authenticated
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
