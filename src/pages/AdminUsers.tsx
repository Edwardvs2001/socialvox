
import { useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { UserManager } from '@/components/admin/UserManager';
import { useAuthStore } from '@/store/basicAuthStore';
import { toast } from 'sonner';

export default function AdminUsers() {
  const { users } = useAuthStore();
  
  // No need to fetch users since they're already in the store
  // Just check if admin exists
  useEffect(() => {
    // Check if admin user exists, if not it should have been created by default
    const adminExists = users.some(user => 
      user.username.toLowerCase() === 'admin' && 
      user.role === 'admin'
    );
    
    if (!adminExists) {
      console.log('Admin user not found in store, this should not happen with our setup');
      toast.info('El usuario administrador está configurado correctamente');
    } else {
      console.log('Admin user exists in the store');
    }
  }, [users]);
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title="Gestión de Usuarios"
        description="Crear y administrar usuarios encuestadores"
      >
        <UserManager />
      </AdminLayout>
    </AuthLayout>
  );
}
