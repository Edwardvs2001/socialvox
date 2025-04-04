
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, requiresPassword } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username) {
      toast.error('Por favor, ingrese su nombre de usuario');
      return;
    }
    
    if (requiresPassword && !password) {
      toast.error('Por favor, ingrese su contraseña');
      return;
    }
    
    try {
      await login(username, password);
      navigate('/index');
    } catch (err) {
      // Error is handled by the store and displayed below
    }
  };
  
  return (
    <div className="bg-white shadow-lg rounded-b-2xl p-8 w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-foreground font-medium">
            Nombre de Usuario
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="Ingrese su nombre de usuario"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) clearError();
            }}
            className="bg-background-foreground border border-input"
            disabled={isLoading}
            autoComplete="username"
          />
        </div>
        
        {requiresPassword && (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                className="bg-background-foreground border border-input pr-10"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
            {error}
          </div>
        )}
        
        <Button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </Button>
        
        <div className="text-xs text-center text-muted-foreground pt-2">
          {requiresPassword 
            ? "El sistema requiere contraseñas para el inicio de sesión."
            : "Ingrese su nombre de usuario para acceder."
          }
        </div>
      </form>
    </div>
  );
}
