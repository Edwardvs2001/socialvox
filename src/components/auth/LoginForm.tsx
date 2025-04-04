import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, User, Users, Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'admin' | 'surveyor' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    login,
    isLoading,
    error,
    clearError,
    checkSession,
    logout,
  } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (isAuthenticated) {
      const isSessionValid = checkSession();
      if (!isSessionValid) {
        logout();
        toast.error('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
      }
    }
  }, []);
  
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  useEffect(() => {
    clearError();
  }, [loginType, clearError]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!username) {
      toast.error('Por favor ingrese un nombre de usuario');
      return;
    }
    
    if (!password) {
      toast.error('Por favor ingrese su contraseña');
      return;
    }
    
    try {
      console.log(`Intentando iniciar sesión con: ${username}`);
      
      await login(username, password);
      const user = useAuthStore.getState().user;
      console.log("Login successful, user:", user);
      
      if (user?.role === 'surveyor') {
        navigate('/surveyor');
      } else if (user?.role === 'admin' || user?.role === 'admin-manager') {
        navigate('/admin');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Error is handled by the auth store
    }
  };
  
  const handleLoginTypeSelect = (type: 'admin' | 'surveyor') => {
    setLoginType(type);
    clearError();
    setUsername('');
    setPassword('');
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  if (loginType === null) {
    return <Card className="w-full max-w-md mx-auto shadow-[0_15px_35px_rgba(0,0,0,0.3)] animate-fade-in login-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-red-500/5"></div>
        <CardHeader className="space-y-1 relative z-10">
          <CardTitle className="text-2xl font-bold text-center drop-shadow-md text-zinc-950">
            Seleccione su tipo de acceso
          </CardTitle>
          <CardDescription className="text-center font-medium text-zinc-900">
            Escoja el tipo de usuario para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => handleLoginTypeSelect('admin')} variant="red" className="p-8 h-auto flex flex-col gap-4 bg-gradient-to-br from-red-500/80 to-red-600/80 border border-white/10 shadow-lg hover:shadow-red-500/20 hover:-translate-y-1 transition-all duration-300">
              <div className="p-4 rounded-full bg-blue-600">
                <Users className="h-10 w-10 text-white drop-shadow-md" />
              </div>
              <span className="font-medium text-white">Administrador</span>
            </Button>
            
            <Button onClick={() => handleLoginTypeSelect('surveyor')} variant="blue" className="p-8 h-auto flex flex-col gap-4 bg-gradient-to-br from-blue-500/80 to-blue-600/80 border border-white/10 shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300">
              <div className="p-4 rounded-full bg-red-600">
                <User className="h-10 w-10 text-white drop-shadow-md" />
              </div>
              <span className="font-medium text-white">Encuestador</span>
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  
  if (loginType === 'admin') {
    return <Card className="w-full max-w-md mx-auto shadow-[0_15px_35px_rgba(0,0,0,0.3)] animate-fade-in login-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-700/5"></div>
        <CardHeader className="space-y-1 relative z-10">
          <CardTitle className="text-2xl font-bold text-center drop-shadow-md text-blue-600">
            Acceso de administrador
          </CardTitle>
          <CardDescription className="text-center font-medium text-gray-800">
            Ingrese sus credenciales
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="text-black font-medium">Usuario</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                  <User className="h-4 w-4" />
                </div>
                <Input 
                  id="admin-username" 
                  type="text" 
                  placeholder="Ingrese su nombre de usuario" 
                  required 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  autoComplete="username" 
                  className="input-focus-ring pl-10 border-white/20 text-white placeholder:text-white/60 bg-gray-500" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-black font-medium">Contraseña</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                  <Lock className="h-4 w-4" />
                </div>
                <Input 
                  id="admin-password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Ingrese su contraseña" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  autoComplete="current-password" 
                  className="input-focus-ring pl-10 border-white/20 text-white placeholder:text-white/60 bg-gray-500" 
                />
                <button 
                  type="button" 
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {error && <div className="p-3 rounded-md bg-red-900/50 border border-red-600/30 text-red-100 text-sm flex items-center font-medium">
                <span>{error}</span>
              </div>}
            
            <Button type="submit" className="w-full mt-6 bg-gradient-to-br from-red-500 to-red-600 border border-white/10 shadow-lg hover:shadow-red-500/20 transition-all duration-300" variant="red" disabled={isLoading}>
              {isLoading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </> : <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </>}
            </Button>
            
            <Button type="button" variant="ghost" onClick={() => setLoginType(null)} className="w-full mt-2 text-white hover:text-white bg-black">
              Volver
            </Button>
          </form>
        </CardContent>
      </Card>;
  }
  
  return <Card className="w-full max-w-md mx-auto shadow-[0_15px_35px_rgba(0,0,0,0.3)] animate-fade-in login-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-700/5"></div>
      <CardHeader className="space-y-1 relative z-10">
        <CardTitle className="font-bold text-center drop-shadow-md text-blue-600 text-2xl">
          Acceso de encuestador
        </CardTitle>
        <CardDescription className="text-center text-white/90 font-medium">
          Ingrese sus credenciales
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 bg-gray-50">
            <Label htmlFor="username" className="text-black font-medium rounded-sm bg-gray-50">Usuario</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                <User className="h-4 w-4" />
              </div>
              <Input id="username" type="text" placeholder="Ingrese su nombre de usuario" required value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" className="input-focus-ring pl-10 border-white/20 text-white placeholder:text-white/60 bg-gray-500" />
            </div>
          </div>
          
          <div className="space-y-2 bg-gray-50">
            <Label htmlFor="password" className="text-black font-medium rounded-sm bg-gray-50">Contraseña</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                <Lock className="h-4 w-4" />
              </div>
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Ingrese su contraseña" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                autoComplete="current-password" 
                className="input-focus-ring pl-10 border-white/20 text-white placeholder:text-white/60 bg-gray-500" 
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {error && <div className="p-3 rounded-md bg-red-900/50 border border-red-600/30 text-red-100 text-sm flex items-center font-medium">
              <span>{error}</span>
            </div>}
          
          <Button type="submit" className="w-full mt-6 bg-gradient-to-br from-blue-500 to-blue-600 border border-white/10 shadow-lg hover:shadow-blue-500/20 transition-all duration-300" variant="blue" disabled={isLoading}>
            {isLoading ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </> : <>
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar sesión
              </>}
          </Button>
          
          <Button type="button" variant="ghost" onClick={() => setLoginType(null)} className="w-full mt-2 text-zinc-50 bg-stone-950 hover:bg-stone-800">
            Volver
          </Button>
        </form>
      </CardContent>
    </Card>;
}
