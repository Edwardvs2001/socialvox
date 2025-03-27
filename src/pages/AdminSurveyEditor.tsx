
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyEditor } from '@/components/admin/SurveyEditor';
import { useSurveyStore } from '@/store/surveyStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { Loader2 } from 'lucide-react';

export default function AdminSurveyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getSurveyById, isLoading } = useSurveyStore();
  const { fetchUsers } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);
  
  const isNewSurvey = !id || id === 'new';
  const survey = isNewSurvey ? null : getSurveyById(id);
  
  // Load users so we can assign surveyors
  useEffect(() => {
    const initialize = async () => {
      try {
        await fetchUsers();
        setIsInitialized(true);
      } catch (error) {
        console.error("Error fetching users:", error);
        setIsInitialized(true); // Continue despite error
      }
    };
    
    initialize();
  }, [fetchUsers]);
  
  // Redirect if editing a survey that doesn't exist
  useEffect(() => {
    if (!isNewSurvey && !survey && !isLoading && isInitialized) {
      navigate('/admin/surveys');
    }
  }, [isNewSurvey, survey, navigate, isLoading, isInitialized]);
  
  if (!isInitialized || (isLoading && !isNewSurvey)) {
    return (
      <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
        <AdminLayout
          title="Cargando..."
          description="Obteniendo información de la encuesta"
        >
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-admin" />
          </div>
        </AdminLayout>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title={isNewSurvey ? "Crear Nueva Encuesta" : "Editar Encuesta"}
        description={isNewSurvey 
          ? "Crea una nueva encuesta para recopilar información" 
          : "Modifica los detalles y preguntas de la encuesta"}
        backButton={{
          label: "Volver a Encuestas",
          to: "/admin/surveys"
        }}
      >
        <SurveyEditor surveyId={isNewSurvey ? null : id} />
      </AdminLayout>
    </AuthLayout>
  );
}
