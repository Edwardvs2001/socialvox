
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useAuthStore } from '@/store/authStore';

export default function Admin() {
  const { user } = useAuthStore();
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout title={`Encuestas VA - Panel Principal`} description={`Bienvenido, ${user?.name}`}>
        <AdminDashboard />
      </AdminLayout>
    </AuthLayout>
  );
}
