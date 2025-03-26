
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { UserCircle, LogOut, ClipboardList, User, BarChart, Menu, X, Image } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, pendingCount } = useOfflineSync();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  
  useEffect(() => {
    // Try to get the logo from localStorage if it exists
    const storedLogo = localStorage.getItem('appLogo');
    if (storedLogo) {
      setAppLogo(storedLogo);
    }
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const isAdmin = user?.role === 'admin';
  
  const navLinks = isAdmin 
    ? [
        { to: '/admin', label: 'Dashboard', icon: BarChart },
        { to: '/admin/surveys', label: 'Encuestas', icon: ClipboardList },
        { to: '/admin/results', label: 'Resultados', icon: BarChart },
        { to: '/admin/users', label: 'Usuarios', icon: User },
      ]
    : [
        { to: '/surveyor', label: 'Mis Encuestas', icon: ClipboardList },
      ];
  
  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-lg bg-background/80 border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Link 
            to={isAdmin ? '/admin' : '/surveyor'} 
            className="flex items-center gap-2 font-bold text-xl"
          >
            <img 
              src="/lovable-uploads/08d8d744-0c91-48a2-a3af-c5f3ce5d78c5.png" 
              alt="Encuestas VA Logo" 
              className="h-10 w-10 object-contain"
            />
            <span className={`text-lg ${isAdmin ? 'text-red-500' : 'text-blue-500'}`}>Encuestas VA</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 ml-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center text-sm font-medium transition-colors
                    ${isActive 
                      ? (isAdmin ? 'text-admin font-semibold' : 'text-surveyor font-semibold') 
                      : 'text-foreground hover:text-primary'}`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isActive ? (isAdmin ? 'text-admin' : 'text-surveyor') : 'text-foreground'}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user?.role === 'surveyor' && (
            <div className="hidden md:flex items-center mr-2">
              {isOnline ? (
                <div className="flex items-center text-green-600 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-600 mr-2"></div>
                  <span>En línea</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600 text-sm">
                  <div className="w-2 h-2 rounded-full bg-yellow-600 mr-2"></div>
                  <span>Sin conexión</span>
                </div>
              )}
              
              {pendingCount > 0 && (
                <div className="ml-4 text-sm text-foreground">
                  <span>{pendingCount} {pendingCount === 1 ? 'encuesta pendiente' : 'encuestas pendientes'}</span>
                </div>
              )}
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white shadow-md">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="flex flex-col items-start">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.role === 'admin' ? 'Administrador' : 'Encuestador'}
                </p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
          <div className="fixed inset-y-0 right-0 z-50 w-3/4 bg-white shadow-lg animate-slide-up">
            <div className="flex flex-col p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Menú</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;
                
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center py-2 text-sm font-medium transition-colors
                      ${isActive 
                        ? (isAdmin ? 'text-admin font-semibold' : 'text-surveyor font-semibold') 
                        : 'text-foreground hover:text-primary'}`}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isActive ? (isAdmin ? 'text-admin' : 'text-surveyor') : 'text-foreground'}`} />
                    {link.label}
                  </Link>
                );
              })}
              
              <div className="mt-auto pt-6 border-t">
                {user?.role === 'surveyor' && (
                  <div className="flex items-center mb-4">
                    {isOnline ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-600 mr-2"></div>
                        <span>En línea</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600 text-sm">
                        <div className="w-2 h-2 rounded-full bg-yellow-600 mr-2"></div>
                        <span>Sin conexión</span>
                      </div>
                    )}
                    
                    {pendingCount > 0 && (
                      <div className="ml-4 text-sm text-foreground">
                        <span>{pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
