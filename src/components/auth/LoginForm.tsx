import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, User, Users, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'admin' | 'surveyor' | null>(null);
  const { login, isLoading, error, clearError, failedLoginAttempts } = useAuthStore();
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
      } else if (user?.role === 'admin') {
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

  // Handle direct admin access
  const handleDirectAdminAccess = async () => {
    clearError();
    
    try {
      // Set admin username
      setUsername('admin');
      
      if (!password) {
        toast.error('Por favor ingrese la contraseña de administrador');
        return;
      }
      
      console.log('Attempting admin login with password:', password);
      
      await login('admin', password);
      
      // Get user after login
      const user = useAuthStore.getState().user;
      
      if (user?.role === 'admin' || user?.role === 'admin-manager') {
        navigate('/admin');
      } else {
        toast.error('Error al acceder: El usuario no tiene permisos de administrador');
      }
    } catch (err) {
      toast.error('Error al iniciar sesión como administrador');
      console.error('Direct login error:', err);
    }
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

  // Admin Direct Access
  if (loginType === 'admin') {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg animate-scale-in survey-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Encuestas VA</CardTitle>
          <CardDescription className="text-center">
            Acceso de administrador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="admin-password">Contraseña de Administrador</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Ingrese la contraseña de administrador"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-focus-ring"
              autoComplete="current-password"
            />
          </div>
          
          {failedLoginAttempts > 0 && (
            <div className="p-3 rounded-md bg-amber-100 border border-amber-200 text-amber-800 text-sm flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Intentos fallidos: {failedLoginAttempts} de 5 permitidos</span>
            </div>
          )}
          
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <Button 
              onClick={handleDirectAdminAccess}
              variant="default"
              className="p-6 h-auto flex flex-col gap-3 hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Users className="h-8 w-8" />
              )}
              <span className="font-medium">Ingresar como Administrador</span>
            </Button>
          </div>
          
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full mt-2"
            onClick={() => setLoginType(null)}
          >
            Volver
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-xs text-center text-muted-foreground mt-4">
            <span className="font-medium">Contraseña de administrador:</span> Admin@2024!
          </p>
        </CardFooter>
      </Card>
    );
  }
  
  // Surveyor login (keep original form)
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg animate-scale-in survey-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Encuestas VA</CardTitle>
        <CardDescription className="text-center">
          Acceso de encuestador
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
          
          {failedLoginAttempts > 0 && (
            <div className="p-3 rounded-md bg-amber-100 border border-amber-200 text-amber-800 text-sm flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Intentos fallidos: {failedLoginAttempts} de 5 permitidos</span>
            </div>
          )}
          
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
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
