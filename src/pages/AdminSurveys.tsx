
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyManager } from '@/components/admin/SurveyManager';
import { Suspense, useEffect, useState } from 'react';
import { useSurveyStore } from '@/store/surveyStore';

export default function AdminSurveys() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { fetchSurveys, clearError } = useSurveyStore();
  
  // Ensure surveys are loaded before mounting the component
  useEffect(() => {
    let isMounted = true;
    
    const loadSurveys = async () => {
      try {
        await fetchSurveys();
        clearError(); // Clear any previous errors
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };
    
    loadSurveys();
    
    // Make sure to clean up by clearing any errors when unmounting
    return () => {
      isMounted = false;
      clearError();
    };
  }, [fetchSurveys, clearError]);
  
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
