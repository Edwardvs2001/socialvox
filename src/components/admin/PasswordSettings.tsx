
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Lock, LockOpen } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const adminPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
});

export function PasswordSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const updateUser = useUserStore(state => state.updateUser);
  const { users } = useUserStore();
  const { requiresPassword, togglePasswordRequirement } = useAuthStore();
  
  const adminUser = users.find(user => user.username.toLowerCase() === 'admin');
  
  const form = useForm<z.infer<typeof adminPasswordSchema>>({
    resolver: zodResolver(adminPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const handleTogglePasswords = async () => {
    setIsLoading(true);
    
    try {
      // If enabling passwords and admin user doesn't have a password
      if (!requiresPassword && adminUser && !adminUser.password) {
        toast.warning("Debe establecer una contraseña para el administrador antes de activar esta función.");
        setIsLoading(false);
        return;
      }
      
      // Toggle the password requirement setting
      togglePasswordRequirement(!requiresPassword);
      
      toast.success(
        requiresPassword 
          ? "Las contraseñas han sido desactivadas en el sistema." 
          : "Las contraseñas han sido activadas en el sistema."
      );
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error al cambiar configuración de contraseñas:", error);
      toast.error("Error al cambiar configuración de contraseñas");
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof adminPasswordSchema>) => {
    setIsLoading(true);
    
    try {
      if (adminUser) {
        await updateUser(adminUser.id, {
          password: values.password,
        });
        
        toast.success("Contraseña de administrador actualizada correctamente");
        form.reset();
      } else {
        toast.error("No se encontró el usuario administrador");
      }
    } catch (error) {
      toast.error("Error al actualizar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Seguridad</CardTitle>
        <CardDescription>
          {requiresPassword 
            ? "El sistema requiere contraseñas para el inicio de sesión."
            : "El sistema opera sin requerir contraseñas para facilitar el acceso rápido."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="password-toggle">Requerir contraseñas</Label>
            <p className="text-sm text-muted-foreground">
              {requiresPassword 
                ? "Los usuarios deben ingresar una contraseña para acceder." 
                : "Los usuarios solo necesitan su nombre de usuario para acceder."
              }
            </p>
          </div>
          <div className="flex items-center">
            <Switch
              id="password-toggle"
              checked={requiresPassword}
              onCheckedChange={handleTogglePasswords}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña de Administrador</FormLabel>
                    <div className="flex relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Establecer contraseña para administrador" 
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormDescription>
                      Establezca una contraseña segura para el usuario administrador
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>
          </Form>
        </div>
        
        <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          <p className="font-medium flex items-center gap-1">
            {requiresPassword ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            Información importante
          </p>
          <p>
            {requiresPassword 
              ? "El sistema está configurado para exigir contraseñas. Los usuarios necesitan tanto su nombre de usuario como su contraseña para acceder." 
              : "El sistema está configurado para funcionar sin contraseñas. Los usuarios solo necesitan ingresar su nombre de usuario para acceder."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
