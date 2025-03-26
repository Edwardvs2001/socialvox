
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyManager } from '@/components/admin/SurveyManager';

export default function AdminSurveys() {
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin']}>
      <AdminLayout
        title="Gestión de Encuestas"
        description="Crear, editar y administrar encuestas"
      >
        <SurveyManager />
      </AdminLayout>
    </AuthLayout>
  );
}
