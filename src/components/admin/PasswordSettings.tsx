
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';

export function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const updateUser = useUserStore(state => state.updateUser);
  const user = useAuthStore(state => state.user);
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate password match
      if (newPassword !== confirmPassword) {
        toast.error("Las contraseñas nuevas no coinciden");
        setIsLoading(false);
        return;
      }
      
      // Validate password strength
      if (newPassword.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        toast.error("No hay usuario autenticado");
        setIsLoading(false);
        return;
      }
      
      // Update user password
      await updateUser(user.id, { password: newPassword });
      
      toast.success("Contraseña actualizada con éxito");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsLoading(false);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      toast.error("Error al actualizar la contraseña");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Seguridad</CardTitle>
        <CardDescription>
          Actualice su contraseña para mantener la seguridad de su cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              minLength={6}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              minLength={6}
              required
            />
          </div>
          
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
