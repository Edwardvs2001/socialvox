
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, User, Users, AlertTriangle, ShieldAlert, Eye, EyeOff, Lock, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'admin' | 'surveyor' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    login,
    isLoading,
    error,
    clearError,
    failedLoginAttempts,
    checkSession,
    logout,
  } = useAuthStore();
  const navigate = useNavigate();
  
  // Check session status on component mount
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
  
  // Reset error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  // Reset error when login type changes
  useEffect(() => {
    clearError();
  }, [loginType, clearError]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user?.role === 'surveyor') {
        navigate('/surveyor');
      } else if (user?.role === 'admin' || user?.role === 'admin-manager') {
        navigate('/admin');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Error is handled by the auth store, no need to handle it here
    }
  };
  
  const handleLoginTypeSelect = (type: 'admin' | 'surveyor') => {
    setLoginType(type);
    clearError();
    setEmail('');
    setPassword('');
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Login type selection screen
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
  
  // Admin login screen
  if (loginType === 'admin') {
    return <Card className="w-full max-w-md mx-auto shadow-[0_15px_35px_rgba(0,0,0,0.3)] animate-fade-in login-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-700/5"></div>
        <CardHeader className="space-y-1 relative z-10">
          <CardTitle className="text-2xl font-bold text-center drop-shadow-md text-blue-600">
            Acceso de administrador
          </CardTitle>
          <CardDescription className="text-center font-medium text-gray-800">
            Ingrese sus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-black font-medium bg-gray-50">Correo Electrónico</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                  <Mail className="h-4 w-4" />
                </div>
                <Input 
                  id="admin-email" 
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  autoComplete="email" 
                  className="input-focus-ring pl-10 border-white/20 text-white placeholder:text-white/60 bg-gray-400" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-black font-medium bg-gray-50">Contraseña</Label>
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
                  className="input-focus-ring pl-10 pr-10 border-white/20 text-white placeholder:text-white/60 bg-gray-400" 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white" 
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {failedLoginAttempts > 0 && <div className="p-3 rounded-md bg-amber-900/50 border border-amber-600/30 text-amber-100 text-sm flex items-center font-medium">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Intentos fallidos: {failedLoginAttempts} de 5 permitidos</span>
              </div>}
            
            {error && <div className="p-3 rounded-md bg-red-900/50 border border-red-600/30 text-red-100 text-sm flex items-center font-medium">
                <ShieldAlert className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>}
            
            <Button type="submit" variant="red" className="w-full p-6 h-auto flex items-center justify-center gap-3 bg-gradient-to-br from-red-500/80 to-red-600/80 border border-white/10 shadow-lg hover:shadow-red-500/20 transition-all duration-300" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Users className="h-5 w-5 text-white drop-shadow-md" />}
              <span className="font-medium text-white">{isLoading ? 'Iniciando sesión...' : 'Ingresar como Administrador'}</span>
            </Button>
            
            <Button type="button" variant="ghost" onClick={() => setLoginType(null)} className="w-full mt-2 text-white hover:text-white bg-black">
              Volver
            </Button>
          </form>
        </CardContent>
      </Card>;
  }
  
  // Surveyor login screen
  return <Card className="w-full max-w-md mx-auto shadow-[0_15px_35px_rgba(0,0,0,0.3)] animate-fade-in login-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-700/5"></div>
      <CardHeader className="space-y-1 relative z-10">
        <CardTitle className="font-bold text-center drop-shadow-md text-blue-600 text-2xl">
          Acceso de encuestador
        </CardTitle>
        <CardDescription className="text-center text-white/90 font-medium">
          Ingrese sus credenciales para continuar
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 bg-gray-50">
            <Label htmlFor="email" className="text-black font-medium rounded-sm bg-gray-50">Correo Electrónico</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                <Mail className="h-4 w-4" />
              </div>
              <Input 
                id="email" 
                type="email" 
                placeholder="correo@ejemplo.com" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                autoComplete="email" 
                className="input-focus-ring pl-10 border-white/20 text-white placeholder:text-white/60 bg-gray-500" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-black font-medium bg-gray-50">Contraseña</Label>
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
                className="input-focus-ring pl-10 pr-10 border-white/20 text-white placeholder:text-white/60 bg-gray-500" 
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white" 
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {failedLoginAttempts > 0 && <div className="p-3 rounded-md bg-amber-900/50 border border-amber-600/30 text-amber-100 text-sm flex items-center font-medium">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Intentos fallidos: {failedLoginAttempts} de 5 permitidos</span>
            </div>}
          
          {error && <div className="p-3 rounded-md bg-red-900/50 border border-red-600/30 text-red-100 text-sm flex items-center font-medium">
              <ShieldAlert className="h-4 w-4 mr-2 flex-shrink-0" />
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
