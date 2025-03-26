
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyManager } from '@/components/admin/SurveyManager';
import { Suspense, useEffect, useState } from 'react';
import { useSurveyStore } from '@/store/surveyStore';

export default function AdminSurveys() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { fetchSurveys } = useSurveyStore();
  
  // Ensure surveys are loaded before mounting the component
  useEffect(() => {
    const loadSurveys = async () => {
      try {
        await fetchSurveys();
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadSurveys();
  }, [fetchSurveys]);
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title="Gestión de Encuestas"
        description="Crear, editar y administrar encuestas"
      >
        <Suspense fallback={<div>Cargando...</div>}>
          {isLoaded && <SurveyManager />}
        </Suspense>
      </AdminLayout>
    </AuthLayout>
  );
}
