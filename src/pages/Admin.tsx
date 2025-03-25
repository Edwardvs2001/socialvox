
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardOverview } from '@/components/admin/DashboardOverview';
import { useAuthStore } from '@/store/authStore';

export default function Admin() {
  const { user } = useAuthStore();
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout title={`Bienvenido, ${user?.name}`}>
        <DashboardOverview />
      </AdminLayout>
    </AuthLayout>
  );
}
