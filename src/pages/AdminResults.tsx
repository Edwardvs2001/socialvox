
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyResults } from '@/components/admin/SurveyResults';
import { useSurveyStore } from '@/store/surveyStore';

export default function AdminResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSurveyById } = useSurveyStore();
  const survey = id ? getSurveyById(id) : null;
  
  // Redirect if survey doesn't exist
  useEffect(() => {
    if (!survey) {
      navigate('/admin/surveys');
    }
  }, [survey, navigate]);
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title={`Resultados: ${survey?.title || ''}`}
        description="Visualización de los resultados de la encuesta"
        backButton={{
          label: "Volver a Encuestas",
          to: "/admin/surveys"
        }}
      >
        {survey && <SurveyResults surveyId={id!} />}
      </AdminLayout>
    </AuthLayout>
  );
}
