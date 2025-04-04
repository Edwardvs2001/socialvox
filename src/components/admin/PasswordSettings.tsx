
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';

// Since the password functionality has been removed, this component is simplified
export function PasswordSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const updateUser = useUserStore(state => state.updateUser);
  const user = useAuthStore(state => state.user);
  
  const handleDisablePasswords = async () => {
    setIsLoading(true);
    
    try {
      toast.info("Las contraseñas han sido desactivadas en todo el sistema.");
      setIsLoading(false);
    } catch (error) {
      console.error("Error al deshabilitar contraseñas:", error);
      toast.error("Error al deshabilitar contraseñas");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Seguridad</CardTitle>
        <CardDescription>
          El sistema opera sin requerir contraseñas para facilitar el acceso rápido.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            <p className="font-medium">Información importante</p>
            <p>El sistema está configurado para funcionar sin contraseñas. Los usuarios solo necesitan ingresar su nombre de usuario para acceder.</p>
          </div>
        </div>
        
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700"
            disabled={true}
          >
            Sistema configurado sin contraseñas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
