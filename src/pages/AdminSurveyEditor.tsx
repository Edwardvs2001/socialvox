
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyEditor } from '@/components/admin/SurveyEditor';
import { useSurveyStore } from '@/store/surveyStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

export default function AdminSurveyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getSurveyById } = useSurveyStore();
  const { fetchUsers } = useUserStore();
  const isNewSurvey = !id || id === 'new';
  const survey = isNewSurvey ? null : getSurveyById(id);
  
  // Cargar usuarios para poder asignar encuestadores
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Redirect if editing a survey that doesn't exist
  useEffect(() => {
    if (!isNewSurvey && !survey) {
      navigate('/admin/surveys');
    }
  }, [isNewSurvey, survey, navigate]);
  
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
