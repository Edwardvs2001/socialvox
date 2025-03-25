
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUserStore, User } from '@/store/userStore';
import { UserRole } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatDate } from '@/utils/api';
import { Edit, Loader2, Plus, Search, Trash, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const userFormSchema = z.object({
  username: z.string().min(3, {
    message: "El nombre de usuario debe tener al menos 3 caracteres",
  }),
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres",
  }),
  email: z.string().email({
    message: "Debe ingresar un email válido",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
  role: z.enum(['admin', 'surveyor', 'admin-manager'], {
    message: "Debe seleccionar un rol válido",
  }),
  active: z.boolean().default(true),
});

export function UserManager() {
  const { users, fetchUsers, createUser, updateUser, deleteUser, isLoading, error } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Initialize the form
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      role: 'surveyor' as UserRole,
      active: true,
    },
  });
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Open dialog to add new user
  const openAddUserDialog = () => {
    form.reset({
      username: "",
      name: "",
      email: "",
      password: "",
      role: 'surveyor',
      active: true,
    });
    setSelectedUser(null);
    setIsUserDialogOpen(true);
    setShowPassword(false);
  };
  
  // Open dialog to edit existing user
  const openEditUserDialog = (user: User) => {
    form.reset({
      username: user.username,
      name: user.name,
      email: user.email,
      password: "", // Don't populate password for security
      role: user.role,
      active: user.active,
    });
    setSelectedUser(user);
    setIsUserDialogOpen(true);
    setShowPassword(false);
  };
  
  // Open dialog to confirm user deletion
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle user form submission (create or update)
  const onSubmit = async (values: z.infer<typeof userFormSchema>) => {
    setIsSubmitting(true);
    
    try {
      if (selectedUser) {
        // Update existing user - ensure all required properties are passed
        await updateUser(selectedUser.id, {
          username: values.username,
          name: values.name,
          email: values.email,
          password: values.password || undefined, // Only update if provided
          role: values.role,
          active: values.active
        });
        toast.success("Usuario actualizado correctamente");
      } else {
        // Create new user
        await createUser({
          username: values.username,
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          active: values.active
        });
        toast.success("Usuario creado correctamente");
      }
      
      setIsUserDialogOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar usuario");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle user deletion
  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteUser(selectedUser.id);
      toast.success("Usuario eliminado correctamente");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error al eliminar usuario");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Display role badge with appropriate color
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin-manager':
        return <Badge className="bg-red-500">Administrador Principal</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500">Administrador</Badge>;
      case 'surveyor':
        return <Badge className="bg-green-500">Encuestador</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar usuarios..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={openAddUserDialog} className="btn-admin shrink-0 w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-admin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map(user => (
            <Card key={user.id} className="hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {user.name}
                      {!user.active && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactivo
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  {getRoleBadge(user.role)}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nombre de usuario</p>
                    <p>{user.username}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha de creación</p>
                    <p>{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditUserDialog(user)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                {user.role !== 'admin-manager' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(user)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
          
          {filteredUsers.length === 0 && (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center pt-10 pb-10">
                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                {searchQuery ? (
                  <p className="text-muted-foreground text-center">
                    No se encontraron usuarios que coincidan con "{searchQuery}"
                  </p>
                ) : (
                  <p className="text-muted-foreground text-center">
                    No hay usuarios disponibles. Crea un nuevo usuario para comenzar.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Create/Edit User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? "Actualiza la información y permisos del usuario" 
                : "Completa los campos para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre de usuario para iniciar sesión
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre Apellido" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre que se mostrará en la aplicación
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="ejemplo@correo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedUser ? "Nueva Contraseña" : "Contraseña"}</FormLabel>
                    <div className="flex relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder={selectedUser ? "Dejar en blanco para mantener actual" : "Contraseña"} 
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
                      {selectedUser ? "Dejar en blanco para no cambiar la contraseña actual" : "Mínimo 6 caracteres"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="surveyor">Encuestador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="admin-manager">Administrador Principal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determina los permisos del usuario
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Usuario Activo</FormLabel>
                      <FormDescription>
                        Los usuarios inactivos no pueden iniciar sesión
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsUserDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="btn-admin"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {selectedUser ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      {selectedUser ? "Guardar Cambios" : "Crear Usuario"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a {selectedUser?.name}. 
              Esta operación no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteUser();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
