
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      console.log('Attempting login with:', username);
      await login(username, password);
      
      // Get user role and redirect accordingly
      const user = useAuthStore.getState().user;
      
      if (user?.role === 'surveyor') {
        navigate('/surveyor');
      } else if (user?.role === 'admin' || user?.role === 'admin-manager') {
        navigate('/admin');
      }
    } catch (err) {
      // Error is handled in the store
      console.error('Login error:', err);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg animate-scale-in survey-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Encuestas VA</CardTitle>
        <CardDescription className="text-center">
          Ingrese sus credenciales para acceder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="Ingrese su nombre de usuario"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-focus-ring"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Ingrese su contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-focus-ring"
              autoComplete="current-password"
            />
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar sesión
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <p className="text-xs text-center text-muted-foreground mt-4">
          Credenciales de prueba: <br />
          <span className="font-medium">Administrador:</span> admin / admin123, victoria2026 / victoria2026, amazonas2020 / ed1212<br />
          <span className="font-medium">Encuestador:</span> surveyor / surveyor123
        </p>
      </CardFooter>
    </Card>
  );
}
