
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyManager } from '@/components/admin/SurveyManager';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useSurveyStore } from '@/store/surveyStore';

export default function AdminSurveys() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { fetchSurveys } = useSurveyStore();
  const hasLoadedRef = useRef(false);
  
  // Ensure surveys are loaded before mounting the component
  useEffect(() => {
    const loadSurveys = async () => {
      if (hasLoadedRef.current) return;
      
      try {
        await fetchSurveys();
      } finally {
        setIsLoaded(true);
        hasLoadedRef.current = true;
      }
    };
    
    loadSurveys();
    
    // Clear the ref on unmount to ensure proper reloading if the component is revisited
    return () => {
      hasLoadedRef.current = false;
    };
  }, [fetchSurveys]);
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title="Gestión de Encuestas"
        description="Crear, editar y administrar encuestas"
      >
        <Suspense fallback={<div>Cargando...</div>}>
          {isLoaded && <SurveyManager key="survey-manager" />}
        </Suspense>
      </AdminLayout>
    </AuthLayout>
  );
}
