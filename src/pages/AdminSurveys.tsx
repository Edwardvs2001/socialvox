
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyManager } from '@/components/admin/SurveyManager';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useSurveyStore } from '@/store/surveyStore';

export default function AdminSurveys() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { fetchSurveys, clearError } = useSurveyStore();
  const loadingRef = useRef(false);
  const isMounted = useRef(true);
  
  // Ensure surveys are loaded before mounting the component
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    // Prevent duplicate loading
    if (loadingRef.current) return;
    
    const loadSurveys = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      
      try {
        // Always fetch fresh data when the component mounts
        await fetchSurveys();
        clearError(); // Clear any previous errors
      } finally {
        if (isMounted.current) {
          setIsLoaded(true);
          loadingRef.current = false;
        }
      }
    };
    
    loadSurveys();
    
    // Make sure to clean up by clearing any errors when unmounting
    return () => {
      isMounted.current = false;
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
