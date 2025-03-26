
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyResults } from '@/components/admin/SurveyResults';
import { useSurveyStore } from '@/store/surveyStore';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, AlertCircle } from 'lucide-react';

export default function AdminResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSurveyById, getSurveyResponses } = useSurveyStore();
  const survey = id ? getSurveyById(id) : null;
  const responses = id ? getSurveyResponses(id) : [];
  
  // Check if any responses have location data
  const hasLocationData = responses.some(
    response => response.location && 
    response.location.latitude !== null && 
    response.location.longitude !== null
  );
  
  // Check for responses with low accuracy
  const lowPrecisionResponses = responses.filter(
    response => response.location && 
    response.location.accuracy !== null && 
    response.location.accuracy > 100
  ).length;
  
  // Redirect if survey doesn't exist
  useEffect(() => {
    if (!survey) {
      navigate('/admin/results');
    }
  }, [survey, navigate]);
  
  return (
    <AuthLayout requiresAuth={true} allowedRoles={['admin', 'admin-manager']}>
      <AdminLayout
        title={`Resultados: ${survey?.title || ''}`}
        description="Visualización de los resultados de la encuesta"
        backButton={{
          label: "Volver a Encuestas",
          to: "/admin/results"
        }}
      >
        {!hasLocationData && responses.length > 0 && (
          <Alert className="mb-6">
            <MapPin className="h-4 w-4" />
            <AlertTitle>Sin datos de ubicación</AlertTitle>
            <AlertDescription>
              Esta encuesta no tiene datos de ubicación disponibles. Esto puede deberse a que las encuestas fueron 
              realizadas sin acceso a la ubicación o con versiones anteriores de la aplicación.
            </AlertDescription>
          </Alert>
        )}
        
        {lowPrecisionResponses > 0 && (
          <Alert className="mb-6" variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Precisión de ubicación limitada</AlertTitle>
            <AlertDescription>
              {lowPrecisionResponses} {lowPrecisionResponses === 1 ? 'respuesta tiene' : 'respuestas tienen'} una precisión 
              de ubicación superior a 100 metros. Esto puede afectar la exactitud de los análisis basados en ubicación.
            </AlertDescription>
          </Alert>
        )}
        
        {survey && <SurveyResults surveyId={id!} />}
      </AdminLayout>
    </AuthLayout>
  );
}
