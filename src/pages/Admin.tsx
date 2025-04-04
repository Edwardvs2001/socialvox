
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Admin() {
  const { user } = useAuthStore();
  const { users, fetchUsers } = useUserStore();
  const [adminUser, setAdminUser] = useState<any>(null);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  useEffect(() => {
    // Find admin user to check password status
    const admin = users.find(u => u.username.toLowerCase() === 'admin');
    setAdminUser(admin);
  }, [users]);
  
  const showPasswordWarning = adminUser && !adminUser.password;
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout title={`Encuestas VA - Panel Principal`} description={`Bienvenido, ${user?.name}`}>
        {showPasswordWarning && (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200 text-yellow-800 mb-6">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle>Alerta de seguridad</AlertTitle>
            <AlertDescription>
              El usuario administrador no tiene contraseña configurada. Se recomienda establecer una contraseña 
              en la sección de Configuración para mayor seguridad.
            </AlertDescription>
          </Alert>
        )}
        <AdminDashboard />
      </AdminLayout>
    </AuthLayout>
  );
}
