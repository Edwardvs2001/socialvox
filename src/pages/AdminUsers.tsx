
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { UserManager } from '@/components/admin/UserManager';

export default function AdminUsers() {
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
