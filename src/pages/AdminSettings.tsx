
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ConfigurationManager } from '@/components/admin/ConfigurationManager';

export default function AdminSettings() {
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title="Configuración del Sistema"
        description="Administrar configuraciones generales de la aplicación"
      >
        <ConfigurationManager />
      </AdminLayout>
    </AuthLayout>
  );
}
