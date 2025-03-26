
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, User, Users } from 'lucide-react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'admin' | 'surveyor' | null>(null);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
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
  
  // Handle login type selection
  const handleLoginTypeSelect = (type: 'admin' | 'surveyor') => {
    setLoginType(type);
    clearError();
    // Clear credentials when switching login type
    setUsername('');
    setPassword('');
  };
  
  // Show login type selection if no type is selected yet
  if (loginType === null) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg animate-scale-in survey-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Encuestas VA</CardTitle>
          <CardDescription className="text-center">
            Seleccione su tipo de acceso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => handleLoginTypeSelect('admin')}
              variant="outline"
              className="p-8 h-auto flex flex-col gap-4 hover:bg-secondary"
            >
              <Users className="h-12 w-12" />
              <span className="font-medium">Administrador</span>
            </Button>
            
            <Button 
              onClick={() => handleLoginTypeSelect('surveyor')}
              variant="outline"
              className="p-8 h-auto flex flex-col gap-4 hover:bg-secondary"
            >
              <User className="h-12 w-12" />
              <span className="font-medium">Encuestador</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg animate-scale-in survey-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Encuestas VA</CardTitle>
        <CardDescription className="text-center">
          {loginType === 'admin' ? 'Acceso de administrador' : 'Acceso de encuestador'}
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
          
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full mt-2"
            onClick={() => setLoginType(null)}
          >
            Volver
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        {loginType === 'admin' && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Credenciales de administrador: <br />
            <span className="font-medium">Administrador 1:</span> amazonas2020 / amazonas123<br />
            <span className="font-medium">Administrador 2:</span> admin / admin123
          </p>
        )}
        {loginType === 'surveyor' && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Credenciales de encuestador: <br />
            <span className="font-medium">Encuestador:</span> surveyor / surveyor123
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
