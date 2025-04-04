
import { SurveyorLayout } from '@/components/layout/SurveyorLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyList } from '@/components/surveyor/SurveyList';
import { useAuthStore } from '@/store/authStore';

export default function Surveyor() {
  const { user } = useAuthStore();
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['surveyor']}>
      <SurveyorLayout
        title={`Bienvenido a Encuestas VA - Área de Encuestadores`}
        description={`Hola, ${user?.name}. Estas son las encuestas asignadas a ti.`}
        showSurveyorHeader={true}
      >
        <SurveyList />
      </SurveyorLayout>
    </AuthLayout>
  );
}
