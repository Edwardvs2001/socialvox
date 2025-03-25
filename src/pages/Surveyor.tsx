
import { SurveyorLayout } from '@/components/layout/SurveyorLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyList } from '@/components/surveyor/SurveyList';
import { useAuthStore } from '@/store/authStore';

export default function Surveyor() {
  const { user } = useAuthStore();
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['surveyor']}>
      <SurveyorLayout
        title={`Bienvenido, ${user?.name}`}
        description="Estas son las encuestas asignadas a ti"
      >
        <SurveyList />
      </SurveyorLayout>
    </AuthLayout>
  );
}
