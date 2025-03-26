
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SurveyResults } from '@/components/admin/SurveyResults';
import { useSurveyStore } from '@/store/surveyStore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function AdminResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSurveyById } = useSurveyStore();
  const survey = id ? getSurveyById(id) : null;
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  
  // Redirect if survey doesn't exist
  useEffect(() => {
    if (!survey) {
      navigate('/admin/surveys');
    }
  }, [survey, navigate]);

  // Handle location accuracy warning from the SurveyResults component
  const handleLowAccuracy = (hasLowAccuracy: boolean) => {
    setShowLocationWarning(hasLowAccuracy);
  };
  
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
        {showLocationWarning && (
          <Alert 
            variant="destructive" 
            className="mb-4 border-yellow-500 bg-yellow-50 text-yellow-800"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Precisión de ubicación baja</AlertTitle>
            <AlertDescription>
              Algunas respuestas tienen datos de ubicación con baja precisión. 
              Esto puede afectar la exactitud de las direcciones mostradas.
            </AlertDescription>
          </Alert>
        )}
        
        {survey && <SurveyResults surveyId={id!} onLowAccuracy={handleLowAccuracy} />}
      </AdminLayout>
    </AuthLayout>
  );
}
